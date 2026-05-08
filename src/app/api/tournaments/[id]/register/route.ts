import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { createNotification } from "@/lib/notifications";

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
  });

  if (!player) {
    return NextResponse.json(
      { error: "Bạn cần cập nhật hồ sơ trước khi đăng ký" },
      { status: 400 }
    );
  }

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      _count: { select: { registrations: { where: { status: "APPROVED" } } } },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Giải đấu không tồn tại" }, { status: 404 });
  }

  if (tournament.status !== "REGISTRATION_OPEN") {
    return NextResponse.json(
      { error: "Giải đấu chưa mở hoặc đã đóng đăng ký" },
      { status: 400 }
    );
  }

  const existing = await prisma.registration.findUnique({
    where: {
      tournamentId_playerId: {
        tournamentId,
        playerId: player.id,
      },
    },
  });

  if (existing) {
    return NextResponse.json(
      { error: "Bạn đã đăng ký giải đấu này rồi" },
      { status: 400 }
    );
  }

  // B-01: Use transaction to prevent race condition on maxPlayers
  const registration = await prisma.$transaction(async (tx) => {
    const currentCount = await tx.registration.count({
      where: { tournamentId, status: "APPROVED" },
    });

    if (currentCount >= tournament.maxPlayers) {
      throw new Error("FULL");
    }

    return tx.registration.create({
      data: { tournamentId, playerId: player.id, status: "PENDING" },
    });
  }).catch((err) => {
    if (err.message === "FULL") return null;
    throw err;
  });

  if (!registration) {
    return NextResponse.json({ error: "Giải đấu đã đủ số lượng tuyển thủ" }, { status: 400 });
  }

  // Send notification to user
  await createNotification({
    userId: session.user.id,
    type: "REGISTRATION_STATUS",
    title: "Đăng ký thành công!",
    message: `Bạn đã đăng ký thành công giải đấu "${tournament.name}". Vui lòng chờ ban tổ chức duyệt.`,
    link: `/tournaments/${tournamentId}`,
  });

  return NextResponse.json(registration, { status: 201 });
}
