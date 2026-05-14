import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { scorePredictionsForStage } from "@/lib/predictions";
import { sseManager, SSE_EVENTS } from "@/lib/sse";
import { logger } from "@/lib/logger";
import { auditLog } from "@/lib/audit";
import { invalidateTournament, invalidatePredictionLeaderboard } from "@/lib/cache-invalidate";

const VALID_TRANSITIONS: Record<string, string[]> = {
  SCHEDULED: ["IN_PROGRESS"],
  IN_PROGRESS: ["COMPLETED"],
};

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

  const stage = await prisma.stage.findFirst({
    where: { id: stageId, tournamentId },
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

  // Validate status transition
  const allowedTransitions = VALID_TRANSITIONS[stage.status] || [];
  if (!allowedTransitions.includes(newStatus)) {
    return NextResponse.json(
      { error: `Không thể chuyển từ "${stage.status}" sang "${newStatus}"` },
      { status: 400 }
    );
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

  // Wrap status update + prediction locking in transaction for atomicity
  const updated = await prisma.$transaction(async (tx) => {
    const updatedStage = await tx.stage.update({
      where: { id: stageId },
      data: { status: newStatus },
    });

    // Khóa tất cả dự đoán khi stage bắt đầu
    if (newStatus === "IN_PROGRESS") {
      await tx.prediction.updateMany({
        where: { stageId, status: "OPEN" },
        data: { status: "LOCKED" },
      });
    }

    return updatedStage;
  });

  // Chấm điểm dự đoán khi stage chuyển sang COMPLETED (best-effort)
  let predictionScored = 0;
  if (newStatus === "COMPLETED") {
    try {
      const { scored } = await scorePredictionsForStage(stageId);
      predictionScored = scored;
    } catch (err) {
      logger.error("[PREDICTION SCORING ERROR]", err instanceof Error ? err : new Error(String(err)));
    }
  }

  const labels: Record<string, string> = {
    SCHEDULED: "Sắp diễn ra",
    IN_PROGRESS: "Đang diễn ra",
    COMPLETED: "Đã hoàn thành",
  };

  // Audit log
  await auditLog({
    action: "STAGE_STATUS_CHANGE",
    userId: session.user.id,
    entityType: "Stage",
    entityId: stageId,
    before: { status: stage.status },
    after: { status: newStatus },
  });

  // Broadcast SSE event for real-time updates
  sseManager.broadcastToTournament(tournamentId, SSE_EVENTS.STAGE_UPDATE, {
    stageId,
    status: newStatus,
    timestamp: new Date().toISOString(),
  });

  await invalidateTournament(tournamentId);
  await invalidatePredictionLeaderboard();

  return NextResponse.json({
    message: `Vòng đấu chuyển sang "${labels[newStatus]}"${predictionScored > 0 ? `. ${predictionScored} dự đoán đã được chấm điểm.` : ""}`,
    status: updated.status,
  });
}
