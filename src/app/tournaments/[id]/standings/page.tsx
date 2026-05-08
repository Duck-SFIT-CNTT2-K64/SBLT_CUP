"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft, Wifi, WifiOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { useSSE } from "@/lib/hooks/useSSE";

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
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
        if (!selectedStageId && data.stages?.length > 0) {
          setSelectedStageId(data.stages[0].id);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tournament:", error);
    } finally {
      setLoading(false);
    }
  }, [params.id, selectedStageId]);

  // SSE for real-time updates
  const { isConnected } = useSSE({
    tournamentId: params.id as string,
    onEvent: useCallback((event: string, data: unknown) => {
      fetchTournament();
      setLastUpdate(new Date());
    }, [fetchTournament]),
  });

  useEffect(() => {
    fetchTournament();
  }, [fetchTournament]);

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;
  if (!tournament) return <div className="text-center py-20 text-[#888]">Không tìm thấy giải đấu</div>;

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
    if (points >= 7) return "text-[#dc2626] font-bold";
    if (points >= 5) return "text-[#f5f5f5] font-semibold";
    if (points >= 3) return "text-[#f5f5f5]";
    return "text-[#888]";
  };

  const getRankBadge = (idx: number) => {
    if (idx === 0) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    if (idx === 1) return "bg-gray-400/20 text-gray-300 border border-gray-400/30";
    if (idx === 2) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    return "bg-[#222]/50 text-[#888]";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <Link href={`/tournaments/${params.id}`} className="text-[#888] hover:text-[#f5f5f5] transition-colors">
            <ArrowLeft className="h-5 w-5" />
          </Link>
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Trophy className="h-6 w-6 text-[#dc2626]" />
              Bảng xếp hạng
            </h1>
            <p className="text-[#888] text-sm">{tournament.name} — Mùa {tournament.season}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <div className={`flex items-center gap-1.5 text-xs ${isConnected ? "text-green-400" : "text-[#555]"}`}>
            {isConnected ? (
              <>
                <Wifi className="h-3 w-3" />
                <span>实时</span>
              </>
            ) : (
              <>
                <WifiOff className="h-3 w-3" />
                <span>Đang kết nối...</span>
              </>
            )}
          </div>
          {lastUpdate && (
            <span className="text-xs text-[#555]">
              {lastUpdate.toLocaleTimeString("vi-VN")}
            </span>
          )}
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1">
        {tournament.stages.map((s) => (
          <button
            key={s.id}
            onClick={() => setSelectedStageId(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStageId === s.id ? "bg-[#dc2626] text-[#f5f5f5]" : "bg-[#111] text-[#888] hover:text-[#f5f5f5] border border-[#222]"
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
                <tr className="bg-[#111] border-b-2 border-[#dc2626]">
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider w-12">#</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider min-w-[140px]">Tên</th>
                  {gameNumbers.map((n) => (
                    <th key={n} className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider w-14">M{n}</th>
                  ))}
                  <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider w-16">Tổng</th>
                  <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider w-14">Top1</th>
                  <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider w-14">Top4</th>
                </tr>
              </thead>
              <tbody>
                {standings.map((player, idx) => (
                  <tr key={player.id} className={`border-b border-[#222] transition-colors ${idx === 0 ? "bg-[#dc2626]/[0.04]" : idx < 4 ? "hover:bg-[#dc2626]/3" : "hover:bg-[#111]/30"}`}>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(idx)}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4 font-medium text-[#f5f5f5]">{player.ign}</td>
                    {gameNumbers.map((n) => {
                      const gr = player.gameResults.find((r) => r.gameNumber === n);
                      return (
                        <td key={n} className="py-3 px-3 text-center">
                          {gr ? <span className={getPointColor(gr.points)}>{gr.points}</span> : <span className="text-[#555]">—</span>}
                        </td>
                      );
                    })}
                    <td className="py-3 px-3 text-center"><span className="text-[#dc2626] font-bold text-base">{player.totalPoints}</span></td>
                    <td className="py-3 px-3 text-center text-[#f5f5f5]">{player.top1Count}</td>
                    <td className="py-3 px-3 text-center text-[#f5f5f5]">{player.top4Count}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      ) : (
        <div className="text-center py-20 text-[#888]">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có kết quả cho vòng này</p>
        </div>
      )}
    </div>
  );
}
