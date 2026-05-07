import { prisma } from "@/lib/prisma";
import { PREDICTION_SCORING } from "@/lib/constants";

/**
 * Chấm điểm dự đoán cho một stage đã hoàn thành.
 * So sánh predicted rank1-4 với actual finalRank trong mỗi group.
 * Điểm: đúng top 1-4 = 10đ/rank. Chung kết (FINAL) x2 = 20đ/rank.
 *
 * Được gọi tự động khi stage chuyển sang COMPLETED (qua advance hoặc status endpoint).
 */
export async function scorePredictionsForStage(
  stageId: string
): Promise<{ scored: number; totalPredictions: number }> {
  const predictions = await prisma.prediction.findMany({
    where: { stageId },
    include: { entries: true },
  });

  if (predictions.length === 0) return { scored: 0, totalPredictions: 0 };

  // Lấy stageType để xác định multiplier
  const stage = await prisma.stage.findUnique({
    where: { id: stageId },
    select: { stageType: true },
  });

  const multiplier = stage?.stageType === "FINAL" ? 2 : 1;

  // Lấy kết quả thực tế: finalRank -> playerId cho mỗi group
  const groups = await prisma.group.findMany({
    where: { stageId },
    include: {
      players: {
        where: { finalRank: { not: null } },
        select: { playerId: true, finalRank: true },
      },
    },
  });

  const actualRankMap = new Map<string, Map<number, string>>();
  for (const group of groups) {
    const rankMap = new Map<number, string>();
    for (const gp of group.players) {
      if (gp.finalRank !== null) {
        rankMap.set(gp.finalRank, gp.playerId);
      }
    }
    actualRankMap.set(group.id, rankMap);
  }

  let scored = 0;
  await prisma.$transaction(async (tx) => {
    for (const prediction of predictions) {
      let totalScore = 0;

      for (const entry of prediction.entries) {
        const actualRanks = actualRankMap.get(entry.groupId);
        if (!actualRanks) continue;

        const r1pts = (actualRanks.get(1) === entry.rank1PlayerId ? PREDICTION_SCORING[1] : 0) * multiplier;
        const r2pts = (actualRanks.get(2) === entry.rank2PlayerId ? PREDICTION_SCORING[2] : 0) * multiplier;
        const r3pts = (actualRanks.get(3) === entry.rank3PlayerId ? PREDICTION_SCORING[3] : 0) * multiplier;
        const r4pts = (actualRanks.get(4) === entry.rank4PlayerId ? PREDICTION_SCORING[4] : 0) * multiplier;

        totalScore += r1pts + r2pts + r3pts + r4pts;

        await tx.predictionEntry.update({
          where: { id: entry.id },
          data: {
            rank1Points: r1pts,
            rank2Points: r2pts,
            rank3Points: r3pts,
            rank4Points: r4pts,
          },
        });
      }

      await tx.prediction.update({
        where: { id: prediction.id },
        data: { totalScore, status: "SCORED" },
      });

      scored++;
    }
  });

  return { scored, totalPredictions: predictions.length };
}
