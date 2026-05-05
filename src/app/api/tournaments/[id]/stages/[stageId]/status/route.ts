import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * POST /api/tournaments/[id]/stages/[stageId]/status
 * Body: { status: "IN_PROGRESS" | "COMPLETED" }
 *
 * Khi chuyển sang COMPLETED: kiểm tra tất cả games đã có kết quả
 */
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
  const { status: newStatus } = body;

  if (!["IN_PROGRESS", "COMPLETED", "SCHEDULED"].includes(newStatus)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    include: {
      groups: {
        include: {
          players: true,
          games: {
            include: { results: true },
          },
        },
      },
    },
  });

  if (!stage) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  // B-12: Verify stage belongs to this tournament
  if (stage.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Vòng đấu không thuộc giải đấu này" }, { status: 400 });
  }

  if (newStatus === "COMPLETED") {
    // B-05: Check each game has results for all group players, not just non-empty
    const incompleteGames = stage.groups.flatMap((g) =>
      g.games.filter((game) => {
        if (game.status !== "COMPLETED") return true;
        return game.results.length < g.players.length;
      })
    );

    if (incompleteGames.length > 0) {
      return NextResponse.json(
        {
          error: `Còn ${incompleteGames.length} trận chưa có kết quả đầy đủ`,
          warning: true,
          gamesWithoutResults: incompleteGames.length,
        },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.stage.update({
    where: { id: stageId },
    data: { status: newStatus },
  });

  const labels: Record<string, string> = {
    SCHEDULED: "Sắp diễn ra",
    IN_PROGRESS: "Đang diễn ra",
    COMPLETED: "Đã hoàn thành",
  };

  return NextResponse.json({
    message: `Vòng đấu chuyển sang "${labels[newStatus]}"`,
    status: updated.status,
  });
}
