"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";

interface GameResult { gameNumber: number; placement: number; points: number }
interface PlayerRow { id: string; ign: string; totalPoints: number; gameResults: GameResult[]; top4Count: number; top1Count: number }
interface GroupPlayer { id: string; totalPoints: number; player: { id: string; ign: string } }
interface Group { id: string; name: string; players: GroupPlayer[]; games: { id: string; gameNumber: number; status: string; results: { id: string; placement: number; points: number; playerId: string; player: { id: string; ign: string } }[] }[] }
interface Stage { id: string; name: string; stageOrder: number; totalGames: number; groups: Group[] }
interface Tournament { id: string; name: string; season: number; stages: Stage[] }

export default function StandingsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  useEffect(() => {
    fetch(`/api/tournaments/${params.id}`)
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => { setTournament(data); if (data.stages?.length > 0) setSelectedStageId(data.stages[0].id); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="text-center py-20 text-sblt-muted">Không tìm thấy giải đấu</div>;

  const stage = tournament.stages.find((s) => s.id === selectedStageId);

  const buildStandings = (stage: Stage): PlayerRow[] => {
    const playerMap = new Map<string, PlayerRow>();
    for (const group of stage.groups) {
      for (const gp of group.players) {
        if (!playerMap.has(gp.player.id)) {
          playerMap.set(gp.player.id, { id: gp.player.id, ign: gp.player.ign, totalPoints: 0, gameResults: [], top4Count: 0, top1Count: 0 });
        }
      }
      for (const game of group.games) {
        for (const result of game.results) {
          const row = playerMap.get(result.player.id);
          if (!row) continue;
          row.gameResults.push({ gameNumber: game.gameNumber, placement: result.placement, points: result.points });
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
    if (points >= 7) return "text-sblt-red font-bold";
    if (points >= 5) return "text-white font-semibold";
    if (points >= 3) return "text-sblt-white";
    return "text-sblt-muted";
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    if (idx === 1) return "bg-gray-400/20 text-gray-300 border border-gray-400/30";
    if (idx === 2) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    return "bg-sblt-border/50 text-sblt-muted";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tournaments/${params.id}`} className="text-sblt-muted hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-sblt-red" />
            Bảng xếp hạng
          </h1>
          <p className="text-sblt-muted text-sm">{tournament.name} — Mùa {tournament.season}</p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tournament.stages.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStageId(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStageId === s.id ? "bg-sblt-red text-white" : "bg-sblt-dark text-sblt-muted hover:text-white border border-sblt-border"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {stage && standings.length > 0 ? (
        <Card hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sblt-dark border-b-2 border-sblt-red">
                  <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-12">#</th>
                  <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider min-w-[140px]">Tên</th>
                  {gameNumbers.map((n) => (
                    <th key={n} className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-14">M{n}</th>
                  ))}
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-16">Tổng</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-14">Top1</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-14">Top4</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, idx) => (
                  <tr key={player.id} className={`border-b border-sblt-border transition-colors ${idx === 0 ? "bg-sblt-red/5" : idx < 4 ? "hover:bg-sblt-red/3" : "hover:bg-sblt-dark/30"}`}>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(idx)}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-white">{player.ign}</td>
                    {gameNumbers.map((n) => {
                      const gr = player.gameResults.find((r) => r.gameNumber === n);
                      return (
                        <td key={n} className="py-3 px-3 text-center">
                          {gr ? <span className={getPointColor(gr.points)}>{gr.points}</span> : <span className="text-sblt-border">—</span>}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center"><span className="text-sblt-red font-bold text-base">{player.totalPoints}</span></td>
                    <td className="py-3 px-3 text-center text-sblt-white">{player.top1Count}</td>
                    <td className="py-3 px-3 text-center text-sblt-white">{player.top4Count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-20 text-sblt-muted">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có kết quả cho vòng này</p>
        </div>
      )}
    </div>
  );
}
