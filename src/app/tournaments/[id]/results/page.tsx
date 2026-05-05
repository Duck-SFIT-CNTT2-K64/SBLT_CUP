"use client";

import { useState, useEffect } from "react";
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
  const totalPlayers = stage ? stage.groups.reduce((sum, g) => sum + g.players.length, 0) : 0;

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tournaments/${params.id}`} className="text-sblt-muted hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-sblt-red" />
            Kết quả chi tiết
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

      {stage && (
        <div className="flex items-center gap-4 mb-6 text-sm text-sblt-muted">
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
                <div className="flex items-center justify-between px-5 py-3 bg-sblt-dark border-b border-sblt-border">
                  <h3 className="font-semibold text-white">Bảng {idx + 1} — {group.name}</h3>
                  <span className="text-xs text-sblt-muted">{group.players.length} người</span>
                </div>

                <div className="p-5 grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {/* Lobby Draw */}
                  <div>
                    <p className="text-xs text-sblt-muted uppercase tracking-wider mb-3">Điểm tích lũy</p>
                    <div className="space-y-1">
                      {lobbyDraw.map((gp, i) => (
                        <div key={gp.id} className={`flex items-center justify-between px-3 py-2 rounded text-sm ${i === 0 ? "bg-sblt-red/10 border border-sblt-red/20" : "bg-sblt-dark/60"}`}>
                          <div className="flex items-center gap-3">
                            <span className="text-sblt-muted w-5 text-xs">{i + 1}</span>
                            <span className={i === 0 ? "text-white font-semibold" : "text-sblt-muted"}>{gp.player.ign}</span>
                          </div>
                          <span className={`font-bold ${i === 0 ? "text-sblt-red" : "text-sblt-muted"}`}>{gp.totalPoints}</span>
                        </div>
                      ))}
                      {lobbyDraw.length === 0 && <p className="text-sblt-border text-sm text-center py-4">Chưa phân bổ</p>}
                    </div>
                  </div>

                  {/* Per-game results */}
                  <div>
                    <p className="text-xs text-sblt-muted uppercase tracking-wider mb-3">Kết quả từng game</p>
                    {hasResults ? (
                      <div className="space-y-4">
                        {gameSummary.map((game) => (
                          <div key={game.gameNumber}>
                            <div className="flex items-center gap-2 mb-2">
                              <span className="text-xs font-semibold text-sblt-muted uppercase">Game {game.gameNumber}</span>
                              <Badge variant={game.status === "COMPLETED" ? "green" : "default"}>
                                {game.status === "COMPLETED" ? "Xong" : "Chờ"}
                              </Badge>
                            </div>
                            {game.results.length > 0 ? (
                              <div className="grid grid-cols-2 gap-1">
                                {game.results.map((r) => (
                                  <div key={r.id} className={`flex items-center justify-between px-2 py-1.5 rounded text-xs ${r.placement <= 4 ? "bg-sblt-dark border border-sblt-border" : "bg-sblt-dark/40"}`}>
                                    <div className="flex items-center gap-1.5">
                                      <span className={`w-5 h-5 rounded-full flex items-center justify-center text-xs font-bold ${r.placement === 1 ? "bg-sblt-red text-white" : r.placement <= 4 ? "bg-sblt-border text-white" : "bg-sblt-border/50 text-sblt-muted"}`}>
                                        {r.placement}
                                      </span>
                                      <span className="text-sblt-muted truncate max-w-[80px]">{r.player.ign}</span>
                                    </div>
                                    <span className={`font-semibold ${r.points >= 7 ? "text-sblt-red" : r.points >= 5 ? "text-white" : "text-sblt-muted"}`}>{r.points}đ</span>
                                  </div>
                                ))}
                              </div>
                            ) : <p className="text-sblt-border text-xs">Chưa có kết quả</p>}
                          </div>
                        ))}
                      </div>
                    ) : <p className="text-sblt-border text-sm text-center py-8">Chưa có kết quả</p>}
                  </div>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-sblt-muted">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có kết quả cho vòng này</p>
        </div>
      )}
    </div>
  );
}
