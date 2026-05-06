import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { SCORING } from "@/lib/constants";
import { auditLog } from "@/lib/audit";

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

    return NextResponse.json(created, { status: 201 });
  } catch (error) {
    console.error("Failed to save results:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi lưu kết quả" }, { status: 500 });
  }
}
