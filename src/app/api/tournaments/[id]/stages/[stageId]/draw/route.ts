import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET  — Preview kết quả bốc thăm (chưa lưu)
 * POST — Xác nhận và lưu kết quả bốc thăm
 *
 * Seeding logic:
 * - Chia players thành tiers theo rank (Thách Đấu, Cao Thủ, Bạch Kim, Vàng...)
 * - Trong mỗi tier: shuffle ngẫu nhiên
 * - Snake draft qua các groups để đảm bảo mỗi group có đại diện từ mỗi tier
 * - Guest players được phân bổ đều
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

  // Helper: find next group with capacity using snake direction
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
    return false; // all groups full
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

  // Sort tiers and shuffle within each
  const tieredPlayers: typeof regulars = [];
  for (const tier of [...byTier.keys()].sort()) {
    tieredPlayers.push(...shuffle(byTier.get(tier)!));
  }

  // Snake draft for regular players — respects 8-player cap
  let dir = 1;
  let idx = 0;
  for (const player of tieredPlayers) {
    if (!addToNextGroup(player, idx, dir)) break;
    idx += dir;
    if (idx >= numGroups) { idx = numGroups - 1; dir = -1; }
    else if (idx < 0) { idx = 0; dir = 1; }
  }

  // Distribute guests evenly — respects 8-player cap
  let guestIdx = 0;
  for (const guest of guests) {
    if (!addToNextGroup(guest, guestIdx, 1)) break;
    guestIdx = (guestIdx + 1) % numGroups;
  }

  return groups;
}

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId, stageId } = await params;

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

  const players = tournament.registrations.map((r) => ({
    id: r.player.id,
    ign: r.player.ign,
    rank: r.player.rank,
    isGuest: r.player.isGuest,
  }));

  const numGroups = stage.groups.length;

  // Check capacity before preview
  if (players.length > numGroups * MAX_PER_GROUP) {
    return NextResponse.json({
      error: `${players.length} tuyển thủ không thể chia đều vào ${numGroups} bảng (tối đa ${numGroups * MAX_PER_GROUP}). Tạo thêm bảng.`,
      totalPlayers: players.length,
      numGroups,
      maxCapacity: numGroups * MAX_PER_GROUP,
    }, { status: 400 });
  }

  const drawResult = seededDraw(players, numGroups);

  const preview = [...stage.groups]
    .sort((a, b) => a.groupOrder - b.groupOrder)
    .map((group, i) => ({
      groupId: group.id,
      groupName: group.name,
      players: drawResult[i] || [],
    }));

  return NextResponse.json({
    preview,
    totalPlayers: players.length,
    numGroups,
    playersPerGroup: Math.ceil(players.length / numGroups),
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

  const { id: tournamentId, stageId } = await params;
  const body = await req.json();

  // Body can be:
  // { confirm: true } — run new draw and save
  // { assignments: [{ groupId, playerIds[] }] } — save a specific preview result
  const { confirm, assignments } = body;

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, tournamentId },
    include: { groups: true },
  });

  if (!stage) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  let finalAssignments: { groupId: string; playerIds: string[] }[];

  if (assignments) {
    // Validate each group doesn't exceed 8 players
    for (const a of assignments) {
      if (a.playerIds.length > 8) {
        return NextResponse.json(
          { error: `Bảng có ${a.playerIds.length} tuyển thủ, vượt quá giới hạn 8` },
          { status: 400 }
        );
      }
    }
    // Validate no player appears in multiple groups
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
    // Run fresh draw
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

    const numGroupsForCheck = stage.groups.length;
    if (tournament.registrations.length > numGroupsForCheck * 8) {
      return NextResponse.json(
        { error: `${tournament.registrations.length} tuyển thủ không thể chia đều vào ${numGroupsForCheck} bảng (tối đa ${numGroupsForCheck * 8}). Tạo thêm bảng hoặc bớt tuyển thủ.` },
        { status: 400 }
      );
    }

    const players = tournament.registrations.map((r) => ({
      id: r.player.id,
      ign: r.player.ign,
      rank: r.player.rank,
      isGuest: r.player.isGuest,
    }));

    const numGroups = stage.groups.length;
    const drawResult = seededDraw(players, numGroups);

    // Verify all players were placed
    const totalPlaced = drawResult.reduce((sum, g) => sum + g.length, 0);
    if (totalPlaced < players.length) {
      return NextResponse.json(
        { error: `Chỉ xếp được ${totalPlaced}/${players.length} tuyển thủ. Tăng số bảng hoặc giảm tuyển thủ.` },
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

  // B-02: Wrap in transaction for atomicity
  const result = await prisma.$transaction(async (tx) => {
    // Clear existing group players first
    await tx.groupPlayer.deleteMany({
      where: { groupId: { in: finalAssignments.map((a) => a.groupId) } },
    });

    // B-09: Batch create instead of loop
    const createData = finalAssignments.flatMap(({ groupId, playerIds }) =>
      playerIds.map((playerId) => ({ groupId, playerId }))
    );

    let totalAdded = 0;
    if (createData.length > 0) {
      // Use createMany for efficiency, but it doesn't return created records
      // Split into chunks to avoid potential limits
      const CHUNK_SIZE = 500;
      for (let i = 0; i < createData.length; i += CHUNK_SIZE) {
        const chunk = createData.slice(i, i + CHUNK_SIZE);
        const batchResult = await tx.groupPlayer.createMany({ data: chunk });
        totalAdded += batchResult.count;
      }
    }

    return totalAdded;
  });

  return NextResponse.json({
    message: `Bốc thăm hoàn tất. Đã phân bổ ${result} tuyển thủ vào ${finalAssignments.length} bảng.`,
    totalAdded: result,
  });
}
