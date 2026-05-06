import { NextRequest, NextResponse } from "next/server";
import { Prisma } from "@prisma/client";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leaderboard
 * Dùng Prisma groupBy để PostgreSQL tính toán aggregate — không load gameResults về RAM.
 * Chỉ lấy Top N players (mặc định 50).
 */
export async function GET(req: NextRequest) {
  const top = Math.min(Number(req.nextUrl.searchParams.get("top")) || 50, 200);

  // Bước 1: Aggregate trực tiếp trên DB — chỉ lấy playerId, _sum.points, _count
  const aggregated = await prisma.gameResult.groupBy({
    by: ["playerId"],
    where: {
      player: { isGuest: false },
    },
    _sum: { points: true },
    _count: { id: true },
    orderBy: { _sum: { points: "desc" } },
    take: top,
  });

  if (aggregated.length === 0) {
    return NextResponse.json([]);
  }

  const playerIds = aggregated.map((a) => a.playerId);
  const idsLiteral = Prisma.join(playerIds);

  // Bước 2: Lấy top1Count, top4Count, avgPlacement bằng raw query (1 query thay vì N query)
  const stats = await prisma.$queryRaw<
    { playerId: string; top1: bigint; top4: bigint; avgPlacement: number }[]
  >`
    SELECT
      "playerId",
      COUNT(*) FILTER (WHERE placement = 1) AS "top1",
      COUNT(*) FILTER (WHERE placement <= 4) AS "top4",
      ROUND(AVG(placement)::numeric, 1) AS "avgPlacement"
    FROM "GameResult"
    WHERE "playerId" IN (${idsLiteral})
    GROUP BY "playerId"
  `;

  const statsMap = new Map(stats.map((s) => [s.playerId, s]));

  // Bước 3: Lấy tên players (1 query)
  const players = await prisma.player.findMany({
    where: { id: { in: playerIds } },
    select: { id: true, ign: true, rank: true },
  });
  const playerMap = new Map(players.map((p) => [p.id, p]));

  // Bước 4: Lấy số tournament đã tham gia (1 query)
  const tournamentCounts = await prisma.$queryRaw<
    { playerId: string; count: bigint }[]
  >`
    SELECT r."playerId", COUNT(DISTINCT t.id) AS count
    FROM "Registration" r
    JOIN "Tournament" t ON t.id = r."tournamentId"
    WHERE r."playerId" IN (${idsLiteral}) AND r.status = 'APPROVED'
    GROUP BY r."playerId"
  `;
  const tournamentMap = new Map(tournamentCounts.map((t) => [t.playerId, Number(t.count)]));

  // Bước 5: Compose kết quả (chỉ map, không tính toán)
  const leaderboard = aggregated
    .map((agg) => {
      const p = playerMap.get(agg.playerId);
      const s = statsMap.get(agg.playerId);
      const totalPoints = agg._sum.points ?? 0;
      const totalGames = agg._count.id;
      const top1Count = s ? Number(s.top1) : 0;
      const top4Count = s ? Number(s.top4) : 0;
      const avgPlacement = s?.avgPlacement ?? 0;

      return {
        id: agg.playerId,
        ign: p?.ign ?? "?",
        rank: p?.rank ?? null,
        totalPoints,
        totalGames,
        top1Count,
        top4Count,
        avgPlacement,
        tournamentsPlayed: tournamentMap.get(agg.playerId) ?? 0,
        top4Rate: totalGames > 0 ? Math.round((top4Count / totalGames) * 100) : 0,
      };
    })
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.top1Count !== a.top1Count) return b.top1Count - a.top1Count;
      return a.avgPlacement - b.avgPlacement;
    });

  return NextResponse.json(leaderboard);
}
