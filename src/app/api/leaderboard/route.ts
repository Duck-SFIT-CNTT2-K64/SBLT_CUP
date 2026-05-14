import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { handleApiError } from "@/lib/api-error";
import { cacheGet, cacheSet } from "@/lib/cache";

/**
 * GET /api/leaderboard
 * 1 SQL query duy nhất — PostgreSQL tự tính aggregate + sort, không load gì về RAM.
 */
export async function GET(req: NextRequest) {
  try {
  const top = Math.min(Number(req.nextUrl.searchParams.get("top")) || 50, 200);

  const cacheKey = `leaderboard:players:${top}`;
  const cached = await cacheGet<Record<string, unknown>[]>(cacheKey);
  if (cached) {
    return NextResponse.json(cached, {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate",
        "X-Cache": "HIT",
      },
    });
  }

  // Single query: PostgreSQL tự JOIN, GROUP BY, SUM, COUNT, AVG, ORDER BY
  const leaderboard = await prisma.$queryRaw<
    {
      id: string;
      ign: string;
      rank: string | null;
      avatar: string | null;
      totalPoints: bigint;
      totalGames: bigint;
      top1Count: bigint;
      top4Count: bigint;
      avgPlacement: number;
      tournamentsPlayed: bigint;
    }[]
  >`
    SELECT
      p.id,
      p.ign,
      p.rank,
      u.avatar,
      COALESCE(SUM(gr.points), 0)                        AS "totalPoints",
      COUNT(gr.id)                                        AS "totalGames",
      COUNT(*) FILTER (WHERE gr.placement = 1)            AS "top1Count",
      COUNT(*) FILTER (WHERE gr.placement <= 4)           AS "top4Count",
      ROUND(AVG(gr.placement)::numeric, 1)                AS "avgPlacement",
      (
        SELECT COUNT(DISTINCT r."tournamentId")
        FROM "Registration" r
        WHERE r."playerId" = p.id AND r.status = 'APPROVED'
      )                                                   AS "tournamentsPlayed"
    FROM "Player" p
    JOIN "GameResult" gr ON gr."playerId" = p.id
    JOIN "User" u ON u.id = p."userId"
    WHERE p."isGuest" = false
    GROUP BY p.id, p.ign, p.rank, u.avatar
    ORDER BY "totalPoints" DESC, "top1Count" DESC, "avgPlacement" ASC
    LIMIT ${top}
  `;

  // Map bigint → number cho JSON serialization, tính top4Rate ở đây (1 phép tính nhẹ)
  const result = leaderboard.map((r) => {
    const totalGames = Number(r.totalGames);
    const top4Count = Number(r.top4Count);
    return {
      id: r.id,
      ign: r.ign,
      rank: r.rank,
      avatar: r.avatar,
      totalPoints: Number(r.totalPoints),
      totalGames,
      top1Count: Number(r.top1Count),
      top4Count,
      avgPlacement: r.avgPlacement,
      tournamentsPlayed: Number(r.tournamentsPlayed),
      top4Rate: totalGames > 0 ? Math.round((top4Count / totalGames) * 100) : 0,
    };
  });

  await cacheSet(cacheKey, result, 60);

  return NextResponse.json(result, {
    headers: {
      "Cache-Control": "public, s-maxage=60, stale-while-revalidate",
      "X-Cache": "MISS",
    },
  });
  } catch (error) {
    return handleApiError(error);
  }
}
