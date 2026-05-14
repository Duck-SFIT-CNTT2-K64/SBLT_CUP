import { cacheDeletePattern } from "@/lib/cache";

export async function invalidateTournament(tournamentId: string) {
  await cacheDeletePattern(`tournament:${tournamentId}:*`);
}

export async function invalidateLeaderboard() {
  await cacheDeletePattern("leaderboard:*");
}

export async function invalidatePredictionLeaderboard() {
  await cacheDeletePattern("leaderboard:predictions:*");
}
