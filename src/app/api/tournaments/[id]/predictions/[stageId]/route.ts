import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { PREDICTABLE_STAGES } from "@/lib/constants";
import { computePredictionStatus, getPredictionWindow, getWarmupPredictionWindow } from "@/lib/predictions";
import { invalidatePredictionLeaderboard } from "@/lib/cache-invalidate";
import { checkRateLimit } from "@/lib/rate-limit";
import { computeRating } from "@/lib/rating";

/**
 * GET /api/tournaments/[id]/predictions/[stageId]
 * Trả về form dữ liệu dự đoán + prediction hiện có của user.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId, stageId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      groups: {
        include: {
          players: {
            include: { player: { select: { id: true, ign: true, isGuest: true } } },
          },
        },
      },
    },
  });

  if (!stage || stage.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  if (!PREDICTABLE_STAGES.includes(stage.stageType)) {
    return NextResponse.json({ error: "Vòng đấu này không hỗ trợ dự đoán" }, { status: 400 });
  }

  const hasPlayers = stage.groups.some((g) => g.players.length > 0);
  const { predictionStatus, lockedReason, windowOpensAt, windowClosesAt } = computePredictionStatus(stage, hasPlayers);

  // Tìm prediction hiện có
  const existingPrediction = await prisma.prediction.findUnique({
    where: { userId_stageId: { userId: session.user.id, stageId } },
    include: {
      entries: {
        select: {
          groupId: true,
          rank1PlayerId: true,
          rank2PlayerId: true,
          rank3PlayerId: true,
          rank4PlayerId: true,
        },
      },
    },
  });

  // Fetch player stats for rating
  const playerIds = stage.groups.flatMap((g) => g.players.map((gp) => gp.player.id));
  const playerStats = playerIds.length > 0
    ? await prisma.$queryRaw<
        {
          id: string;
          rank: string | null;
          avatar: string | null;
          totalPoints: bigint;
          totalGames: bigint;
          top1Count: bigint;
          top4Count: bigint;
          avgPlacement: number | null;
        }[]
      >`
        SELECT
          p.id,
          p.rank,
          u.avatar,
          COALESCE(SUM(gr.points), 0)              AS "totalPoints",
          COUNT(gr.id)                               AS "totalGames",
          COUNT(*) FILTER (WHERE gr.placement = 1)   AS "top1Count",
          COUNT(*) FILTER (WHERE gr.placement <= 4)  AS "top4Count",
          ROUND(AVG(gr.placement)::numeric, 1)       AS "avgPlacement"
        FROM "Player" p
        JOIN "User" u ON u.id = p."userId"
        LEFT JOIN "GameResult" gr ON gr."playerId" = p.id
        WHERE p.id IN (${Prisma.join(playerIds)})
        GROUP BY p.id, p.rank, u.avatar
      `
    : [];

  const statsMap = new Map(
    playerStats.map((s) => [
      s.id,
      {
        rank: s.rank,
        avatar: s.avatar,
        totalPoints: Number(s.totalPoints),
        totalGames: Number(s.totalGames),
        top1Count: Number(s.top1Count),
        top4Count: Number(s.top4Count),
        avgPlacement: s.avgPlacement ?? 8,
      },
    ])
  );
  const maxTotalPoints = Math.max(0, ...[...statsMap.values()].map((s) => s.totalPoints));

  return NextResponse.json({
    stageId: stage.id,
    stageName: stage.name,
    stageType: stage.stageType,
    predictionStatus,
    lockedReason,
    windowOpensAt,
    windowClosesAt,
    groups: stage.groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      players: g.players.map((gp) => {
        const stats = statsMap.get(gp.player.id);
        return {
          id: gp.player.id,
          ign: gp.player.ign,
          isGuest: gp.player.isGuest,
          rank: stats?.rank ?? null,
          avatar: stats?.avatar ?? null,
          rating: stats ? computeRating({ ...stats, maxTotalPoints }) : null,
          totalGames: stats?.totalGames ?? 0,
          top4Rate: stats && stats.totalGames > 0
            ? Math.round((stats.top4Count / stats.totalGames) * 100)
            : null,
        };
      }),
    })),
    existingPrediction: existingPrediction
      ? {
          id: existingPrediction.id,
          status: existingPrediction.status,
          totalScore: existingPrediction.totalScore,
          entries: existingPrediction.entries,
        }
      : null,
  });
}

/**
 * POST /api/tournaments/[id]/predictions/[stageId]
 * Gửi hoặc cập nhật dự đoán cho một stage.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId, stageId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  // Rate limit: 10 submissions per minute per user per stage
  const rateLimitResult = await checkRateLimit({
    key: `predict:${session.user.id}:${stageId}`,
    limit: 10,
    windowSeconds: 60,
  });
  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429 }
    );
  }

  // Global rate limit: 300 requests/minute across all users per stage
  const globalLimit = await checkRateLimit({
    key: `predict:global:${stageId}`,
    limit: 300,
    windowSeconds: 60,
  });
  if (!globalLimit.allowed) {
    return NextResponse.json(
      { error: "Hệ thống đang quá tải. Vui lòng thử lại sau vài giây." },
      { status: 429 }
    );
  }

  const body = await req.json();
  const { entries } = body;

  if (!Array.isArray(entries) || entries.length === 0) {
    return NextResponse.json({ error: "Dữ liệu dự đoán không hợp lệ" }, { status: 400 });
  }

  // Validate stage
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      groups: {
        include: {
          players: { select: { playerId: true } },
        },
      },
    },
  });

  if (!stage || stage.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  if (!PREDICTABLE_STAGES.includes(stage.stageType)) {
    return NextResponse.json({ error: "Vòng đấu này không hỗ trợ dự đoán" }, { status: 400 });
  }

  // Kiểm tra cửa sổ dự đoán: phải là SCHEDULED và đã có players
  if (stage.status !== "SCHEDULED") {
    return NextResponse.json(
      { error: "Dự đoán đã bị khóa. Vòng đấu đã bắt đầu hoặc kết thúc." },
      { status: 403 }
    );
  }

  // Kiểm tra cửa sổ thời gian dự đoán
  const window = stage.stageType === "WARMUP"
    ? getWarmupPredictionWindow(stage.date, stage.startTime || "20:30")
    : getPredictionWindow(stage.date);
  if (!window.isOpen) {
    const now = new Date();
    const msg = now < new Date(window.windowOpensAt)
      ? `Cửa sổ dự đoán chưa mở. Dự đoán sẽ mở lúc ${new Date(window.windowOpensAt).toLocaleTimeString("vi-VN", { hour: "2-digit", minute: "2-digit", timeZone: "Asia/Ho_Chi_Minh" })}.`
      : "Cửa sổ dự đoán đã đóng.";
    return NextResponse.json({ error: msg }, { status: 403 });
  }

  const hasPlayers = stage.groups.some((g) => g.players.length > 0);
  if (!hasPlayers) {
    return NextResponse.json(
      { error: "Chưa thể dự đoán. Các bảng đấu chưa được bốc thăm." },
      { status: 400 }
    );
  }

  // Tìm player profile
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Bạn cần có hồ sơ người chơi để dự đoán" },
      { status: 400 }
    );
  }

  // Validate entries: phải đủ tất cả groups
  const groupIds = new Set(stage.groups.map((g) => g.id));
  const entryGroupIds = new Set(entries.map((e: { groupId: string }) => e.groupId));

  if (groupIds.size !== entryGroupIds.size) {
    return NextResponse.json(
      { error: `Phải dự đoán cho tất cả ${groupIds.size} bảng đấu` },
      { status: 400 }
    );
  }

  for (const gid of groupIds) {
    if (!entryGroupIds.has(gid)) {
      return NextResponse.json(
        { error: `Thiếu dự đoán cho bảng ${gid}` },
        { status: 400 }
      );
    }
  }

  // Validate từng entry
  for (const entry of entries) {
    const { groupId, rank1PlayerId, rank2PlayerId, rank3PlayerId, rank4PlayerId } = entry;
    const playerIds = [rank1PlayerId, rank2PlayerId, rank3PlayerId, rank4PlayerId];

    // 4 player phải khác nhau
    if (new Set(playerIds).size !== 4) {
      return NextResponse.json(
        { error: "Mỗi bảng phải chọn 4 tuyển thủ khác nhau cho top 1-4" },
        { status: 400 }
      );
    }

    // Kiểm tra player thuộc group
    const group = stage.groups.find((g) => g.id === groupId);
    if (!group) {
      return NextResponse.json({ error: `Bảng đấu ${groupId} không tồn tại` }, { status: 400 });
    }

    const groupPlayerIds = new Set(group.players.map((p) => p.playerId));
    for (const pid of playerIds) {
      if (!groupPlayerIds.has(pid)) {
        return NextResponse.json(
          { error: `Tuyển thủ ${pid} không thuộc bảng đấu này` },
          { status: 400 }
        );
      }
    }
  }

  // Upsert prediction trong transaction
  const prediction = await prisma.$transaction(async (tx) => {
    // Tìm hoặc tạo prediction
    const existing = await tx.prediction.findUnique({
      where: { userId_stageId: { userId: session.user.id, stageId } },
    });

    if (existing) {
      if (existing.status !== "OPEN") {
        throw new Error("LOCKED");
      }
      // Xóa entries cũ, tạo entries mới
      await tx.predictionEntry.deleteMany({ where: { predictionId: existing.id } });
      await tx.predictionEntry.createMany({
        data: entries.map((e: { groupId: string; rank1PlayerId: string; rank2PlayerId: string; rank3PlayerId: string; rank4PlayerId: string }) => ({
          predictionId: existing.id,
          groupId: e.groupId,
          rank1PlayerId: e.rank1PlayerId,
          rank2PlayerId: e.rank2PlayerId,
          rank3PlayerId: e.rank3PlayerId,
          rank4PlayerId: e.rank4PlayerId,
        })),
      });
      return existing;
    }

    // Tạo mới
    return tx.prediction.create({
      data: {
        userId: session.user.id,
        stageId,
        entries: {
          create: entries.map((e: { groupId: string; rank1PlayerId: string; rank2PlayerId: string; rank3PlayerId: string; rank4PlayerId: string }) => ({
            groupId: e.groupId,
            rank1PlayerId: e.rank1PlayerId,
            rank2PlayerId: e.rank2PlayerId,
            rank3PlayerId: e.rank3PlayerId,
            rank4PlayerId: e.rank4PlayerId,
          })),
        },
      },
    });
  }).catch(async (err) => {
    if (err.message === "LOCKED") {
      return null;
    }
    // P2002 = unique constraint violation (race condition: 2 request cùng user+stage)
    if (err?.code === "P2002") {
      return await prisma.$transaction(async (tx) => {
        const existing = await tx.prediction.findUnique({
          where: { userId_stageId: { userId: session.user.id, stageId } },
        });
        if (!existing || existing.status !== "OPEN") return null;
        await tx.predictionEntry.deleteMany({ where: { predictionId: existing.id } });
        await tx.predictionEntry.createMany({
          data: entries.map((e: { groupId: string; rank1PlayerId: string; rank2PlayerId: string; rank3PlayerId: string; rank4PlayerId: string }) => ({
            predictionId: existing.id,
            groupId: e.groupId,
            rank1PlayerId: e.rank1PlayerId,
            rank2PlayerId: e.rank2PlayerId,
            rank3PlayerId: e.rank3PlayerId,
            rank4PlayerId: e.rank4PlayerId,
          })),
        });
        return existing;
      });
    }
    throw err;
  });

  if (!prediction) {
    const existing = await prisma.prediction.findUnique({
      where: { userId_stageId: { userId: session.user.id, stageId } },
      select: { status: true },
    });

    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy dự đoán" }, { status: 404 });
    }

    const reason = existing.status === "LOCKED"
      ? "Vòng đấu đã bắt đầu, dự đoán đã bị khóa."
      : existing.status === "SCORED"
        ? "Dự đoán đã được chấm điểm, không thể chỉnh sửa."
        : "Dự đoán đã bị khóa. Không thể chỉnh sửa.";

    return NextResponse.json({ error: reason }, { status: 403 });
  }

  await invalidatePredictionLeaderboard();

  return NextResponse.json({
    message: "Dự đoán đã được lưu thành công!",
    predictionId: prediction.id,
  });
}
