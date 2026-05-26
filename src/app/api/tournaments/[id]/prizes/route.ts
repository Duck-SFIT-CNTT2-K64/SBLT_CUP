import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { invalidateTournament } from "@/lib/cache-invalidate";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slugOrId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const prizes = await prisma.prize.findMany({
    where: { tournamentId },
    include: { player: { select: { id: true, ign: true } } },
    orderBy: { rank: "asc" },
  });

  return NextResponse.json(prizes);
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const body = await req.json();
  const { rank, amount, description } = body;

  // H-01: Input validation
  const parsedRank = parseInt(rank);
  if (!Number.isInteger(parsedRank) || parsedRank < 1 || parsedRank > 100) {
    return NextResponse.json({ error: "Hạng không hợp lệ (1-100)" }, { status: 400 });
  }
  const parsedAmount = parseInt(amount);
  if (!Number.isInteger(parsedAmount) || parsedAmount < 0) {
    return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
  }
  if (!description || typeof description !== "string" || description.trim().length === 0 || description.length > 200) {
    return NextResponse.json({ error: "Mô tả không hợp lệ (1-200 ký tự)" }, { status: 400 });
  }

  // H-02: Verify tournament exists
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  try {
    const prize = await prisma.prize.create({
      data: {
        tournamentId,
        rank: parsedRank,
        amount: parsedAmount,
        description: description.trim(),
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "CREATE_PRIZE",
      entityType: "Prize",
      entityId: prize.id,
      after: { rank: parsedRank, amount: parsedAmount, description: description.trim() },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    await invalidateTournament(tournamentId);

    return NextResponse.json(prize, { status: 201 });
  } catch (error: unknown) {
    if (error && typeof error === "object" && "code" in error && (error as { code: string }).code === "P2002") {
      return NextResponse.json(
        { error: `Giải thưởng hạng ${parsedRank} đã tồn tại trong giải đấu này` },
        { status: 409 }
      );
    }
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo giải thưởng" },
      { status: 500 }
    );
  }
}
