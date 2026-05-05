import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/tournaments/[id]/stages/[stageId]/advance
 *
 * 1. Tính finalRank cho mỗi GroupPlayer trong stage này
 * 2. Chọn top N từ mỗi group (theo TOURNAMENT_FORMAT)
 * 3. Tự động thêm họ vào groups của stage tiếp theo
 * 4. Cập nhật stage status → COMPLETED
 *
 * Tiebreaker: totalPoints → top1Count → top4Count → best single game placement
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId, stageId } = await params;

  // Load stage with all data
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      groups: {
        include: {
          players: {
            include: {
              player: true,
              group: {
                include: {
                  games: {
                    include: { results: true },
                  },
                },
              },
            },
          },
          games: {
            include: { results: true },
          },
        },
      },
      tournament: {
        include: {
          stages: {
            orderBy: { stageOrder: "asc" },
          },
        },
      },
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  // B-12: Verify stage belongs to this tournament
  if (stage.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Vòng đấu không thuộc giải đấu này" }, { status: 400 });
  }

  // B-13: Check if stage is already COMPLETED
  if (stage.status === "COMPLETED") {
    return NextResponse.json({ error: "Vòng đấu đã hoàn thành trước đó" }, { status: 400 });
  }

  // B-05: Check all games are completed — must have results for every group player
  const allGames = stage.groups.flatMap((g) => g.games);
  const incompleteGames = allGames.filter((g) => {
    if (g.status !== "COMPLETED") return true;
    // Check partial results: each game should have results matching group player count
    const group = stage.groups.find((gr) => gr.games.some((gm) => gm.id === g.id));
    const expectedCount = group ? group.players.length : 0;
    return g.results.length < expectedCount;
  });
  if (incompleteGames.length > 0) {
    return NextResponse.json(
      { error: `Còn ${incompleteGames.length} trận chưa có kết quả đầy đủ. Vui lòng nhập đủ kết quả trước.` },
      { status: 400 }
    );
  }

  // Determine advancing count per group based on stage type
  const advancingPerGroup = getAdvancingCount(stage.stageType);

  // Find next stage
  const nextStage = stage.tournament.stages.find(
    (s) => s.stageOrder === stage.stageOrder + 1
  );

  // B-02: Wrap entire advance operation in transaction
  const result = await prisma.$transaction(async (tx) => {
    const advancingPlayers: { playerId: string; ign: string; fromGroup: string; rank: number }[] = [];

    // Process each group: rank players, set finalRank, collect top N
    for (const group of stage.groups) {
      const rankedPlayers = rankGroupPlayers(group);

      // Update finalRank for all players in this group
      for (let i = 0; i < rankedPlayers.length; i++) {
        await tx.groupPlayer.update({
          where: { id: rankedPlayers[i].groupPlayerId },
          data: { finalRank: i + 1 },
        });
      }

      // Collect top N advancing players
      const advancing = rankedPlayers.slice(0, advancingPerGroup);
      for (let i = 0; i < advancing.length; i++) {
        advancingPlayers.push({
          playerId: advancing[i].playerId,
          ign: advancing[i].ign,
          fromGroup: group.name,
          rank: i + 1,
        });
      }
    }

    // Mark current stage as COMPLETED
    await tx.stage.update({
      where: { id: stageId },
      data: { status: "COMPLETED" },
    });

    // If next stage exists, populate its groups
    if (nextStage) {
      const nextGroups = await tx.group.findMany({
        where: { stageId: nextStage.id },
        orderBy: { groupOrder: "asc" },
      });

      if (nextGroups.length > 0) {
        const assignments = snakeDraft(advancingPlayers, nextGroups.length);

        for (let groupIdx = 0; groupIdx < nextGroups.length; groupIdx++) {
          const group = nextGroups[groupIdx];
          const playersForGroup = assignments[groupIdx] || [];

          for (const player of playersForGroup) {
            const existing = await tx.groupPlayer.findUnique({
              where: { groupId_playerId: { groupId: group.id, playerId: player.playerId } },
            });
            if (!existing) {
              await tx.groupPlayer.create({
                data: { groupId: group.id, playerId: player.playerId },
              });
            }
          }
        }
      }
    }

    return advancingPlayers;
  });

  return NextResponse.json({
    message: `Hoàn thành vòng đấu. ${result.length} tuyển thủ thăng hạng.`,
    advancingPlayers: result,
    nextStage: nextStage ? { id: nextStage.id, name: nextStage.name } : null,
  });
}

// GET — Preview kết quả xếp hạng trước khi xác nhận
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stageId } = await params;

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      groups: {
        include: {
          players: {
            include: { player: true },
          },
          games: {
            include: { results: true },
          },
        },
      },
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  const advancingPerGroup = getAdvancingCount(stage.stageType);
  const preview = stage.groups.map((group) => {
    const ranked = rankGroupPlayers(group);
    return {
      groupName: group.name,
      players: ranked.map((p, i) => ({
        ...p,
        rank: i + 1,
        advancing: i < advancingPerGroup,
      })),
    };
  });

  return NextResponse.json({ preview, advancingPerGroup });
}

// ── Helpers ────────────────────────────────────────────────────────────────

function getAdvancingCount(stageType: string): number {
  switch (stageType) {
    case "QUALIFIER": return 2;
    case "SEMI_1":    return 4;
    case "SEMI_2":    return 4;
    case "FINAL":     return 0;
    default:          return 2;
  }
}

interface RankedPlayer {
  groupPlayerId: string;
  playerId: string;
  ign: string;
  totalPoints: number;
  top1Count: number;
  top4Count: number;
  bestPlacement: number;
}

function rankGroupPlayers(group: {
  players: { id: string; playerId: string; totalPoints: number; player: { ign: string } }[];
  games: { results: { playerId: string; placement: number; points: number }[] }[];
}): RankedPlayer[] {
  const players: RankedPlayer[] = group.players.map((gp) => {
    const allResults = group.games.flatMap((g) =>
      g.results.filter((r) => r.playerId === gp.playerId)
    );

    const top1Count = allResults.filter((r) => r.placement === 1).length;
    const top4Count = allResults.filter((r) => r.placement <= 4).length;
    const bestPlacement = allResults.length > 0
      ? Math.min(...allResults.map((r) => r.placement))
      : 99;

    return {
      groupPlayerId: gp.id,
      playerId: gp.playerId,
      ign: gp.player.ign,
      totalPoints: gp.totalPoints,
      top1Count,
      top4Count,
      bestPlacement,
    };
  });

  // Sort: totalPoints DESC → top1Count DESC → top4Count DESC → bestPlacement ASC
  return players.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.top1Count !== a.top1Count) return b.top1Count - a.top1Count;
    if (b.top4Count !== a.top4Count) return b.top4Count - a.top4Count;
    return a.bestPlacement - b.bestPlacement;
  });
}

// Snake draft: distribute players across groups to balance strength
function snakeDraft<T>(players: T[], numGroups: number): T[][] {
  const groups: T[][] = Array.from({ length: numGroups }, () => []);
  let direction = 1;
  let groupIdx = 0;

  for (const player of players) {
    groups[groupIdx].push(player);
    groupIdx += direction;
    if (groupIdx >= numGroups) { groupIdx = numGroups - 1; direction = -1; }
    else if (groupIdx < 0) { groupIdx = 0; direction = 1; }
  }

  return groups;
}
