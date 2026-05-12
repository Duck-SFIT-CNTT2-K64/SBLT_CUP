import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PREDICTABLE_STAGES } from "@/lib/constants";

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

  const { id: tournamentId, stageId } = await params;

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
  let predictionStatus: string;
  if (stage.status === "COMPLETED") predictionStatus = "SCORED";
  else if (stage.status === "IN_PROGRESS") predictionStatus = "LOCKED";
  else if (hasPlayers) predictionStatus = "OPEN";
  else predictionStatus = "NOT_READY";

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

  return NextResponse.json({
    stageId: stage.id,
    stageName: stage.name,
    stageType: stage.stageType,
    predictionStatus,
    groups: stage.groups.map((g) => ({
      groupId: g.id,
      groupName: g.name,
      players: g.players.map((gp) => ({
        id: gp.player.id,
        ign: gp.player.ign,
        isGuest: gp.player.isGuest,
      })),
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

  const { id: tournamentId, stageId } = await params;
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
      const existing = await prisma.prediction.findUnique({
        where: { userId_stageId: { userId: session.user.id, stageId } },
      });
      if (!existing || existing.status !== "OPEN") return null;
      await prisma.predictionEntry.deleteMany({ where: { predictionId: existing.id } });
      await prisma.predictionEntry.createMany({
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
    throw err;
  });

  if (!prediction) {
    return NextResponse.json(
      { error: "Dự đoán đã bị khóa. Không thể chỉnh sửa." },
      { status: 403 }
    );
  }

  return NextResponse.json({
    message: "Dự đoán đã được lưu thành công!",
    predictionId: prediction.id,
  });
}
