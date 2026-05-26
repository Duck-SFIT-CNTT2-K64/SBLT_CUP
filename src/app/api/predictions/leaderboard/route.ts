import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { Prisma } from "@prisma/client";
import { handleApiError } from "@/lib/api-error";
import { cacheGet, cacheSet } from "@/lib/cache";

/**
 * GET /api/predictions/leaderboard
 * Bảng xếp hạng dự đoán toàn cục — tổng hợp điểm dự đoán qua tất cả các stage.
 * Người có nhiều điểm nhất sau Chung Kết sẽ nhận giải thưởng Riot.
 */
export async function GET(req: NextRequest) {
  try {
    const top = Math.min(Number(req.nextUrl.searchParams.get("top")) || 200, 200);
    const tournamentId = req.nextUrl.searchParams.get("tournamentId");

    const cacheKey = `leaderboard:predictions:${tournamentId || "all"}:${top}`;
    const cached = await cacheGet<Record<string, unknown>[]>(cacheKey);
    if (cached) {
      return NextResponse.json(cached, {
        headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate", "X-Cache": "HIT" },
      });
    }

    const tournamentFilter = tournamentId
      ? Prisma.sql`AND s."tournamentId" = ${tournamentId}`
      : Prisma.empty;

    const leaderboard = await prisma.$queryRaw<
      {
        id: string;
        name: string;
        avatar: string | null;
        totalPredictionPoints: bigint;
        stagesPredicted: bigint;
        stagesWithPoints: bigint;
      }[]
    >`
      SELECT
        u.id,
        u.name,
        u.avatar,
        COALESCE(SUM(p."totalScore"), 0)              AS "totalPredictionPoints",
        COUNT(p.id)                                    AS "stagesPredicted",
        COUNT(p.id) FILTER (WHERE p."totalScore" > 0)  AS "stagesWithPoints"
      FROM "User" u
      JOIN "Prediction" p ON p."userId" = u.id
      JOIN "Stage" s ON s.id = p."stageId"
      WHERE p.status = 'SCORED'
      ${tournamentFilter}
      GROUP BY u.id, u.name, u.avatar
      ORDER BY "totalPredictionPoints" DESC
      LIMIT ${top}
    `;

    const result = leaderboard.map((r) => ({
      id: r.id,
      name: r.name,
      avatar: r.avatar,
      totalPredictionPoints: Number(r.totalPredictionPoints),
      stagesPredicted: Number(r.stagesPredicted),
      stagesWithPoints: Number(r.stagesWithPoints),
    }));

    await cacheSet(cacheKey, result, 60);

    return NextResponse.json(result, {
      headers: { "Cache-Control": "public, s-maxage=60, stale-while-revalidate", "X-Cache": "MISS" },
    });
  } catch (err) {
    return handleApiError(err);
  }
}
