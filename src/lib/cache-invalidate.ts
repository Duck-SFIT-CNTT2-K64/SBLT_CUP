import { cacheDelete, cacheDeletePattern } from "@/lib/cache";

export async function invalidateTournament(tournamentId: string) {
  await cacheDeletePattern(`tournament:${tournamentId}:*`);
}

export async function invalidateLeaderboard() {
  await cacheDeletePattern("leaderboard:*");
}

export async function invalidateNotificationCount(userId: string) {
  await cacheDelete(`notif:unread:${userId}`);
}

export async function invalidatePredictionLeaderboard(stageId?: string) {
  await cacheDeletePattern("leaderboard:predictions:*");
  if (stageId) await cacheDelete(`leaderboard:pred:${stageId}`);
}
