import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; groupId: string }> }
) {
  const { groupId } = await params;

  // M-02: Select only needed player fields, exclude userId
  const groupPlayers = await prisma.groupPlayer.findMany({
    where: { groupId },
    include: { player: { select: { id: true, ign: true, rank: true, isGuest: true } } },
  });

  return NextResponse.json(groupPlayers);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; groupId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { stageId, groupId } = await params;
  const body = await req.json();
  const { playerId } = body;

  // H-01: Validate playerId
  if (!playerId || typeof playerId !== "string") {
    return NextResponse.json({ error: "Player ID không hợp lệ" }, { status: 400 });
  }

  // H-02: Verify group belongs to stage
  const group = await prisma.group.findFirst({ where: { id: groupId, stageId } });
  if (!group) {
    return NextResponse.json({ error: "Không tìm thấy bảng đấu" }, { status: 404 });
  }

  // Verify player exists
  const player = await prisma.player.findUnique({ where: { id: playerId } });
  if (!player) {
    return NextResponse.json({ error: "Không tìm thấy tuyển thủ" }, { status: 404 });
  }

  try {
    // Check if player is already in group
    const existing = await prisma.groupPlayer.findUnique({
      where: {
        groupId_playerId: {
          groupId,
          playerId,
        },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tuyển thủ đã ở trong bảng này" },
        { status: 400 }
      );
    }

    const groupPlayer = await prisma.groupPlayer.create({
      data: {
        groupId,
        playerId,
      },
      include: { player: { select: { id: true, ign: true, rank: true, isGuest: true } } },
    });

    return NextResponse.json(groupPlayer, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi thêm tuyển thủ" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; groupId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const playerId = searchParams.get("playerId");

  if (!playerId) {
    return NextResponse.json(
      { error: "Player ID is required" },
      { status: 400 }
    );
  }

  const { stageId, groupId } = await params;

  // H-02: Verify group belongs to stage
  const group = await prisma.group.findFirst({ where: { id: groupId, stageId } });
  if (!group) {
    return NextResponse.json({ error: "Không tìm thấy bảng đấu" }, { status: 404 });
  }

  try {
    await prisma.groupPlayer.delete({
      where: {
        groupId_playerId: {
          groupId,
          playerId,
        },
      },
    });

    return NextResponse.json({ message: "Đã xóa tuyển thủ khỏi bảng" });
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xóa" },
      { status: 500 }
    );
  }
}
