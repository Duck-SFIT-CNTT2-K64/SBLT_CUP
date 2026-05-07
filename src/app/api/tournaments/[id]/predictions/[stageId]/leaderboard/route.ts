import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tournaments/[id]/predictions/[stageId]/leaderboard
 * Bảng xếp hạng dự đoán cho một stage (public, sau khi đã chấm điểm).
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; stageId: string }> }
) {
  const { id: tournamentId, stageId } = await params;

  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    select: { id: true, name: true, tournamentId: true, status: true },
  });

  if (!stage || stage.tournamentId !== tournamentId) {
    return NextResponse.json({ error: "Không tìm thấy vòng đấu" }, { status: 404 });
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
          group: { select: { name: true, groupOrder: true } },
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
      rank1Correct: e.rank1Points > 0,
      rank2Correct: e.rank2Points > 0,
      rank3Correct: e.rank3Points > 0,
      rank4Correct: e.rank4Points > 0,
      points: e.rank1Points + e.rank2Points + e.rank3Points + e.rank4Points,
    })),
  }));

  return NextResponse.json(
    { stageId, stageName: stage.name, leaderboard },
    { headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate" } }
  );
}
