import { prisma } from "@/lib/prisma";
import { PREDICTION_SCORING, PREDICTION_WINDOW } from "@/lib/constants";
import { createNotification } from "@/lib/notifications";

interface PredictionWindowResult {
  isOpen: boolean;
  windowOpensAt: string;
  windowClosesAt: string;
}

/**
 * Kiểm tra cửa sổ dự đoán cho một stage.
 * Window: 09:00-19:30 giờ Việt Nam (UTC+7) ngày thi đấu.
 */
export function getPredictionWindow(stageDate: Date): PredictionWindowResult {
  const { OPEN_HOUR, OPEN_MINUTE, CLOSE_HOUR, CLOSE_MINUTE, TIMEZONE_OFFSET_HOURS } = PREDICTION_WINDOW;

  const vnDateStr = stageDate.toLocaleDateString("en-CA", { timeZone: "Asia/Ho_Chi_Minh" });
  const [year, month, day] = vnDateStr.split("-").map(Number);

  const opensAt = new Date(Date.UTC(year, month - 1, day, OPEN_HOUR - TIMEZONE_OFFSET_HOURS, OPEN_MINUTE, 0, 0));
  const closesAt = new Date(Date.UTC(year, month - 1, day, CLOSE_HOUR - TIMEZONE_OFFSET_HOURS, CLOSE_MINUTE, 0, 0));

  const now = new Date();
  const isOpen = now >= opensAt && now < closesAt;

  return {
    isOpen,
    windowOpensAt: opensAt.toISOString(),
    windowClosesAt: closesAt.toISOString(),
  };
}

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

  // Logic mới: top 4 = 4 người có finalRank 1-4 (không cần đúng vị trí)
  const actualTop4Map = new Map<string, Set<string>>();
  for (const group of groups) {
    const top4 = new Set<string>();
    for (const gp of group.players) {
      if (gp.finalRank !== null && gp.finalRank >= 1 && gp.finalRank <= 4) {
        top4.add(gp.playerId);
      }
    }
    actualTop4Map.set(group.id, top4);
  }

  let scored = 0;
  const scoreMap = new Map<string, number>();

  await prisma.$transaction(async (tx) => {
    for (const prediction of predictions) {
      let totalScore = 0;

      for (const entry of prediction.entries) {
        const actualTop4 = actualTop4Map.get(entry.groupId);
        if (!actualTop4) continue;

        // Logic mới: mỗi predicted player có trong top 4 thực tế = +10đ (không cần đúng vị trí)
        const r1pts = (actualTop4.has(entry.rank1PlayerId) ? PREDICTION_SCORING[1] : 0) * multiplier;
        const r2pts = (actualTop4.has(entry.rank2PlayerId) ? PREDICTION_SCORING[2] : 0) * multiplier;
        const r3pts = (actualTop4.has(entry.rank3PlayerId) ? PREDICTION_SCORING[3] : 0) * multiplier;
        const r4pts = (actualTop4.has(entry.rank4PlayerId) ? PREDICTION_SCORING[4] : 0) * multiplier;

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

      scoreMap.set(prediction.id, totalScore);
      scored++;
    }
  });

  // Send notifications using freshly computed scores from the transaction
  for (const prediction of predictions) {
    const totalScore = scoreMap.get(prediction.id) ?? 0;

    if (totalScore > 0) {
      await createNotification({
        userId: prediction.userId,
        type: "PREDICTION_SCORED",
        title: "Dự đoán đã được chấm điểm!",
        message: `Bạn đã nhận được ${totalScore} điểm dự đoán. Xem bảng xếp hạng để biết chi tiết.`,
        link: `/predictions/leaderboard`,
      });
    }
  }

  return { scored, totalPredictions: predictions.length };
}
