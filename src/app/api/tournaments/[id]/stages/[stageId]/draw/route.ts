import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateTournament } from "@/lib/cache-invalidate";

/**
 * GET  — Preview kết quả bốc thăm (chưa lưu)
 * POST — Xác nhận và lưu kết quả bốc thăm
 *
 * QUALIFIER: Chỉ bốc regular players (không bao gồm khách mời)
 * SEMI_1: Chỉ bốc khách mời vào bảng (advancing players đã được gán từ advance route)
 */

const RANK_TIERS: Record<string, number> = {
  "Thách Đấu": 1,
  "Cao Thủ": 2,
  "Đại Cao Thủ": 2,
  "Kim Cương": 3,
  "Bạch Kim": 4,
  "Vàng": 5,
  "Bạc": 6,
  "Đồng": 7,
};

function getTier(rank: string | null): number {
  if (!rank) return 5;
  for (const [key, tier] of Object.entries(RANK_TIERS)) {
    if (rank.includes(key)) return tier;
  }
  return 5;
}

function shuffle<T>(arr: T[]): T[] {
  const a = [...arr];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

const MAX_PER_GROUP = 8;

function seededDraw(
  players: { id: string; ign: string; rank: string | null; isGuest: boolean }[],
  numGroups: number
): { id: string; ign: string; rank: string | null; isGuest: boolean }[][] {
  const groups: typeof players[] = Array.from({ length: numGroups }, () => []);
  const groupCounts = new Array(numGroups).fill(0);

  function addToNextGroup(player: typeof players[0], startIdx: number, dir: number): boolean {
    let idx = startIdx;
    for (let attempt = 0; attempt < numGroups; attempt++) {
      if (groupCounts[idx] < MAX_PER_GROUP) {
        groups[idx].push(player);
        groupCounts[idx]++;
        return true;
      }
      idx += dir;
      if (idx >= numGroups) { idx = numGroups - 1; dir = -1; }
      else if (idx < 0) { idx = 0; dir = 1; }
    }
    return false;
  }

  // Separate guests and regular players
  const guests = shuffle(players.filter((p) => p.isGuest));
  const regulars = players.filter((p) => !p.isGuest);

  // Group regulars by tier, shuffle within tier
  const byTier = new Map<number, typeof regulars>();
  for (const p of regulars) {
    const tier = getTier(p.rank);
    if (!byTier.has(tier)) byTier.set(tier, []);
    byTier.get(tier)!.push(p);
  }

  const tieredPlayers: typeof regulars = [];
  for (const tier of [...byTier.keys()].sort()) {
    tieredPlayers.push(...shuffle(byTier.get(tier)!));
  }

  // Snake draft for regular players
  let dir = 1;
  let idx = 0;
  for (const player of tieredPlayers) {
    if (!addToNextGroup(player, idx, dir)) break;
    idx += dir;
    if (idx >= numGroups) { idx = numGroups - 1; dir = -1; }
    else if (idx < 0) { idx = 0; dir = 1; }
  }

  // Distribute guests evenly
  let guestIdx = 0;
  for (const guest of guests) {
    if (!addToNextGroup(guest, guestIdx, 1)) break;
    guestIdx = (guestIdx + 1) % numGroups;
  }

  return groups;
}

// Bốc thăm chỉ khách mời vào các bảng (dùng cho SEMI_1)
function drawGuestsIntoGroups(
  guests: { id: string; ign: string }[],
  groups: { id: string; currentCount: number }[]
): { groupId: string; guestIds: string[] }[] {
  const shuffled = shuffle(guests);
  const assignments = groups.map((g) => ({ groupId: g.id, guestIds: [] as string[] }));

  let groupIdx = 0;
  for (const guest of shuffled) {
    // Tìm bảng còn chỗ
    let attempts = 0;
    while (attempts < groups.length) {
      const target = assignments[groupIdx];
      const groupInfo = groups.find((g) => g.id === target.groupId);
      if (groupInfo && groupInfo.currentCount + target.guestIds.length < MAX_PER_GROUP) {
        target.guestIds.push(guest.id);
        groupIdx = (groupIdx + 1) % groups.length;
        break;
      }
      groupIdx = (groupIdx + 1) % groups.length;
      attempts++;
    }
  }

  return assignments;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId, stageId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const [stage, tournament] = await Promise.all([
    prisma.stage.findFirst({
      where: { id: stageId, tournamentId },
      include: { groups: true },
    }),
    prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: "APPROVED" },
          include: { player: true },
        },
      },
    }),
  ]);

  if (!stage || !tournament) {
    return NextResponse.json({ error: "Không tìm thấy dữ liệu" }, { status: 404 });
  }

  if (stage.groups.length === 0) {
    return NextResponse.json({ error: "Vòng đấu chưa có bảng. Tạo bảng trước khi bốc thăm." }, { status: 400 });
  }

  // SEMI_1: Trả về advancing players + guests riêng biệt
  if (stage.stageType === "SEMI_1") {
    // Tìm stage QUALIFIER trước đó
    const qualifierStage = await prisma.stage.findFirst({
      where: { tournamentId, stageType: "QUALIFIER" },
      include: {
        groups: {
          include: {
            players: {
              where: { finalRank: { lte: 2 } },
              include: { player: true },
            },
          },
        },
      },
    });

    // Lấy danh sách player đã được gán vào SEMI_1 groups
    const existingAssignments = await prisma.groupPlayer.findMany({
      where: { groupId: { in: stage.groups.map((g) => g.id) } },
      select: { playerId: true },
    });
    const assignedPlayerIds = new Set(existingAssignments.map((gp) => gp.playerId));

    // Lấy advancing players từ QUALIFIER (top 2 mỗi bảng) — chỉ lấy người chưa được gán bảng
    const advancingPlayers = qualifierStage
      ? qualifierStage.groups.flatMap((g) =>
          g.players
            .filter((gp) => !assignedPlayerIds.has(gp.playerId))
            .map((gp) => ({
              id: gp.playerId,
              ign: gp.player.ign,
              rank: gp.player.rank,
              fromGroup: g.name,
              finalRank: gp.finalRank,
            }))
        )
      : [];

    // Lấy tất cả guests trong hệ thống — chỉ lấy người chưa được gán bảng
    const allGuests = await prisma.player.findMany({
      where: { isGuest: true, id: { notIn: [...assignedPlayerIds] } },
      select: { id: true, ign: true, rank: true },
    });

    // Lấy thông tin bảng hiện tại
    const groupsWithCounts = await Promise.all(
      stage.groups.map(async (g) => {
        const count = await prisma.groupPlayer.count({ where: { groupId: g.id } });
        return { id: g.id, name: g.name, currentCount: count };
      })
    );

    // Tạo danh sách tất cả items cho vòng quay (advancing + guests)
    const allWheelItems = [
      ...advancingPlayers.map((p) => ({ id: p.id, label: p.ign, type: "advancing" as const, fromGroup: p.fromGroup })),
      ...allGuests.map((g) => ({ id: g.id, label: g.ign, type: "guest" as const })),
    ];

    return NextResponse.json({
      stageType: "SEMI_1",
      advancingPlayers,
      guestPlayers: allGuests.map((g) => ({ ...g, isGuest: true })),
      allWheelItems,
      groups: groupsWithCounts,
      totalAdvancing: advancingPlayers.length,
      totalGuests: allGuests.length,
    });
  }

  // QUALIFIER: Chỉ lấy regular players
  const regularPlayers = tournament.registrations
    .filter((r) => !r.player.isGuest)
    .map((r) => ({
      id: r.player.id,
      ign: r.player.ign,
      rank: r.player.rank,
      isGuest: false,
    }));

  const numGroups = stage.groups.length;

  if (regularPlayers.length > numGroups * MAX_PER_GROUP) {
    return NextResponse.json({
      error: `${regularPlayers.length} tuyển thủ không thể chia đều vào ${numGroups} bảng (tối đa ${numGroups * MAX_PER_GROUP}). Tạo thêm bảng.`,
      totalPlayers: regularPlayers.length,
      numGroups,
      maxCapacity: numGroups * MAX_PER_GROUP,
    }, { status: 400 });
  }

  const drawResult = seededDraw(regularPlayers, numGroups);

  const preview = [...stage.groups]
    .sort((a, b) => a.groupOrder - b.groupOrder)
    .map((group, i) => ({
      groupId: group.id,
      groupName: group.name,
      players: drawResult[i] || [],
    }));

  return NextResponse.json({
    stageType: "QUALIFIER",
    preview,
    totalPlayers: regularPlayers.length,
    numGroups,
    playersPerGroup: Math.ceil(regularPlayers.length / numGroups),
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId, stageId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();

  // Body:
  // { confirm: true } — QUALIFIER: chạy seeded draw mới
  // { assignments: [{ groupId, playerIds[] }] } — QUALIFIER: lưu kết quả thủ công
  // { drawType: "random_seeded" } — SEMI_1: bốc thăm guests ngẫu nhiên
  // { drawType: "wheel_spin", guestAssignments: [{ groupId, guestIds[] }] } — SEMI_1: lưu kết quả từ wheel
  const { confirm, assignments, drawType } = body;

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, tournamentId },
    include: { groups: true },
  });

  if (!stage) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  // ═══ SEMI_1: Bốc thăm khách MỜI + players đi tiếp ═══
  if (stage.stageType === "SEMI_1") {
    // Lấy advancing player IDs từ QUALIFIER (top 2 mỗi bảng)
    const qualifierStage = await prisma.stage.findFirst({
      where: { tournamentId, stageType: "QUALIFIER" },
      include: {
        groups: {
          include: {
            players: {
              where: { finalRank: { lte: 2 } },
              select: { playerId: true },
            },
          },
        },
      },
    });
    const advancingPlayerIds = new Set(
      qualifierStage?.groups.flatMap((g) => g.players.map((gp) => gp.playerId)) || []
    );

    // Lấy tất cả players liên quan
    const allPlayerIds: string[] = assignments
      ? assignments.flatMap((a: { groupId: string; playerIds: string[] }) => a.playerIds)
      : [];
    const players = await prisma.player.findMany({
      where: { id: { in: allPlayerIds } },
      select: { id: true, ign: true, isGuest: true },
    });
    const playerMap = new Map(players.map((p) => [p.id, p]));

    let finalAssignments: { groupId: string; playerIds: string[] }[];

    if (drawType === "wheel_spin" && assignments) {
      // Wheel spin: admin đã gán cả guests lẫn advancing players qua wheel UI
      // Validate: mỗi player chỉ ở 1 bảng
      if (new Set(allPlayerIds).size !== allPlayerIds.length) {
        return NextResponse.json({ error: "Có tuyển thủ bị trùng giữa các bảng" }, { status: 400 });
      }
      // Validate: advancing players phải thực sự đi tiếp từ QUALIFIER
      for (const playerId of allPlayerIds) {
        const p = playerMap.get(playerId);
        if (p && !p.isGuest && !advancingPlayerIds.has(playerId)) {
          return NextResponse.json({ error: `Tuyển thủ "${p.ign}" không phải người đi tiếp từ Vòng Loại` }, { status: 400 });
        }
      }
      finalAssignments = assignments;
    } else if (drawType === "random_seeded") {
      // Random seeded: chỉ bốc thăm guests (advancing players đã được gán trước đó)
      const existingGroupPlayers = await prisma.groupPlayer.findMany({
        where: { groupId: { in: stage.groups.map((g) => g.id) } },
      });
      const allGuests = await prisma.player.findMany({
        where: { isGuest: true },
        select: { id: true, ign: true },
      });
      const groupsWithCounts = stage.groups.map((g) => ({
        id: g.id,
        currentCount: existingGroupPlayers.filter((gp) => gp.groupId === g.id).length,
      }));
      finalAssignments = drawGuestsIntoGroups(allGuests, groupsWithCounts).map((a) => ({
        groupId: a.groupId,
        playerIds: a.guestIds,
      }));
    } else {
      return NextResponse.json({ error: "Cần drawType: 'random_seeded' hoặc 'wheel_spin' với assignments" }, { status: 400 });
    }

    // Tạo Registration cho guests nếu chưa có (APPROVED)
    const guestIds = allPlayerIds.filter((id: string) => playerMap.get(id)?.isGuest);
    await Promise.all(
      guestIds.map(async (guestId) => {
        const existing = await prisma.registration.findUnique({
          where: { tournamentId_playerId: { tournamentId, playerId: guestId } },
        });
        if (!existing) {
          await prisma.registration.create({
            data: { tournamentId, playerId: guestId, status: "APPROVED" },
          });
        }
      })
    );

    // Lưu assignments vào GroupPlayer
    const result = await prisma.$transaction(async (tx) => {
      let totalAdded = 0;
      for (const assignment of finalAssignments) {
        for (const playerId of assignment.playerIds) {
          const existing = await tx.groupPlayer.findUnique({
            where: { groupId_playerId: { groupId: assignment.groupId, playerId } },
          });
          if (!existing) {
            await tx.groupPlayer.create({
              data: { groupId: assignment.groupId, playerId },
            });
            totalAdded++;
          }
        }
      }
      return totalAdded;
    });

    await invalidateTournament(tournamentId);

    return NextResponse.json({
      message: `Bốc thăm hoàn tất. Đã phân bổ ${result} tuyển thủ vào ${stage.groups.length} bảng.`,
      totalAdded: result,
    });
  }

  // ═══ QUALIFIER: Bốc thăm regular players ═══
  let finalAssignments: { groupId: string; playerIds: string[] }[];

  if (assignments) {
    for (const a of assignments) {
      if (a.playerIds.length > 8) {
        return NextResponse.json(
          { error: `Bảng có ${a.playerIds.length} tuyển thủ, vượt quá giới hạn 8` },
          { status: 400 }
        );
      }
    }
    const allPlayerIds = assignments.flatMap((a: { playerIds: string[] }) => a.playerIds);
    const uniquePlayerIds = new Set(allPlayerIds);
    if (uniquePlayerIds.size !== allPlayerIds.length) {
      return NextResponse.json(
        { error: "Có tuyển thủ bị trùng giữa các bảng. Mỗi tuyển thủ chỉ được ở 1 bảng." },
        { status: 400 }
      );
    }
    finalAssignments = assignments;
  } else if (confirm) {
    const tournament = await prisma.tournament.findUnique({
      where: { id: tournamentId },
      include: {
        registrations: {
          where: { status: "APPROVED" },
          include: { player: true },
        },
      },
    });

    if (!tournament) return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });

    // Chỉ lấy regular players cho QUALIFIER
    const regularPlayers = tournament.registrations
      .filter((r) => !r.player.isGuest)
      .map((r) => ({
        id: r.player.id,
        ign: r.player.ign,
        rank: r.player.rank,
        isGuest: false,
      }));

    const numGroupsForCheck = stage.groups.length;
    if (regularPlayers.length > numGroupsForCheck * 8) {
      return NextResponse.json(
        { error: `${regularPlayers.length} tuyển thủ không thể chia đều vào ${numGroupsForCheck} bảng (tối đa ${numGroupsForCheck * 8}). Tạo thêm bảng hoặc bớt tuyển thủ.` },
        { status: 400 }
      );
    }

    const numGroups = stage.groups.length;
    const drawResult = seededDraw(regularPlayers, numGroups);

    const totalPlaced = drawResult.reduce((sum, g) => sum + g.length, 0);
    if (totalPlaced < regularPlayers.length) {
      return NextResponse.json(
        { error: `Chỉ xếp được ${totalPlaced}/${regularPlayers.length} tuyển thủ. Tăng số bảng hoặc giảm tuyển thủ.` },
        { status: 400 }
      );
    }

    const sortedGroups = [...stage.groups].sort((a, b) => a.groupOrder - b.groupOrder);

    finalAssignments = sortedGroups.map((group, i) => ({
      groupId: group.id,
      playerIds: (drawResult[i] || []).map((p) => p.id),
    }));
  } else {
    return NextResponse.json({ error: "Cần confirm: true hoặc assignments" }, { status: 400 });
  }

  const result = await prisma.$transaction(async (tx) => {
    await tx.groupPlayer.deleteMany({
      where: { groupId: { in: finalAssignments.map((a) => a.groupId) } },
    });

    const createData = finalAssignments.flatMap(({ groupId, playerIds }) =>
      playerIds.map((playerId) => ({ groupId, playerId }))
    );

    let totalAdded = 0;
    if (createData.length > 0) {
      const CHUNK_SIZE = 500;
      for (let i = 0; i < createData.length; i += CHUNK_SIZE) {
        const chunk = createData.slice(i, i + CHUNK_SIZE);
        const batchResult = await tx.groupPlayer.createMany({ data: chunk });
        totalAdded += batchResult.count;
      }
    }

    return totalAdded;
  });

  await invalidateTournament(tournamentId);

  return NextResponse.json({
    message: `Bốc thăm hoàn tất. Đã phân bổ ${result} tuyển thủ vào ${finalAssignments.length} bảng.`,
    totalAdded: result,
  });
}
