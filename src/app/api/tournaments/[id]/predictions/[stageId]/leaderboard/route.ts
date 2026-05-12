import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/tournaments/[id]/predictions/[stageId]/leaderboard
 * Bảng xếp hạng dự đoán cho một stage (public, sau khi đã chấm điểm).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  try {
    const { id: tournamentId, stageId } = await params;

    const stage = await prisma.stage.findUnique({
      where: { id: stageId },
      select: { id: true, name: true, tournamentId: true, status: true },
    });

    if (!stage || stage.tournamentId !== tournamentId) {
      return NextResponse.json(
        { error: "Không tìm thấy vòng đấu", code: "NOT_FOUND" },
        { status: 404 }
      );
    }

    const top = Math.min(Number(req.nextUrl.searchParams.get("top")) || 50, 200);

    const predictions = await prisma.prediction.findMany({
      where: { stageId, status: "SCORED" },
      orderBy: { totalScore: "desc" },
      take: top,
      include: {
        user: { select: { id: true, name: true } },
        entries: {
          include: {
            group: {
              select: {
                name: true,
                groupOrder: true,
                players: {
                  include: { player: { select: { ign: true } } },
                  orderBy: { finalRank: "asc" },
                },
              },
            },
            rank1Player: { select: { ign: true } },
            rank2Player: { select: { ign: true } },
            rank3Player: { select: { ign: true } },
            rank4Player: { select: { ign: true } },
          },
          orderBy: { group: { groupOrder: "asc" } },
        },
      },
    });

    const leaderboard = predictions.map((pred, idx) => ({
      rank: idx + 1,
      userId: pred.user.id,
      userName: pred.user.name || "Ẩn danh",
      totalScore: pred.totalScore,
      entries: pred.entries.map((e) => ({
        groupName: e.group.name,
        // Logic mới: slot1-4Correct = predicted player có trong top 4 thực tế (không cần đúng vị trí)
        slot1Correct: e.rank1Points > 0,
        slot2Correct: e.rank2Points > 0,
        slot3Correct: e.rank3Points > 0,
        slot4Correct: e.rank4Points > 0,
        points: e.rank1Points + e.rank2Points + e.rank3Points + e.rank4Points,
        predictedPlayers: [
          e.rank1Player.ign,
          e.rank2Player.ign,
          e.rank3Player.ign,
          e.rank4Player.ign,
        ],
        actualResults: e.group.players
          .filter((gp) => gp.finalRank !== null && gp.finalRank >= 1 && gp.finalRank <= 4)
          .sort((a, b) => (a.finalRank ?? 0) - (b.finalRank ?? 0))
          .map((gp) => ({
            ign: gp.player.ign,
            finalRank: gp.finalRank,
          })),
      })),
    }));

    return NextResponse.json(
      { stageId, stageName: stage.name, leaderboard },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate" } }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
