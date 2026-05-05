import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/leaderboard
 * Aggregate player performance across all tournaments
 */
export async function GET() {
  // Get all players with their game results across all tournaments
  const players = await prisma.player.findMany({
    where: { isGuest: false },
    include: {
      user: { select: { name: true } },
      gameResults: {
        include: {
          game: {
            include: {
              group: {
                include: {
                  stage: {
                    include: { tournament: { select: { id: true, name: true, season: true } } },
                  },
                },
              },
            },
          },
        },
      },
      registrations: {
        where: { status: "APPROVED" },
        include: { tournament: { select: { id: true, name: true, season: true } } },
      },
    },
  });

  const leaderboard = players
    .map((player) => {
      const totalPoints = player.gameResults.reduce((sum, r) => sum + r.points, 0);
      const totalGames = player.gameResults.length;
      const top1Count = player.gameResults.filter((r) => r.placement === 1).length;
      const top4Count = player.gameResults.filter((r) => r.placement <= 4).length;
      const avgPlacement = totalGames > 0
        ? player.gameResults.reduce((sum, r) => sum + r.placement, 0) / totalGames
        : 0;
      const tournamentsPlayed = new Set(
        player.gameResults.map((r) => r.game.group.stage.tournament.id)
      ).size;

      return {
        id: player.id,
        ign: player.ign,
        rank: player.rank,
        totalPoints,
        totalGames,
        top1Count,
        top4Count,
        avgPlacement: Math.round(avgPlacement * 10) / 10,
        tournamentsPlayed,
        top4Rate: totalGames > 0 ? Math.round((top4Count / totalGames) * 100) : 0,
      };
    })
    .filter((p) => p.totalGames > 0)
    .sort((a, b) => {
      if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
      if (b.top1Count !== a.top1Count) return b.top1Count - a.top1Count;
      return a.avgPlacement - b.avgPlacement;
    });

  return NextResponse.json(leaderboard);
}
