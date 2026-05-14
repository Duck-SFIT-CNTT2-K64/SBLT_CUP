import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { invalidateTournament } from "@/lib/cache-invalidate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { stageId } = await params;

  const groups = await prisma.group.findMany({
    where: { stageId },
    include: {
      players: {
        include: { player: true },
      },
      games: {
        include: { results: { include: { player: true } } },
      },
    },
    orderBy: { groupOrder: "asc" },
  });

  return NextResponse.json(groups);
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
  const { name, groupOrder } = body;

  // H-01: Input validation
  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json({ error: "Tên bảng đấu không hợp lệ (1-100 ký tự)" }, { status: 400 });
  }
  const parsedOrder = parseInt(groupOrder);
  if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
    return NextResponse.json({ error: "Thứ tự bảng đấu không hợp lệ" }, { status: 400 });
  }

  // H-02: Verify stage belongs to tournament
  const stage = await prisma.stage.findFirst({ where: { id: stageId, tournamentId } });
  if (!stage) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  try {
    const group = await prisma.group.create({
      data: {
        stageId,
        name: name.trim(),
        groupOrder: parsedOrder,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "CREATE_GROUP",
      entityType: "Group",
      entityId: group.id,
      after: { name: group.name, groupOrder: parsedOrder, stageId },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    await invalidateTournament(tournamentId);

    return NextResponse.json(group, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo bảng đấu" },
      { status: 500 }
    );
  }
}
