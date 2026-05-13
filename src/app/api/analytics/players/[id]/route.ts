import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: playerId } = await params;

  const player = await prisma.player.findUnique({
    where: { id: playerId },
    include: {
      user: { select: { name: true, avatar: true } },
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Không tìm thấy tuyển thủ" }, { status: 404 });
  }

  // Get all game results for this player
  const gameResults = await prisma.gameResult.findMany({
    where: { playerId },
    include: {
      game: {
        include: {
          group: {
            include: {
              stage: {
                include: {
                  tournament: { select: { id: true, name: true, season: true } },
                },
              },
            },
          },
        },
      },
    },
    orderBy: { game: { startTime: "asc" } },
  });

  // Calculate statistics
  const totalGames = gameResults.length;
  const totalPoints = gameResults.reduce((sum: number, r) => sum + r.points, 0);
  const avgPoints = totalGames > 0 ? totalPoints / totalGames : 0;

  const top1Count = gameResults.filter((r) => r.placement === 1).length;
  const top4Count = gameResults.filter((r) => r.placement <= 4).length;
  const top1Rate = totalGames > 0 ? (top1Count / totalGames) * 100 : 0;
  const top4Rate = totalGames > 0 ? (top4Count / totalGames) * 100 : 0;

  // Performance by tournament
  const tournamentStats = new Map<
    string,
    {
      tournamentId: string;
      tournamentName: string;
      season: number;
      games: number;
      points: number;
      top1: number;
      top4: number;
    }
  >();

  for (const result of gameResults) {
    const tournament = result.game.group.stage.tournament;
    const key = tournament.id;

    if (!tournamentStats.has(key)) {
      tournamentStats.set(key, {
        tournamentId: tournament.id,
        tournamentName: tournament.name,
        season: tournament.season,
        games: 0,
        points: 0,
        top1: 0,
        top4: 0,
      });
    }

    const stats = tournamentStats.get(key)!;
    stats.games++;
    stats.points += result.points;
    if (result.placement === 1) stats.top1++;
    if (result.placement <= 4) stats.top4++;
  }

  // Performance trend (last 20 games)
  const recentResults = gameResults.slice(-20);
  let runningSum = 0;
  const trend = recentResults.map((r, i) => {
    runningSum += r.points;
    return {
      game: i + 1,
      points: r.points,
      placement: r.placement,
      cumulativeAvg: runningSum / (i + 1),
    };
  });

  // Placement distribution
  const placementDistribution = Array.from({ length: 8 }, (_, i) => ({
    placement: i + 1,
    count: gameResults.filter((r) => r.placement === i + 1).length,
  }));

  return NextResponse.json({
    player: {
      id: player.id,
      ign: player.ign,
      name: player.user.name,
      avatar: player.user.avatar,
      rank: player.rank,
    },
    stats: {
      totalGames,
      totalPoints,
      avgPoints: Math.round(avgPoints * 100) / 100,
      top1Count,
      top4Count,
      top1Rate: Math.round(top1Rate * 100) / 100,
      top4Rate: Math.round(top4Rate * 100) / 100,
    },
    tournamentStats: Array.from(tournamentStats.values()),
    trend,
    placementDistribution,
  }, {
    headers: { "Cache-Control": "public, s-maxage=120, stale-while-revalidate=600" },
  });
}
