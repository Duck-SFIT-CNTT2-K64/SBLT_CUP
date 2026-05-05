import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string; groupId: string }> }
) {
  const { groupId } = await params;

  const games = await prisma.game.findMany({
    where: { groupId },
    include: {
      results: {
        include: { player: true },
      },
    },
    orderBy: { gameNumber: "asc" },
  });

  return NextResponse.json(games);
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
  const { gameNumber } = body;

  // H-01: Input validation
  const parsedGameNumber = parseInt(gameNumber);
  if (!Number.isInteger(parsedGameNumber) || parsedGameNumber < 1 || parsedGameNumber > 20) {
    return NextResponse.json({ error: "Số thứ tự trận đấu không hợp lệ (1-20)" }, { status: 400 });
  }

  // H-02: Verify group belongs to stage
  const group = await prisma.group.findFirst({ where: { id: groupId, stageId } });
  if (!group) {
    return NextResponse.json({ error: "Không tìm thấy bảng đấu" }, { status: 404 });
  }

  try {
    // Check gameNumber uniqueness within group
    const existingGame = await prisma.game.findUnique({
      where: { groupId_gameNumber: { groupId, gameNumber: parsedGameNumber } },
    });
    if (existingGame) {
      return NextResponse.json(
        { error: `Trận đấu số ${parsedGameNumber} đã tồn tại trong bảng này` },
        { status: 409 }
      );
    }

    const game = await prisma.game.create({
      data: {
        groupId,
        gameNumber: parsedGameNumber,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "CREATE_GAME",
      entityType: "Game",
      entityId: game.id,
      after: { gameNumber: parsedGameNumber, groupId },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(game, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: `Trận đấu số ${parsedGameNumber} đã tồn tại` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo trận đấu" },
      { status: 500 }
    );
  }
}
