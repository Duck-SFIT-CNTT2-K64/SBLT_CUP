import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const days = parseInt(searchParams.get("days") || "30");
  const since = new Date();
  since.setDate(since.getDate() - days);

  // Registrations over time
  const registrations = await prisma.registration.findMany({
    where: { registeredAt: { gte: since } },
    select: { registeredAt: true },
    orderBy: { registeredAt: "asc" },
  });

  const registrationsByDate = groupByDate(registrations.map((r) => r.registeredAt));

  // User signups over time
  const users = await prisma.user.findMany({
    where: { createdAt: { gte: since } },
    select: { createdAt: true },
    orderBy: { createdAt: "asc" },
  });

  const signupsByDate = groupByDate(users.map((u) => u.createdAt));

  // Match results distribution (placements)
  const results = await prisma.gameResult.groupBy({
    by: ["placement"],
    _count: { id: true },
    orderBy: { placement: "asc" },
  });

  const matchDistribution = Array.from({ length: 8 }, (_, i) => ({
    placement: i + 1,
    count: results.find((r) => r.placement === i + 1)?._count.id || 0,
  }));

  // Tournament status distribution
  const tournamentStatus = await prisma.tournament.groupBy({
    by: ["status"],
    _count: { id: true },
  });

  const tournamentStatusDistribution = tournamentStatus.map((t) => ({
    status: t.status,
    count: t._count.id,
  }));

  // Active players (players with at least 1 game result)
  const activePlayers = await prisma.gameResult.findMany({
    select: { playerId: true },
    distinct: ["playerId"],
  });

  // Prediction participation
  const predictionCount = await prisma.prediction.count();

  // Game results over time
  const gameResults = await prisma.gameResult.findMany({
    where: { game: { status: "COMPLETED" } },
    select: { game: { select: { endTime: true } } },
    orderBy: { game: { endTime: "asc" } },
  });

  const gameResultsByDate = groupByDate(
    gameResults.filter((r) => r.game.endTime).map((r) => r.game.endTime!)
  );

  return NextResponse.json({
    registrationsByDate,
    signupsByDate,
    matchDistribution,
    tournamentStatusDistribution,
    activePlayerCount: activePlayers.length,
    predictionCount,
    gameResultsByDate,
  });
}

function groupByDate(dates: Date[]): { date: string; count: number }[] {
  const map = new Map<string, number>();
  for (const date of dates) {
    const key = date.toISOString().split("T")[0];
    map.set(key, (map.get(key) || 0) + 1);
  }
  return Array.from(map.entries())
    .map(([date, count]) => ({ date, count }))
    .sort((a, b) => a.date.localeCompare(b.date));
}
