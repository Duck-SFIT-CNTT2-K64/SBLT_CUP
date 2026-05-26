import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCORING } from "@/lib/constants";
import { auditLog } from "@/lib/audit";
import { sseManager, SSE_EVENTS } from "@/lib/sse";
import { logger } from "@/lib/logger";
import { invalidateTournament, invalidateLeaderboard, invalidatePredictionLeaderboard } from "@/lib/cache-invalidate";
import { scorePredictionsForStage } from "@/lib/predictions";
import { rankGroupPlayers } from "@/lib/stage-ranking";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const { gameId } = await params;

  const results = await prisma.gameResult.findMany({
    where: { gameId },
    include: { player: true },
    orderBy: { placement: "asc" },
  });

  return NextResponse.json(results);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; gameId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId, gameId } = await params;
  const body = await req.json();
  const { results } = body;

  try {
    // C-01: Verify game belongs to this tournament
    const game = await prisma.game.findFirst({
      where: { id: gameId, group: { stage: { tournamentId } } },
    });
    if (!game) {
      return NextResponse.json({ error: "Không tìm thấy trận đấu" }, { status: 404 });
    }

    // B-07: Validate placements
    if (!Array.isArray(results) || results.length === 0) {
      return NextResponse.json({ error: "Kết quả không hợp lệ" }, { status: 400 });
    }
    const placements = results.map((r: { placement: number }) => r.placement);
    if (placements.some((p: number) => !Number.isInteger(p) || p < 1 || p > 8)) {
      return NextResponse.json({ error: "Placement phải từ 1 đến 8" }, { status: 400 });
    }
    if (new Set(placements).size !== placements.length) {
      return NextResponse.json({ error: "Không được có placement trùng nhau" }, { status: 400 });
    }
    // Validate contiguous placements 1..N
    const sortedPlacements = [...placements].sort((a, b) => a - b);
    for (let i = 0; i < sortedPlacements.length; i++) {
      if (sortedPlacements[i] !== i + 1) {
        return NextResponse.json({ error: `Placement phải là dãy liên tục từ 1 đến ${sortedPlacements.length}` }, { status: 400 });
      }
    }

    // Verify playerIds belong to the group
    const groupPlayers = await prisma.groupPlayer.findMany({
      where: { groupId: game.groupId },
      select: { playerId: true },
    });
    const validPlayerIds = new Set(groupPlayers.map((gp) => gp.playerId));
    const invalidPlayers = results.filter((r: { playerId: string }) => !validPlayerIds.has(r.playerId));
    if (invalidPlayers.length > 0) {
      return NextResponse.json(
        { error: `Có ${invalidPlayers.length} tuyển thủ không thuộc bảng đấu này` },
        { status: 400 }
      );
    }

    // Verify result count matches group player count
    if (results.length !== groupPlayers.length) {
      return NextResponse.json(
        { error: `Cần nhập kết quả cho đúng ${groupPlayers.length} tuyển thủ (hiện tại: ${results.length})` },
        { status: 400 }
      );
    }

    // Snapshot before state for audit
    const before = await prisma.gameResult.findMany({ where: { gameId }, include: { player: { select: { ign: true } } } });

    // B-02: Wrap in transaction for atomicity
    await prisma.$transaction(async (tx) => {
      await tx.gameResult.deleteMany({ where: { gameId } });

      await Promise.all(
        results.map((r: { playerId: string; placement: number }) =>
          tx.gameResult.create({
            data: {
              gameId,
              playerId: r.playerId,
              placement: r.placement,
              points: SCORING[r.placement] || 0,
            },
          })
        )
      );

      await tx.game.update({ where: { id: gameId }, data: { status: "COMPLETED" } });

      const game = await tx.game.findUnique({ where: { id: gameId } });
      if (game) {
        // 1 query aggregate thay vì N query per player
        const totals = await tx.$queryRaw<{ playerId: string; total: bigint }[]>`
          SELECT gr."playerId", COALESCE(SUM(gr.points), 0)::bigint AS total
          FROM "GameResult" gr
          JOIN "Game" g ON g.id = gr."gameId"
          WHERE g."groupId" = ${game.groupId}
          GROUP BY gr."playerId"
        `;
        // Batch update tất cả groupPlayer trong 1 lần
        await Promise.all(
          totals.map((t) =>
            tx.groupPlayer.update({
              where: { groupId_playerId: { groupId: game.groupId, playerId: t.playerId } },
              data: { totalPoints: Number(t.total) },
            })
          )
        );
      }
    });

    const created = await prisma.gameResult.findMany({ where: { gameId } });

    // Audit log
    await auditLog({
      userId: session.user.id,
      action: before.length > 0 ? "UPDATE_GAME_RESULTS" : "CREATE_GAME_RESULTS",
      entityType: "Game",
      entityId: gameId,
      before: before.map((r) => ({ ign: (r.player as { ign: string }).ign, placement: r.placement, points: r.points })),
      after: results.map((r: { playerId: string; placement: number }) => ({ playerId: r.playerId, placement: r.placement, points: SCORING[r.placement] || 0 })),
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    // Broadcast SSE event for real-time updates
    sseManager.broadcastToTournament(tournamentId, SSE_EVENTS.GAME_RESULT, {
      gameId,
      results: created,
      timestamp: new Date().toISOString(),
    });

    await invalidateTournament(tournamentId);
    await invalidateLeaderboard();

    // Auto-trigger: if all games in the stage are COMPLETED, set finalRank and score predictions
    try {
      const stage = await prisma.stage.findFirst({
        where: { tournamentId, groups: { some: { games: { some: { id: gameId } } } } },
        select: { id: true, status: true },
      });
      if (stage && stage.status !== "COMPLETED") {
        const allGames = await prisma.game.findMany({
          where: { group: { stageId: stage.id } },
          select: { status: true },
        });
        const allCompleted = allGames.length > 0 && allGames.every((g) => g.status === "COMPLETED");
        if (allCompleted) {
          // Compute finalRank before marking COMPLETED
          const stageWithGroups = await prisma.stage.findUnique({
            where: { id: stage.id },
            include: {
              groups: {
                include: {
                  players: {
                    include: {
                      player: true,
                      group: { include: { games: { include: { results: true } } } },
                    },
                  },
                  games: { include: { results: true } },
                },
              },
            },
          });

          if (stageWithGroups) {
            await prisma.$transaction(async (tx) => {
              for (const group of stageWithGroups.groups) {
                const ranked = rankGroupPlayers(group);
                await Promise.all(
                  ranked.map((rp, i) =>
                    tx.groupPlayer.update({
                      where: { id: rp.groupPlayerId },
                      data: { finalRank: i + 1 },
                    })
                  )
                );
              }
              await tx.stage.update({
                where: { id: stage.id },
                data: { status: "COMPLETED" },
              });
            });
          } else {
            await prisma.stage.update({
              where: { id: stage.id },
              data: { status: "COMPLETED" },
            });
          }

          try {
            const { scored, skippedGroups } = await scorePredictionsForStage(stage.id);
            if (skippedGroups > 0) {
              logger.error(`[PREDICTION AUTO-SCORING] ${skippedGroups} groups were skipped due to missing finalRank.`);
            }
            if (scored > 0) {
              logger.info(`[PREDICTION AUTO-SCORING] ${scored} predictions scored for stage ${stage.id}.`);
            }
          } catch (err) {
            logger.error("[PREDICTION AUTO-SCORING ERROR]", err instanceof Error ? err : new Error(String(err)));
          }
          sseManager.broadcastToTournament(tournamentId, SSE_EVENTS.STAGE_UPDATE, {
            stageId: stage.id,
            status: "COMPLETED",
            timestamp: new Date().toISOString(),
          });
          await invalidatePredictionLeaderboard();
        }
      }
    } catch (err) {
      logger.error("[AUTO-STAGE-COMPLETE ERROR]", err instanceof Error ? err : new Error(String(err)));
    }

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    logger.error("Failed to save results", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json({ error: "Đã xảy ra lỗi khi lưu kết quả" }, { status: 500 });
  }
}
