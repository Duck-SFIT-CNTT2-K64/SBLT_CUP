import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/predictions/leaderboard/[userId]
 * Chi tiết dự đoán của một user qua tất cả các stage đã chấm điểm.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;

    const predictions = await prisma.prediction.findMany({
      where: { userId, status: "SCORED" },
      orderBy: { stage: { stageOrder: "asc" } },
      include: {
        stage: { select: { id: true, name: true, stageType: true } },
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

    const stages = predictions.map((pred) => ({
      stageId: pred.stage.id,
      stageName: pred.stage.name,
      stageType: pred.stage.stageType,
      totalScore: pred.totalScore,
      entries: pred.entries.map((e) => ({
        groupName: e.group.name,
        predictedPlayers: [
          e.rank1Player.ign,
          e.rank2Player.ign,
          e.rank3Player.ign,
          e.rank4Player.ign,
        ],
        actualResults: e.group.players.map((gp) => ({
          ign: gp.player.ign,
          finalRank: gp.finalRank,
        })),
        rank1Correct: e.rank1Points > 0,
        rank2Correct: e.rank2Points > 0,
        rank3Correct: e.rank3Points > 0,
        rank4Correct: e.rank4Points > 0,
        points: e.rank1Points + e.rank2Points + e.rank3Points + e.rank4Points,
      })),
    }));

    return NextResponse.json(
      { userId, stages },
      { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate" } }
    );
  } catch (err) {
    return handleApiError(err);
  }
}
