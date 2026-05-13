"use client";

import { useState, useEffect, useMemo } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface GameResult { id: string; placement: number; points: number; playerId: string; player: { id: string; ign: string } }
interface Game { id: string; gameNumber: number; status: string; results: GameResult[] }
interface GroupPlayer { id: string; totalPoints: number; player: { id: string; ign: string } }
interface Group { id: string; name: string; groupOrder: number; players: GroupPlayer[]; games: Game[] }
interface Stage { id: string; name: string; stageOrder: number; totalGames: number; groups: Group[] }
interface Tournament { id: string; name: string; season: number; stages: Stage[] }

export default function ResultsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);

  useEffect(() => {
    const controller = new AbortController();
    fetch(`/api/tournaments/${params.id}`, { signal: controller.signal })
      .then((r) => { if (!r.ok) throw new Error("Không thể tải giải đấu"); return r.json(); })
      .then((data) => { setTournament(data); if (data.stages?.length > 0) setSelectedStageId(data.stages[0].id); })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("Failed to fetch tournament results:", e);
        setError(e instanceof Error ? e.message : "Đã xảy ra lỗi");
      })
      .finally(() => setLoading(false));
    return () => controller.abort();
  }, [params.id]);

  const stage = tournament?.stages.find((s) => s.id === selectedStageId);
  const totalPlayers = useMemo(() => stage ? stage.groups.reduce((sum, g) => sum + g.players.length, 0) : 0, [stage]);

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;
  if (error) return <div className="text-center py-20 text-red-400">{error}</div>;
  if (!tournament) return <div className="text-center py-20 text-[#888]">Không tìm thấy giải đấu</div>;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tournaments/${params.id}`} className="text-[#888] hover:text-[#f5f5f5] transition-colors" aria-label="Quay lại">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-[#dc2626]" />
            Kết quả chi tiết
          </h1>
          <p className="text-[#888] text-sm">{tournament.name} — Mùa {tournament.season}</p>
        </div>
      </div>

      {/* Stage tabs */}
      <div className="flex gap-2 mb-6 overflow-x-auto pb-1" role="tablist" aria-label="Chọn vòng đấu">
        {tournament.stages.map((s) => (
          <button
            key={s.id}
            role="tab"
            aria-selected={selectedStageId === s.id}
            onClick={() => setSelectedStageId(s.id)}
            className={`px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-colors ${
              selectedStageId === s.id ? "bg-[#dc2626] text-[#f5f5f5]" : "bg-[#111] text-[#888] hover:text-[#f5f5f5] border border-[#222]"
            }`}
          >
            {s.name}
          </button>
        ))}
      </div>

      {stage && (
        <div className="flex items-center gap-4 mb-6 text-sm text-[#888]">
          <span>{totalPlayers} người</span>
          <span>{stage.groups.length} bảng</span>
        </div>
      )}

      {stage && stage.groups.length > 0 ? (
        <div className="space-y-6">
          {[...stage.groups].sort((a, b) => a.groupOrder - b.groupOrder).map((group, idx) => {
            const lobbyDraw = [...group.players].sort((a, b) => b.totalPoints - a.totalPoints);
            const gameSummary = [...group.games].sort((a, b) => a.gameNumber - b.gameNumber).map((game) => ({
              gameNumber: game.gameNumber, status: game.status,
              results: [...game.results].sort((a, b) => a.placement - b.placement),
            }));
            const hasResults = gameSummary.some((g) => g.results.length > 0);

            return (
              <Card key={group.id} hover={false} className="overflow-hidden">
                <div className="flex items-center justify-between px-5 py-3 bg-[#111] border-b border-[#222]">
                  <h3 className="font-semibold text-[#f5f5f5]">Bảng {idx + 1} — {group.name}</h3>
                  <span className="text-xs text-[#888]">{group.players.length} người</span>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lobby Draw */}
                  <div>
                    <p className="text-xs text-[#888] uppercase tracking-wider mb-3">Điểm tích lũy</p>
                    <div className="space-y-1">
                      {lobbyDraw.map((gp, i) => (
                        <div key={gp.id} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${i === 0 ? "bg-[#dc2626]/10 border border-[#dc2626]/20" : "bg-[#111]/60"}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-[#888] w-5 text-xs">{i + 1}</span>
                            <span className={i === 0 ? "text-[#f5f5f5] font-semibold" : "text-[#888]"}>{gp.player.ign}</span>
                          </div>
                          <span className={`font-bold ${i === 0 ? "text-[#dc2626]" : "text-[#888]"}`}>{gp.totalPoints}</span>
                        </div>
                      ))}
                      {lobbyDraw.length === 0 && <p className="text-[#555] text-sm text-center py-4">Chưa phân bổ</p>}
                    </div>
                  </div>

                  {/* Per-game results */}
                  <div>
                    <p className="text-xs text-[#888] uppercase tracking-wider mb-3">Kết quả từng game</p>
                    {hasResults ? (
                      <div className="space-y-4">
                        {gameSummary.map((game) => (
                          <div key={game.gameNumber}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-[#888] uppercase">Game {game.gameNumber}</span>
                              <Badge variant={game.status === "COMPLETED" ? "green" : "default"}>
                                {game.status === "COMPLETED" ? "Xong" : "Chờ"}
                              </Badge>
                            </div>
                            {game.results.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1">
                                {game.results.map((r) => (
                                  <div key={r.id} className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${r.placement <= 4 ? "bg-[#111] border border-[#222]" : "bg-[#111]/40"}`}>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${r.placement === 1 ? "bg-[#dc2626] text-[#f5f5f5]" : r.placement <= 4 ? "bg-[#222] text-[#f5f5f5]" : "bg-[#222]/50 text-[#888]"}`}>
                                        {r.placement}
                                      </span>
                                      <span className="text-[#888] truncate max-w-[80px]">{r.player.ign}</span>
                                    </div>
                                    <span className={`font-semibold ${r.points >= 7 ? "text-[#dc2626]" : r.points >= 5 ? "text-[#f5f5f5]" : "text-[#888]"}`}>{r.points}đ</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-[#555] text-xs">Chưa có kết quả</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-[#555] text-sm text-center py-8">Chưa có kết quả</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-[#888]">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có kết quả cho vòng này</p>
        </div>
      )}
    </div>
  );
}
