import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { invalidateTournament } from "@/lib/cache-invalidate";

// Player tự rút lui
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const player = await prisma.player.findUnique({ where: { userId: session.user.id } });
  if (!player) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ tuyển thủ" }, { status: 404 });
  }

  const registration = await prisma.registration.findUnique({
    where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
    include: { tournament: true },
  });

  if (!registration) {
    return NextResponse.json({ error: "Bạn chưa đăng ký giải đấu này" }, { status: 404 });
  }

  if (registration.status === "WITHDRAWN") {
    return NextResponse.json({ error: "Bạn đã rút lui trước đó" }, { status: 400 });
  }

  // Cannot withdraw if tournament is IN_PROGRESS or COMPLETED
  if (["IN_PROGRESS", "COMPLETED"].includes(registration.tournament.status)) {
    return NextResponse.json({ error: "Không thể rút lui khi giải đấu đang diễn ra hoặc đã kết thúc" }, { status: 400 });
  }

  await prisma.registration.update({
    where: { id: registration.id },
    data: { status: "WITHDRAWN" },
  });

  await invalidateTournament(tournamentId);

  return NextResponse.json({ message: "Đã rút lui khỏi giải đấu thành công" });
  } catch (error) {
    return handleApiError(error);
  }
}
