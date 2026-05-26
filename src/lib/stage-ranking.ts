/**
 * Shared ranking logic for GroupPlayers within a stage.
 * Used by: advance endpoint, game results auto-trigger.
 */

export interface RankedPlayer {
  groupPlayerId: string;
  playerId: string;
  ign: string;
  totalPoints: number;
  top1Count: number;
  top4Count: number;
  bestPlacement: number;
}

/**
 * Rank all players in a group by: totalPoints DESC → top1Count DESC → top4Count DESC → bestPlacement ASC → playerId.
 */
export function rankGroupPlayers(group: {
  players: { id: string; playerId: string; totalPoints: number; player: { ign: string } }[];
  games: { results: { playerId: string; placement: number; points: number }[] }[];
}): RankedPlayer[] {
  const players: RankedPlayer[] = group.players.map((gp) => {
    const allResults = group.games.flatMap((g) =>
      g.results.filter((r) => r.playerId === gp.playerId)
    );

    const top1Count = allResults.filter((r) => r.placement === 1).length;
    const top4Count = allResults.filter((r) => r.placement <= 4).length;
    const bestPlacement = allResults.length > 0
      ? Math.min(...allResults.map((r) => r.placement))
      : 99;

    return {
      groupPlayerId: gp.id,
      playerId: gp.playerId,
      ign: gp.player.ign,
      totalPoints: gp.totalPoints,
      top1Count,
      top4Count,
      bestPlacement,
    };
  });

  return players.sort((a, b) => {
    if (b.totalPoints !== a.totalPoints) return b.totalPoints - a.totalPoints;
    if (b.top1Count !== a.top1Count) return b.top1Count - a.top1Count;
    if (b.top4Count !== a.top4Count) return b.top4Count - a.top4Count;
    if (a.bestPlacement !== b.bestPlacement) return a.bestPlacement - b.bestPlacement;
    return a.playerId.localeCompare(b.playerId);
  });
}
