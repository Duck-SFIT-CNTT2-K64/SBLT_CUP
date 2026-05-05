"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft, Users } from "lucide-react";

interface GameResult {
  id: string;
  placement: number;
  points: number;
  playerId: string;
  player: { id: string; ign: string };
}

interface Game {
  id: string;
  gameNumber: number;
  status: string;
  results: GameResult[];
}

interface GroupPlayer {
  id: string;
  totalPoints: number;
  player: { id: string; ign: string };
}

interface Group {
  id: string;
  name: string;
  groupOrder: number;
  players: GroupPlayer[];
  games: Game[];
}

interface Stage {
  id: string;
  name: string;
  stageOrder: number;
  totalGames: number;
  groups: Group[];
}

interface Tournament {
  id: string;
  name: string;
  season: number;
  stages: Stage[];
}

export default function BracketsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedGameNumber, setSelectedGameNumber] = useState<number>(1);

  useEffect(() => {
    fetch(`/api/tournaments/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => {
        setTournament(data);
        if (data.stages?.length > 0) setSelectedStageId(data.stages[0].id);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;
  if (!tournament) return <div className="text-center py-20 text-gray-400">Không tìm thấy giải đấu</div>;

  const stage = tournament.stages.find((s) => s.id === selectedStageId);
  const maxGames = stage ? Math.max(...stage.groups.map((g) => g.games.length), 1) : 1;
  const gameNumbers = Array.from({ length: maxGames }, (_, i) => i + 1);

  // For a group, get results for a specific game number
  const getGameResults = (group: Group, gameNumber: number) => {
    const game = group.games.find((g) => g.gameNumber === gameNumber);
    if (!game || game.results.length === 0) return null;
    return [...game.results].sort((a, b) => a.placement - b.placement);
  };

  const getPointColor = (points: number) => {
    if (points >= 7) return "text-red-400 font-bold";
    if (points >= 5) return "text-white";
    if (points >= 3) return "text-gray-300";
    return "text-gray-500";
  };

  const getPlacementBg = (placement: number) => {
    if (placement === 1) return "bg-red-600/20 border-l-2 border-red-500";
    if (placement <= 4) return "bg-zinc-800/80";
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tournaments/${params.id}`} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-red-600" />
            Bảng đấu theo Round
          </h1>
          <p className="text-gray-400 text-sm">{tournament.name} — Mùa {tournament.season}</p>
        </div>
      </div>

      {/* Stage + Game selector */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          {/* Stage */}
          <div>
            <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Vòng đấu</p>
            <div className="flex gap-2 flex-wrap">
              {tournament.stages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStageId(s.id); setSelectedGameNumber(1); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedStageId === s.id
                      ? "bg-red-600 text-white"
                      : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>

          {/* Game number */}
          {stage && maxGames > 0 && (
            <div>
              <p className="text-xs text-gray-500 mb-2 uppercase tracking-wide">Game</p>
              <div className="flex gap-2">
                {gameNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedGameNumber(n)}
                    className={`w-10 h-8 rounded-lg text-sm font-bold transition-colors ${
                      selectedGameNumber === n
                        ? "bg-white text-black"
                        : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
                    }`}
                  >
                    R{n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Stage info bar */}
      {stage && (
        <div className="flex items-center gap-4 mb-4 text-sm text-gray-400">
          <span className="flex items-center gap-1">
            <Users className="h-4 w-4" />
            {stage.groups.reduce((sum, g) => sum + g.players.length, 0)} người
          </span>
          <span>{stage.groups.length} bảng</span>
          <span className="ml-auto text-red-400 font-medium">
            Round {selectedGameNumber} / {maxGames}
          </span>
        </div>
      )}

      {/* Lobbies grid — 4 columns like reference */}
      {stage && stage.groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...stage.groups]
            .sort((a, b) => a.groupOrder - b.groupOrder)
            .map((group, idx) => {
              const results = getGameResults(group, selectedGameNumber);
              const sortedPlayers = [...group.players].sort(
                (a, b) => b.totalPoints - a.totalPoints
              );

              return (
                <div
                  key={group.id}
                  className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden"
                >
                  {/* Lobby header */}
                  <div className="flex items-center justify-between px-4 py-2.5 bg-zinc-800/80 border-b border-zinc-700">
                    <span className="text-sm font-semibold text-white">
                      Bảng {idx + 1}
                    </span>
                    <span className="text-xs text-gray-400">{group.name}</span>
                  </div>

                  {/* Player list for this round */}
                  <div className="p-2 space-y-0.5">
                    {results ? (
                      results.map((r) => (
                        <div
                          key={r.id}
                          className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${getPlacementBg(r.placement)}`}
                        >
                          <div className="flex items-center gap-2 min-w-0">
                            <span className="text-gray-500 w-4 text-xs shrink-0">{r.placement}</span>
                            <span className="text-white truncate">{r.player.ign}</span>
                          </div>
                          <span className={`shrink-0 ml-2 ${getPointColor(r.points)}`}>
                            {r.points}pts
                          </span>
                        </div>
                      ))
                    ) : (
                      // No results yet — show players with total points
                      sortedPlayers.length > 0 ? (
                        sortedPlayers.map((gp, i) => (
                          <div
                            key={gp.id}
                            className="flex items-center justify-between px-3 py-1.5 rounded text-sm"
                          >
                            <div className="flex items-center gap-2 min-w-0">
                              <span className="text-gray-600 w-4 text-xs shrink-0">{i + 1}</span>
                              <span className="text-gray-300 truncate">{gp.player.ign}</span>
                            </div>
                            <span className="text-gray-500 shrink-0 ml-2 text-xs">
                              {gp.totalPoints > 0 ? `${gp.totalPoints}pts` : "—"}
                            </span>
                          </div>
                        ))
                      ) : (
                        <div className="text-center py-4 text-gray-600 text-xs">
                          Chưa phân bổ
                        </div>
                      )
                    )}
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có bảng đấu cho vòng này</p>
        </div>
      )}
    </div>
  );
}
