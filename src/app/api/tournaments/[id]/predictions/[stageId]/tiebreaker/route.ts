import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { sseManager, SSE_EVENTS } from "@/lib/sse";

/**
 * POST /api/tournaments/[id]/predictions/[stageId]/tiebreaker
 * Admin trigger duck race cho các users cùng điểm.
 * Broadcast SSE event để mọi người cùng xem animation.
 */
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: slugOrId, stageId } = await params;
  const tournamentId = await resolveTournamentId(slugOrId);
  if (!tournamentId) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    select: { status: true, tournamentId: true },
  });

  if (!stage || stage.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
  }

  if (stage.status !== "COMPLETED") {
    return NextResponse.json({ error: "Vòng đấu chưa kết thúc, không thể đua vịt" }, { status: 400 });
  }

  // Tìm tất cả predictions có cùng điểm cao nhất
  const predictions = await prisma.prediction.findMany({
    where: { stageId, status: "SCORED" },
    include: {
      user: {
        select: { id: true, name: true, avatar: true },
      },
    },
    orderBy: { totalScore: "desc" },
  });

  if (predictions.length === 0) {
    return NextResponse.json({ error: "Không có dự đoán nào đã chấm điểm" }, { status: 400 });
  }

  // Tìm điểm cao nhất
  const topScore = predictions[0].totalScore;

  // Lọc những người cùng điểm cao nhất
  const tiedPredictions = predictions.filter((p) => p.totalScore === topScore);

  if (tiedPredictions.length <= 1) {
    return NextResponse.json({
      message: "Không có ai cùng điểm. Không cần tie-breaker.",
      winner: tiedPredictions[0]?.user,
    });
  }

  // Broadcast SSE event cho duck race
  const raceData = {
    players: tiedPredictions.map((p) => ({
      id: p.user.id,
      ign: p.user.name,
      avatar: p.user.avatar,
    })),
    topScore,
    timestamp: new Date().toISOString(),
  };

  sseManager.broadcastToTournament(tournamentId, SSE_EVENTS.DUCK_RACE_START, raceData);

  return NextResponse.json({
    message: `Đua vịt tie-breaker đã bắt đầu! ${tiedPredictions.length} người cùng ${topScore} điểm.`,
    players: raceData.players,
  });
}
