import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { invalidateTournament } from "@/lib/cache-invalidate";

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; groupId: string }> }
) {
  const { stageId, groupId } = await params;

  const group = await prisma.group.findFirst({
    where: { id: groupId, stageId },
    include: {
      players: {
        include: { player: { select: { id: true, ign: true, rank: true, isGuest: true } } },
      },
      games: {
        include: { results: { include: { player: { select: { id: true, ign: true, isGuest: true } } } } },
        orderBy: { gameNumber: "asc" },
      },
    },
  });

  if (!group) {
    return NextResponse.json({ error: "Không tìm thấy bảng đấu" }, { status: 404 });
  }

  // Also fetch sibling groups in the same stage for lobby switcher
  const siblingGroups = await prisma.group.findMany({
    where: { stageId },
    select: { id: true, name: true, groupOrder: true },
    orderBy: { groupOrder: "asc" },
  });

  return NextResponse.json({ ...group, siblingGroups });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; groupId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, stageId, groupId } = await params;
  const body = await req.json();

  // S-04: Validate name
  if (!body.name || typeof body.name !== "string") {
    return NextResponse.json({ error: "Tên bảng đấu không hợp lệ" }, { status: 400 });
  }
  const name = body.name.trim().slice(0, 100);
  if (name.length === 0) {
    return NextResponse.json({ error: "Tên bảng đấu không được để trống" }, { status: 400 });
  }

  // B-17: Verify group belongs to this stage
  const existing = await prisma.group.findFirst({
    where: { id: groupId, stageId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy bảng đấu" }, { status: 404 });
  }

  try {
    const group = await prisma.group.update({
      where: { id: groupId },
      data: { name },
    });
    await invalidateTournament(id);
    return NextResponse.json(group);
  } catch {
    return NextResponse.json({ error: "Lỗi khi cập nhật bảng đấu" }, { status: 500 });
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

  const { id, stageId, groupId } = await params;

  // B-17: Verify group belongs to this stage
  const existing = await prisma.group.findFirst({
    where: { id: groupId, stageId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy bảng đấu" }, { status: 404 });
  }

  // B-08: Check if group has players or games
  const groupData = await prisma.group.findUnique({
    where: { id: groupId },
    include: { _count: { select: { players: true, games: true } } },
  });

  if (groupData && (groupData._count.players > 0 || groupData._count.games > 0)) {
    return NextResponse.json(
      { error: `Không thể xóa bảng đấu đang có ${groupData._count.players} tuyển thủ và ${groupData._count.games} trận đấu` },
      { status: 400 }
    );
  }

  try {
    await prisma.group.delete({ where: { id: groupId } });
    await invalidateTournament(id);
    return NextResponse.json({ message: "Đã xóa bảng đấu" });
  } catch {
    return NextResponse.json({ error: "Lỗi khi xóa bảng đấu" }, { status: 500 });
  }
}
