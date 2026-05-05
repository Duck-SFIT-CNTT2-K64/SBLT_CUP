"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";

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

export default function ResultsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

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

  // Build lobby draw: for each group, show players sorted by totalPoints (LP)
  const buildLobbyDraw = (group: Group) => {
    return [...group.players].sort((a, b) => b.totalPoints - a.totalPoints);
  };

  // Build per-game results for a group
  const getGameSummary = (group: Group) => {
    return [...group.games]
      .sort((a, b) => a.gameNumber - b.gameNumber)
      .map((game) => ({
        gameNumber: game.gameNumber,
        status: game.status,
        results: [...game.results].sort((a, b) => a.placement - b.placement),
      }));
  };

  const totalPlayers = stage
    ? stage.groups.reduce((sum, g) => sum + g.players.length, 0)
    : 0;

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
            Kết quả chi tiết
          </h1>
          <p className="text-gray-400 text-sm">{tournament.name} — Mùa {tournament.season}</p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 mb-4 overflow-x-auto pb-1">
        {tournament.stages.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStageId(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStageId === s.id
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {/* Info bar */}
      {stage && (
        <div className="flex items-center gap-4 mb-6 text-sm text-gray-400">
          <span>{totalPlayers} người</span>
          <span>{stage.groups.length} bảng</span>
        </div>
      )}

      {stage && stage.groups.length > 0 ? (
        <div className="space-y-8">
          {[...stage.groups]
            .sort((a, b) => a.groupOrder - b.groupOrder)
            .map((group, idx) => {
              const lobbyDraw = buildLobbyDraw(group);
              const gameSummary = getGameSummary(group);
              const hasResults = gameSummary.some((g) => g.results.length > 0);

              return (
                <div key={group.id} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
                  {/* Group header */}
                  <div className="flex items-center justify-between px-5 py-3 bg-zinc-800/80 border-b border-zinc-700">
                    <h3 className="font-semibold text-white">
                      Bảng {idx + 1} — {group.name}
                    </h3>
                    <span className="text-xs text-gray-400">{group.players.length} người</span>
                  </div>

                  <div className="p-4 grid grid-cols-1 lg:grid-cols-2 gap-6">
                    {/* Left: Lobby Draw (điểm LP tích lũy) */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                        Điểm tích lũy
                      </p>
                      <div className="space-y-1">
                        {lobbyDraw.map((gp, i) => (
                          <div
                            key={gp.id}
                            className={`flex items-center justify-between px-3 py-2 rounded text-sm ${
                              i === 0 ? "bg-red-600/15 border border-red-600/30" : "bg-zinc-800/60"
                            }`}
                          >
                            <div className="flex items-center gap-3">
                              <span className="text-gray-500 w-5 text-xs">{i + 1}</span>
                              <span className={i === 0 ? "text-white font-semibold" : "text-gray-300"}>
                                {gp.player.ign}
                              </span>
                            </div>
                            <span
                              className={`font-bold ${
                                i === 0 ? "text-red-400" : "text-gray-300"
                              }`}
                            >
                              {gp.totalPoints}
                            </span>
                          </div>
                        ))}
                        {lobbyDraw.length === 0 && (
                          <p className="text-gray-600 text-sm text-center py-4">Chưa phân bổ</p>
                        )}
                      </div>
                    </div>

                    {/* Right: Per-game results */}
                    <div>
                      <p className="text-xs text-gray-500 uppercase tracking-wide mb-3">
                        Kết quả từng game
                      </p>
                      {hasResults ? (
                        <div className="space-y-4">
                          {gameSummary.map((game) => (
                            <div key={game.gameNumber}>
                              <div className="flex items-center gap-2 mb-2">
                                <span className="text-xs font-semibold text-gray-400 uppercase">
                                  Game {game.gameNumber}
                                </span>
                                <span
                                  className={`text-xs px-2 py-0.5 rounded-full ${
                                    game.status === "COMPLETED"
                                      ? "bg-green-500/20 text-green-400"
                                      : "bg-zinc-700 text-gray-500"
                                  }`}
                                >
                                  {game.status === "COMPLETED" ? "Xong" : "Chờ"}
                                </span>
                              </div>
                              {game.results.length > 0 ? (
                                <div className="grid grid-cols-2 gap-1">
                                  {game.results.map((r) => (
                                    <div
                                      key={r.id}
                                      className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${
                                        r.placement <= 4
                                          ? "bg-zinc-800 border border-zinc-700"
                                          : "bg-zinc-800/40"
                                      }`}
                                    >
                                      <div className="flex items-center gap-1.5">
                                        <span
                                          className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${
                                            r.placement === 1
                                              ? "bg-red-600 text-white"
                                              : r.placement <= 4
                                              ? "bg-zinc-600 text-white"
                                              : "bg-zinc-700 text-gray-400"
                                          }`}
                                        >
                                          {r.placement}
                                        </span>
                                        <span className="text-gray-300 truncate max-w-[80px]">
                                          {r.player.ign}
                                        </span>
                                      </div>
                                      <span
                                        className={`font-semibold ${
                                          r.points >= 7
                                            ? "text-red-400"
                                            : r.points >= 5
                                            ? "text-white"
                                            : "text-gray-400"
                                        }`}
                                      >
                                        {r.points}đ
                                      </span>
                                    </div>
                                  ))}
                                </div>
                              ) : (
                                <p className="text-gray-600 text-xs">Chưa có kết quả</p>
                              )}
                            </div>
                          ))}
                        </div>
                      ) : (
                        <p className="text-gray-600 text-sm text-center py-8">
                          Chưa có kết quả
                        </p>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
        </div>
      ) : (
        <div className="text-center py-20 text-gray-500">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có kết quả cho vòng này</p>
        </div>
      )}
    </div>
  );
}
