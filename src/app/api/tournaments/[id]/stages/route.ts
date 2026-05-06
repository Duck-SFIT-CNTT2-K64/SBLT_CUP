import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

const VALID_STAGE_TYPES = ["QUALIFIER", "SEMI_1", "SEMI_2", "FINAL"];

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: tournamentId } = await params;

  const stages = await prisma.stage.findMany({
    where: { tournamentId },
    include: {
      groups: {
        include: {
          players: {
            include: { player: true },
          },
          games: {
            include: { results: { include: { player: true } } },
          },
        },
      },
    },
    orderBy: { stageOrder: "asc" },
  });

  return NextResponse.json(stages, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate",
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;
  const body = await req.json();
  const { name, stageType, stageOrder, date, startTime, totalGames } = body;

  // H-01: Input validation
  if (!name || typeof name !== "string" || name.trim().length === 0 || name.length > 100) {
    return NextResponse.json({ error: "Tên vòng đấu không hợp lệ (1-100 ký tự)" }, { status: 400 });
  }
  if (!stageType || !VALID_STAGE_TYPES.includes(stageType)) {
    return NextResponse.json({ error: "Loại vòng đấu không hợp lệ" }, { status: 400 });
  }
  const parsedOrder = parseInt(stageOrder);
  if (!Number.isInteger(parsedOrder) || parsedOrder < 1) {
    return NextResponse.json({ error: "Thứ tự vòng đấu không hợp lệ" }, { status: 400 });
  }
  if (!date || isNaN(Date.parse(date))) {
    return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });
  }
  if (!startTime || typeof startTime !== "string") {
    return NextResponse.json({ error: "Giờ bắt đầu không hợp lệ" }, { status: 400 });
  }
  const parsedTotalGames = parseInt(totalGames) || 3;
  if (parsedTotalGames < 1 || parsedTotalGames > 10) {
    return NextResponse.json({ error: "Số lượng game không hợp lệ (1-10)" }, { status: 400 });
  }

  // H-02: Verify tournament exists
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  try {
    const stage = await prisma.stage.create({
      data: {
        tournamentId,
        name: name.trim(),
        stageType,
        stageOrder: parsedOrder,
        date: new Date(date),
        startTime,
        totalGames: parsedTotalGames,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "CREATE_STAGE",
      entityType: "Stage",
      entityId: stage.id,
      after: { name: stage.name, stageType, stageOrder: parsedOrder },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(stage, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo vòng đấu" },
      { status: 500 }
    );
  }
}
