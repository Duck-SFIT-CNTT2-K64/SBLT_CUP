import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      stages: {
        include: {
          groups: {
            include: {
              players: {
                include: { player: { select: { id: true, ign: true } } },
              },
              games: {
                include: {
                  results: {
                    include: { player: { select: { id: true, ign: true } } },
                  },
                },
              },
            },
          },
        },
      },
      registrations: {
        where: { status: "APPROVED" },
        include: { player: { select: { id: true, ign: true, isGuest: true } } },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  // Aggregate player stats across all stages
  const playerStatsMap = new Map<
    string,
    {
      playerId: string;
      ign: string;
      isGuest: boolean;
      totalGames: number;
      totalPoints: number;
      top1Count: number;
      top4Count: number;
      bestPlacement: number;
      stages: string[];
    }
  >();

  for (const stage of tournament.stages) {
    for (const group of stage.groups) {
      for (const game of group.games) {
        for (const result of game.results) {
          const key = result.playerId;

          if (!playerStatsMap.has(key)) {
            const registration = tournament.registrations.find(
              (r) => r.playerId === key
            );
            playerStatsMap.set(key, {
              playerId: key,
              ign: result.player.ign,
              isGuest: registration?.player.isGuest ?? false,
              totalGames: 0,
              totalPoints: 0,
              top1Count: 0,
              top4Count: 0,
              bestPlacement: 8,
              stages: [],
            });
          }

          const stats = playerStatsMap.get(key)!;
          stats.totalGames++;
          stats.totalPoints += result.points;
          if (result.placement === 1) stats.top1Count++;
          if (result.placement <= 4) stats.top4Count++;
          if (result.placement < stats.bestPlacement) {
            stats.bestPlacement = result.placement;
          }

          if (!stats.stages.includes(stage.id)) {
            stats.stages.push(stage.id);
          }
        }
      }
    }
  }

  // Convert to array and sort by total points
  const playerStats = Array.from(playerStatsMap.values())
    .map((stats) => ({
      ...stats,
      avgPoints:
        stats.totalGames > 0
          ? Math.round((stats.totalPoints / stats.totalGames) * 100) / 100
          : 0,
      top1Rate:
        stats.totalGames > 0
          ? Math.round((stats.top1Count / stats.totalGames) * 10000) / 100
          : 0,
      top4Rate:
        stats.totalGames > 0
          ? Math.round((stats.top4Count / stats.totalGames) * 10000) / 100
          : 0,
    }))
    .sort((a, b) => b.totalPoints - a.totalPoints);

  // Stage statistics
  const stageStats = tournament.stages.map((stage) => {
    const totalGames = stage.groups.reduce((sum, g) => sum + g.games.length, 0);
    const completedGames = stage.groups.reduce(
      (sum, g) => sum + g.games.filter((game) => game.status === "COMPLETED").length,
      0
    );
    const totalPlayers = stage.groups.reduce((sum, g) => sum + g.players.length, 0);

    return {
      stageId: stage.id,
      stageName: stage.name,
      stageType: stage.stageType,
      status: stage.status,
      totalGames,
      completedGames,
      totalPlayers,
      completionRate:
        totalGames > 0 ? Math.round((completedGames / totalGames) * 100) : 0,
    };
  });

  // Game statistics
  const allGames = tournament.stages.flatMap((s) =>
    s.groups.flatMap((g) => g.games)
  );
  const completedGames = allGames.filter((g) => g.status === "COMPLETED");

  // Average points per game
  const allResults = completedGames.flatMap((g) => g.results);
  const avgPointsPerGame =
    allResults.length > 0
      ? Math.round(
          (allResults.reduce((sum, r) => sum + r.points, 0) / allResults.length) * 100
        ) / 100
      : 0;

  return NextResponse.json({
    tournament: {
      id: tournament.id,
      name: tournament.name,
      season: tournament.season,
      status: tournament.status,
    },
    overview: {
      totalPlayers: tournament.registrations.length,
      guestPlayers: tournament.registrations.filter((r) => r.player.isGuest).length,
      regularPlayers: tournament.registrations.filter((r) => !r.player.isGuest).length,
      totalStages: tournament.stages.length,
      totalGames: allGames.length,
      completedGames: completedGames.length,
      avgPointsPerGame,
    },
    playerStats,
    stageStats,
  });
}
