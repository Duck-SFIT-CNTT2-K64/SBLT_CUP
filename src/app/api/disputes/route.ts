import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

const VALID_REASONS = ["WRONG_RESULT", "BUG", "DISCONNECT", "CHEATING", "OTHER"];

// Player gửi kháng nghị
export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { tournamentId, gameId, reason, description } = body;

  // S-12: Validate required fields with length limits
  if (!tournamentId || !reason || !description) {
    return NextResponse.json({ error: "Thiếu thông tin bắt buộc" }, { status: 400 });
  }

  if (typeof description !== "string" || description.length < 10 || description.length > 2000) {
    return NextResponse.json({ error: "Mô tả phải từ 10 đến 2000 ký tự" }, { status: 400 });
  }

  if (!VALID_REASONS.includes(reason)) {
    return NextResponse.json({ error: "Lý do không hợp lệ" }, { status: 400 });
  }

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ tuyển thủ" }, { status: 404 });
  }

  // B-17: Verify tournament exists
  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  // B-17: Verify player has registration in this tournament
  const registration = await prisma.registration.findUnique({
    where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
  });
  if (!registration) {
    return NextResponse.json({ error: "Bạn không tham gia giải đấu này" }, { status: 403 });
  }

  // B-17: If gameId provided, verify it belongs to this tournament
  if (gameId) {
    const game = await prisma.game.findFirst({
      where: { id: gameId, group: { stage: { tournamentId } } },
    });
    if (!game) {
      return NextResponse.json({ error: "Trận đấu không thuộc giải đấu này" }, { status: 400 });
    }
  }

  // S-13: Sanitize description
  const sanitizedDescription = description.replace(/[<>&"]/g, (c: string) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
    return map[c] || c;
  });

  const dispute = await prisma.dispute.create({
    data: {
      tournamentId,
      gameId: gameId || null,
      submittedBy: player.id,
      reason,
      description: sanitizedDescription,
    },
    include: { player: true, tournament: { select: { name: true } } },
  });

  return NextResponse.json(dispute, { status: 201 });
}

// Player xem kháng nghị của mình, Admin xem tất cả
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status");
  const tournamentId = searchParams.get("tournamentId");

  const VALID_STATUSES = ["PENDING", "REVIEWING", "RESOLVED", "REJECTED"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  // Player chỉ xem được kháng nghị của mình
  const isAdmin = session.user.role === "ADMIN";
  let playerFilter = {};
  if (!isAdmin) {
    const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
    if (!player) {
      return NextResponse.json([]);
    }
    playerFilter = { submittedBy: player.id };
  }

  const disputes = await prisma.dispute.findMany({
    where: {
      ...playerFilter,
      ...(status ? { status: status as "PENDING" | "REVIEWING" | "RESOLVED" | "REJECTED" } : {}),
      ...(tournamentId ? { tournamentId } : {}),
    },
    include: {
      player: { select: { ign: true } },
      tournament: { select: { name: true, season: true } },
      game: { select: { gameNumber: true, group: { select: { name: true } } } },
    },
    orderBy: { createdAt: "desc" },
    take: 50,
  });

  return NextResponse.json(disputes);
}
