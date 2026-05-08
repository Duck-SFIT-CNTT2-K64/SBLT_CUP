"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Users, Trophy } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface GameResult {
  id: string;
  placement: number;
  points: number;
  playerId: string;
  player: { id: string; ign: string; isGuest: boolean };
}

interface Game {
  id: string;
  gameNumber: number;
  status: string;
  results: GameResult[];
}

interface GroupPlayer {
  playerId: string;
  player: { id: string; ign: string; rank: string | null; isGuest: boolean };
}

interface SiblingGroup {
  id: string;
  name: string;
  groupOrder: number;
}

interface GroupDetail {
  id: string;
  name: string;
  stageId: string;
  groupOrder: number;
  players: GroupPlayer[];
  games: Game[];
  siblingGroups: SiblingGroup[];
}

export default function LobbyDetailPage() {
  const params = useParams();
  const router = useRouter();
  const [group, setGroup] = useState<GroupDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedRound, setSelectedRound] = useState(1);

  useEffect(() => {
    const groupId = params.groupId as string;
    const tournamentId = params.id as string;

    // First fetch tournament to find which stage contains this group
    fetch(`/api/tournaments/${tournamentId}`)
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((tournament) => {
        // Find the stage that contains this group
        let foundStageId: string | null = null;
        for (const stage of tournament.stages || []) {
          for (const g of stage.groups || []) {
            if (g.id === groupId) {
              foundStageId = stage.id;
              break;
            }
          }
          if (foundStageId) break;
        }
        if (!foundStageId) throw new Error();
        // Now fetch group detail
        return fetch(`/api/tournaments/${tournamentId}/stages/${foundStageId}/groups/${groupId}`);
      })
      .then((r) => {
        if (!r.ok) throw new Error();
        return r.json();
      })
      .then((data) => {
        setGroup(data);
        if (data.games?.length > 0) {
          const maxRound = Math.max(...data.games.map((g: Game) => g.gameNumber));
          setSelectedRound(Math.min(1, maxRound));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id, params.groupId]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!group) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-sblt-muted">
        Không tìm thấy bảng đấu
      </div>
    );
  }

  const maxRound = group.games.length > 0 ? Math.max(...group.games.map((g) => g.gameNumber)) : 0;
  const rounds = Array.from({ length: maxRound }, (_, i) => i + 1);

  // Build player rows with per-round data and totals
  const playerRows = group.players.map((gp) => {
    let totalPoints = 0;
    const roundData: Record<number, { placement: number; points: number }> = {};

    for (const game of group.games) {
      const result = game.results.find((r) => r.playerId === gp.playerId);
      if (result) {
        roundData[game.gameNumber] = { placement: result.placement, points: result.points };
        totalPoints += result.points;
      }
    }

    return {
      playerId: gp.playerId,
      ign: gp.player.ign,
      isGuest: gp.player.isGuest,
      totalPoints,
      rounds: roundData,
    };
  });

  // Sort by total points descending
  playerRows.sort((a, b) => b.totalPoints - a.totalPoints);

  // Check if any game is IN_PROGRESS
  const isLive = group.games.some((g) => g.status === "IN_PROGRESS");

  const getPlacementLabel = (p: number) => {
    if (p === 1) return "1st";
    if (p === 2) return "2nd";
    if (p === 3) return "3rd";
    return `${p}th`;
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <button
          onClick={() => router.back()}
          className="text-sblt-muted hover:text-white transition-colors"
        >
          <ArrowLeft className="h-5 w-5" />
        </button>
        <div className="flex items-center gap-3">
          <Users className="h-6 w-6 text-sblt-red" />
          <h1 className="text-2xl font-bold text-white">{group.name}</h1>
          {isLive && <Badge variant="live">LIVE</Badge>}
        </div>
      </div>

      {/* Round tabs */}
      {rounds.length > 0 && (
        <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
          {rounds.map((r) => (
            <button
              key={r}
              onClick={() => setSelectedRound(r)}
              className={`px-4 py-2 rounded-lg text-sm font-bold transition-all duration-200 ${
                selectedRound === r
                  ? "bg-white text-black shadow-lg"
                  : "bg-sblt-dark text-sblt-muted hover:text-white border border-sblt-border hover:border-sblt-red/50"
              }`}
            >
              R{r}
            </button>
          ))}
        </div>
      )}

      {/* Results table */}
      <div className="overflow-x-auto rounded-xl border border-sblt-border bg-sblt-card">
        <table className="w-full">
          <thead>
            <tr className="border-b-2 border-sblt-red">
              <th className="px-4 py-3 text-left text-xs font-semibold text-sblt-muted uppercase tracking-wider w-12">#</th>
              <th className="px-4 py-3 text-left text-xs font-semibold text-sblt-muted uppercase tracking-wider">PLAYER</th>
              {rounds.map((r) => (
                <th
                  key={r}
                  className={`px-4 py-3 text-center text-xs font-semibold uppercase tracking-wider ${
                    r === selectedRound
                      ? "text-white bg-sblt-red/10"
                      : "text-sblt-muted"
                  }`}
                >
                  R{r}
                </th>
              ))}
              <th className="px-4 py-3 text-center text-xs font-semibold text-sblt-muted uppercase tracking-wider">TOTAL</th>
            </tr>
          </thead>
          <tbody>
            {playerRows.map((row, idx) => {
              const rank = idx + 1;
              return (
                <tr
                  key={row.playerId}
                  className={`border-b border-sblt-border transition-colors hover:bg-sblt-red/5 ${
                    rank <= 3 ? "bg-sblt-dark/50" : ""
                  }`}
                >
                  {/* Rank */}
                  <td className="px-4 py-3">
                    <span className={`text-sm font-bold ${
                      rank === 1 ? "text-sblt-red" :
                      rank === 2 ? "text-amber-400" :
                      rank === 3 ? "text-orange-400" :
                      "text-sblt-muted"
                    }`}>
                      {rank}
                    </span>
                  </td>

                  {/* Player */}
                  <td className="px-4 py-3">
                    <span className={`text-sm font-medium ${
                      rank === 1 ? "text-sblt-red font-bold" : "text-white"
                    }`}>
                      {row.ign}
                    </span>
                    {row.isGuest && (
                      <span className="ml-2 text-xs text-sblt-muted bg-sblt-border px-1.5 py-0.5 rounded">
                        Khách
                      </span>
                    )}
                  </td>

                  {/* Round columns */}
                  {rounds.map((r) => {
                    const rd = row.rounds[r];
                    return (
                      <td
                        key={r}
                        className={`px-4 py-3 text-center ${
                          r === selectedRound ? "bg-sblt-red/10" : ""
                        }`}
                      >
                        {rd ? (
                          <div>
                            <div className={`text-xs ${
                              rd.placement === 1 ? "text-sblt-red font-bold" :
                              rd.placement <= 3 ? "text-amber-400 font-semibold" :
                              "text-sblt-muted"
                            }`}>
                              {getPlacementLabel(rd.placement)}
                            </div>
                            <div className={`text-xs mt-0.5 ${
                              rd.points >= 8 ? "text-white font-bold" :
                              rd.points >= 5 ? "text-sblt-white" :
                              "text-sblt-muted"
                            }`}>
                              {rd.points}pts
                            </div>
                          </div>
                        ) : (
                          <span className="text-sblt-border text-xs">—</span>
                        )}
                      </td>
                    );
                  })}

                  {/* Total */}
                  <td className="px-4 py-3 text-center">
                    <span className={`text-sm font-bold ${
                      row.totalPoints > 0 ? "text-white" : "text-sblt-border"
                    }`}>
                      {row.totalPoints > 0 ? row.totalPoints : "—"}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {playerRows.length === 0 && (
          <div className="text-center py-12 text-sblt-muted">
            <Trophy className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có tuyển thủ trong bảng này</p>
          </div>
        )}
      </div>

      {/* Lobby switcher */}
      {group.siblingGroups.length > 1 && (
        <div className="mt-6">
          <p className="text-xs text-sblt-muted mb-3 uppercase tracking-wider">Chuyển bảng</p>
          <div className="flex gap-2 flex-wrap">
            {group.siblingGroups.map((sg) => (
              <Link
                key={sg.id}
                href={`/tournaments/${params.id}/brackets/${sg.id}`}
                className={`px-5 py-2 rounded-lg text-sm font-medium transition-all duration-200 ${
                  sg.id === group.id
                    ? "bg-sblt-red text-white shadow-lg shadow-sblt-red/20"
                    : "bg-sblt-dark text-sblt-muted hover:text-white border border-sblt-border hover:border-sblt-red/50"
                }`}
              >
                {sg.name}
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
