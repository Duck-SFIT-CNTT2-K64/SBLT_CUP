import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";

/**
 * GET /api/predictions/leaderboard
 * Bảng xếp hạng dự đoán toàn cục — tổng hợp điểm dự đoán qua tất cả các stage.
 * Người có nhiều điểm nhất sau Chung Kết sẽ nhận giải thưởng Riot.
 */
export async function GET(req: NextRequest) {
  try {
    const top = Math.min(Number(req.nextUrl.searchParams.get("top")) || 50, 200);

    const leaderboard = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        totalPredictionPoints: bigint;
        stagesPredicted: bigint;
        stagesWithPoints: bigint;
      }[]
    >`
      SELECT
        u.id,
        u.name,
        COALESCE(SUM(p."totalScore"), 0)              AS "totalPredictionPoints",
        COUNT(p.id)                                    AS "stagesPredicted",
        COUNT(p.id) FILTER (WHERE p."totalScore" > 0)  AS "stagesWithPoints"
      FROM "User" u
      JOIN "Prediction" p ON p."userId" = u.id
      WHERE p.status = 'SCORED'
      GROUP BY u.id, u.name
      ORDER BY "totalPredictionPoints" DESC
      LIMIT ${top}
    `;

    const result = leaderboard.map((r) => ({
      id: r.id,
      name: r.name,
      totalPredictionPoints: Number(r.totalPredictionPoints),
      stagesPredicted: Number(r.stagesPredicted),
      stagesWithPoints: Number(r.stagesWithPoints),
    }));

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate" },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
