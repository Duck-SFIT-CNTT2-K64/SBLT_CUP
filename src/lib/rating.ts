export interface PlayerStats {
  totalPoints: number;
  totalGames: number;
  top1Count: number;
  top4Count: number;
  avgPlacement: number;
  maxTotalPoints: number;
}

/**
 * Compute composite rating (0-1000) from player stats.
 * Returns null if fewer than 3 games played.
 */
export function computeRating(stats: PlayerStats): number | null {
  if (stats.totalGames < 3) return null;

  const c1 = stats.maxTotalPoints > 0
    ? Math.min(stats.totalPoints / stats.maxTotalPoints, 1)
    : 0;
  const c2 = Math.max(0, Math.min((8 - stats.avgPlacement) / 7, 1));
  const c3 = stats.top4Count / stats.totalGames;
  const c4 = stats.top1Count / stats.totalGames;

  return Math.round(
    Math.min((c1 * 0.30 + c2 * 0.25 + c3 * 0.25 + c4 * 0.20) * 1000, 1000)
  );
}

/**
 * Returns Tailwind text color class based on rating.
 */
export function getRatingColor(rating: number | null): string {
  if (rating === null) return "text-[#666]";
  if (rating >= 700) return "text-emerald-400";
  if (rating >= 400) return "text-yellow-400";
  return "text-red-400";
}

/**
 * Returns Tailwind bg/border class for rating badge.
 */
export function getRatingBgColor(rating: number | null): string {
  if (rating === null) return "bg-[#222] text-[#666]";
  if (rating >= 700) return "bg-emerald-500/10 text-emerald-400 border border-emerald-500/25";
  if (rating >= 400) return "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25";
  return "bg-red-500/10 text-red-400 border border-red-500/25";
}
