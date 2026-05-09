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

  // Daily active users (users who submitted predictions, comments, or had game results)
  const [recentPredictions, recentComments, recentResults] = await Promise.all([
    prisma.prediction.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true, createdAt: true },
    }),
    prisma.comment.findMany({
      where: { createdAt: { gte: since } },
      select: { userId: true, createdAt: true },
    }),
    prisma.gameResult.findMany({
      where: { game: { endTime: { gte: since } } },
      select: { playerId: true, game: { select: { endTime: true } } },
    }),
  ]);

  // Combine all activity dates
  const activityDates: Date[] = [
    ...recentPredictions.map((p: { createdAt: Date }) => p.createdAt),
    ...recentComments.map((c: { createdAt: Date }) => c.createdAt),
    ...recentResults.filter((r: { game: { endTime: Date | null } }) => r.game.endTime).map((r: { game: { endTime: Date | null } }) => r.game.endTime!),
  ];

  const dailyActivity = groupByDate(activityDates);

  // Top players by recent activity
  const playerActivityMap = new Map<string, number>();
  for (const pred of recentPredictions) {
    playerActivityMap.set(pred.userId, (playerActivityMap.get(pred.userId) || 0) + 1);
  }
  for (const comment of recentComments) {
    playerActivityMap.set(comment.userId, (playerActivityMap.get(comment.userId) || 0) + 1);
  }

  const topUserIds = Array.from(playerActivityMap.entries())
    .sort((a, b) => b[1] - a[1])
    .slice(0, 10)
    .map(([userId]) => userId);

  const topUsers = topUserIds.length > 0
    ? await prisma.user.findMany({
        where: { id: { in: topUserIds } },
        select: { id: true, name: true, player: { select: { ign: true } } },
      })
    : [];

  const topPlayers = topUsers.map((u: { id: string; name: string | null; player: { ign: string } | null }) => ({
    userId: u.id,
    name: u.player?.ign || u.name,
    activityCount: playerActivityMap.get(u.id) || 0,
  })).sort((a, b) => b.activityCount - a.activityCount);

  // Dispute resolution stats
  const [totalDisputes, resolvedDisputes, rejectedDisputes] = await Promise.all([
    prisma.dispute.count({ where: { createdAt: { gte: since } } }),
    prisma.dispute.count({ where: { status: "RESOLVED", resolvedAt: { gte: since } } }),
    prisma.dispute.count({ where: { status: "REJECTED", resolvedAt: { gte: since } } }),
  ]);

  const resolvedCount = resolvedDisputes + rejectedDisputes;
  const resolutionRate = totalDisputes > 0 ? Math.round((resolvedCount / totalDisputes) * 100) : 0;

  return NextResponse.json({
    dailyActivity,
    topPlayers,
    disputeStats: {
      total: totalDisputes,
      resolved: resolvedDisputes,
      rejected: rejectedDisputes,
      resolutionRate,
    },
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
