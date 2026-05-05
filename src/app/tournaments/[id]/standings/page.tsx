"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";

interface GameResult {
  gameNumber: number;
  placement: number;
  points: number;
}

interface PlayerRow {
  id: string;
  ign: string;
  totalPoints: number;
  gameResults: GameResult[];
  top4Count: number;
  top1Count: number;
}

interface Group {
  id: string;
  name: string;
  players: {
    id: string;
    totalPoints: number;
    player: { id: string; ign: string };
  }[];
  games: {
    id: string;
    gameNumber: number;
    status: string;
    results: {
      id: string;
      placement: number;
      points: number;
      playerId: string;
      player: { id: string; ign: string };
    }[];
  }[];
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

export default function StandingsPage() {
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

  // Build unified standings across all groups in the stage
  const buildStandings = (stage: Stage): PlayerRow[] => {
    const playerMap = new Map<string, PlayerRow>();

    for (const group of stage.groups) {
      // Init players from groupPlayers
      for (const gp of group.players) {
        if (!playerMap.has(gp.player.id)) {
          playerMap.set(gp.player.id, {
            id: gp.player.id,
            ign: gp.player.ign,
            totalPoints: 0,
            gameResults: [],
            top4Count: 0,
            top1Count: 0,
          });
        }
      }

      // Fill game results
      for (const game of group.games) {
        for (const result of game.results) {
          const row = playerMap.get(result.player.id);
          if (!row) continue;
          row.gameResults.push({
            gameNumber: game.gameNumber,
            placement: result.placement,
            points: result.points,
          });
          row.totalPoints += result.points;
          if (result.placement <= 4) row.top4Count++;
          if (result.placement === 1) row.top1Count++;
        }
      }
    }

    return Array.from(playerMap.values()).sort((a, b) => b.totalPoints - a.totalPoints);
  };

  const standings = stage ? buildStandings(stage) : [];
  const maxGames = stage ? Math.max(...stage.groups.map((g) => g.games.length), 0) : 0;
  const gameNumbers = Array.from({ length: maxGames }, (_, i) => i + 1);

  const getPointColor = (points: number) => {
    if (points >= 7) return "text-red-400 font-bold";
    if (points >= 5) return "text-white font-semibold";
    if (points >= 3) return "text-gray-300";
    return "text-gray-500";
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
            Bảng xếp hạng
          </h1>
          <p className="text-gray-400 text-sm">{tournament.name} — Mùa {tournament.season}</p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
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

      {/* Standings table */}
      {stage && standings.length > 0 ? (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/80">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium w-12">#</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium min-w-[140px]">Tên</th>
                  {gameNumbers.map((n) => (
                    <th key={n} className="text-center py-3 px-3 text-gray-400 font-medium w-14">
                      M{n}
                    </th>
                  ))}
                  <th className="text-center py-3 px-3 text-gray-400 font-medium w-16">Tổng</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium w-14">Top1</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium w-14">Top4</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, idx) => (
                  <tr
                    key={player.id}
                    className={`border-b border-zinc-800 transition-colors ${
                      idx === 0
                        ? "bg-red-600/10"
                        : idx < 4
                        ? "bg-zinc-900/80 hover:bg-zinc-800/50"
                        : "hover:bg-zinc-800/30"
                    }`}
                  >
                    <td className="py-3 px-4">
                      <span
                        className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${
                          idx === 0
                            ? "bg-red-600 text-white"
                            : idx === 1
                            ? "bg-zinc-400 text-black"
                            : idx === 2
                            ? "bg-amber-700 text-white"
                            : "bg-zinc-700 text-gray-300"
                        }`}
                      >
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{player.ign}</td>
                    {gameNumbers.map((n) => {
                      const gr = player.gameResults.find((r) => r.gameNumber === n);
                      return (
                        <td key={n} className="py-3 px-3 text-center">
                          {gr ? (
                            <span className={getPointColor(gr.points)}>{gr.points}</span>
                          ) : (
                            <span className="text-zinc-600">—</span>
                          )}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center">
                      <span className="text-red-400 font-bold text-base">{player.totalPoints}</span>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-300">{player.top1Count}</td>
                    <td className="py-3 px-3 text-center text-gray-300">{player.top4Count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
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
