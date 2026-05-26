"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { useSSE } from "@/lib/hooks/useSSE";
import { Calendar, Users, Trophy, ArrowLeft, Wifi, WifiOff, Gamepad2 } from "lucide-react";

interface GameResult {
  id: string;
  placement: number;
  points: number;
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
  playerId: string;
  totalPoints: number;
  finalRank: number | null;
  player: { id: string; ign: string; isGuest: boolean; user?: { avatar: string | null } };
}

interface Group {
  id: string;
  name: string;
  players: GroupPlayer[];
  games: Game[];
}

interface Stage {
  id: string;
  name: string;
  stageType: string;
  status: string;
  date: string;
  startTime: string;
  groups: Group[];
}

interface Tournament {
  id: string;
  slug: string;
  name: string;
  description: string | null;
  status: string;
  stages: Stage[];
}

export default function WarmupPage() {
  const params = useParams();
  const tournamentId = params.id as string;
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);

  const fetchTournament = useCallback(async () => {
    try {
      const res = await fetch(`/api/tournaments/${tournamentId}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data);
      }
    } finally {
      setLoading(false);
    }
  }, [tournamentId]);

  useEffect(() => { fetchTournament(); }, [fetchTournament]);

  const handleSSE = useCallback((event: string) => {
    if (["game-result", "stage-update", "standings-update"].includes(event)) {
      fetchTournament();
    }
  }, [fetchTournament]);

  const sse = useSSE({ tournamentId, onEvent: handleSSE });
  const connected = sse.isConnected;

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-amber-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="min-h-screen flex items-center justify-center text-[#888]">
        Không tìm thấy giải giao lưu
      </div>
    );
  }

  const warmupStage = tournament.stages.find((s) => s.stageType === "WARMUP");
  const group = warmupStage?.groups[0];

  // Build standings
  const standings = group
    ? [...group.players].sort((a, b) => b.totalPoints - a.totalPoints).map((p, i) => ({
        ...p,
        rank: i + 1,
      }))
    : [];

  // Build game matrix
  const games = group?.games.sort((a, b) => a.gameNumber - b.gameNumber) || [];
  const gameCount = games.length;

  const getPlayerGamePoints = (playerId: string, gameNumber: number): number | null => {
    const game = games.find((g) => g.gameNumber === gameNumber);
    if (!game) return null;
    const result = game.results.find((r) => r.player.id === playerId);
    return result?.points ?? null;
  };

  const getPlayerGamePlacement = (playerId: string, gameNumber: number): number | null => {
    const game = games.find((g) => g.gameNumber === gameNumber);
    if (!game) return null;
    const result = game.results.find((r) => r.player.id === playerId);
    return result?.placement ?? null;
  };

  return (
    <div className="min-h-screen">
      {/* Warm ambient gradient */}
      <div className="fixed inset-0 bg-gradient-to-b from-amber-950/10 via-transparent to-transparent pointer-events-none" />

      <div className="relative max-w-4xl mx-auto px-4 sm:px-6 py-8">
        {/* Back + SSE */}
        <div className="flex items-center justify-between mb-6">
          <Link href={`/tournaments/${tournamentId}`} className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f5f5f5] transition-colors">
            <ArrowLeft className="h-4 w-4" />
            Quay lại giải đấu
          </Link>
          <div className="flex items-center gap-1.5">
            {connected ? <Wifi className="h-3.5 w-3.5 text-emerald-400" /> : <WifiOff className="h-3.5 w-3.5 text-[#555]" />}
            <span className="text-xs text-[#666]">{connected ? "Live" : "Offline"}</span>
          </div>
        </div>

        {/* Hero */}
        <RevealOnScroll>
          <div className="text-center mb-10">
            <div className="inline-flex items-center gap-2 mb-3">
              <span className="text-3xl">🦆</span>
              <Badge variant="yellow">Giao lưu</Badge>
            </div>
            <h1 className="text-3xl sm:text-4xl font-black text-[#f5f5f5] mb-2" style={{ fontFamily: "var(--font-heading)" }}>
              {tournament.name}
            </h1>
            {tournament.description && (
              <p className="text-[#888] text-sm max-w-md mx-auto">{tournament.description}</p>
            )}
            {warmupStage && (
              <div className="flex items-center justify-center gap-4 mt-4 text-sm text-[#aaa]">
                <span className="flex items-center gap-1.5">
                  <Calendar className="h-4 w-4 text-amber-400" />
                  {new Date(warmupStage.date).toLocaleDateString("vi-VN")}
                </span>
                <span className="flex items-center gap-1.5">
                  <Gamepad2 className="h-4 w-4 text-amber-400" />
                  {warmupStage.startTime || "20:30"} — {gameCount} game
                </span>
                <span className="flex items-center gap-1.5">
                  <Users className="h-4 w-4 text-amber-400" />
                  {standings.length} tuyển thủ
                </span>
              </div>
            )}
          </div>
        </RevealOnScroll>

        {/* Standings Table */}
        {group && (
          <RevealOnScroll>
            <Card hover={false} className="p-0 overflow-hidden mb-8 border-amber-500/10">
              {/* Table header */}
              <div className="px-4 py-3 bg-amber-500/5 border-b border-amber-500/10">
                <h2 className="text-sm font-bold text-amber-400 flex items-center gap-2">
                  <Trophy className="h-4 w-4" />
                  Bảng xếp hạng — {group.name}
                </h2>
              </div>

              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#1a1a1a]">
                      <th className="px-4 py-2.5 text-left text-xs text-[#666] font-medium w-12">#</th>
                      <th className="px-4 py-2.5 text-left text-xs text-[#666] font-medium">Tuyển thủ</th>
                      {Array.from({ length: gameCount }, (_, i) => (
                        <th key={i} className="px-3 py-2.5 text-center text-xs text-[#666] font-medium w-20">
                          G{i + 1}
                        </th>
                      ))}
                      <th className="px-4 py-2.5 text-center text-xs text-[#666] font-medium w-20">Tổng</th>
                    </tr>
                  </thead>
                  <tbody>
                    {standings.map((p) => {
                      const isTop = p.rank <= 3;
                      const rankColors: Record<number, string> = {
                        1: "text-yellow-400",
                        2: "text-gray-300",
                        3: "text-amber-600",
                      };

                      return (
                        <tr
                          key={p.id}
                          className={`border-b border-[#111] hover:bg-amber-500/[0.02] transition-colors ${isTop ? "bg-amber-500/[0.03]" : ""}`}
                        >
                          <td className="px-4 py-3">
                            <span className={`font-black text-base ${rankColors[p.rank] || "text-[#555]"}`}>
                              {p.rank}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <div className="flex items-center gap-2.5">
                              <Avatar
                                name={p.player.ign}
                                src={p.player.user?.avatar ?? undefined}
                                size="sm"
                              />
                              <div>
                                <span className="text-[#f5f5f5] font-medium">{p.player.ign}</span>
                                {p.player.isGuest && (
                                  <span className="ml-1.5 text-[10px] text-amber-400/60">KM</span>
                                )}
                              </div>
                            </div>
                          </td>
                          {Array.from({ length: gameCount }, (_, i) => {
                            const pts = getPlayerGamePoints(p.playerId, i + 1);
                            const placement = getPlayerGamePlacement(p.playerId, i + 1);
                            return (
                              <td key={i} className="px-3 py-3 text-center">
                                {pts !== null ? (
                                  <div>
                                    <span className="text-[#f5f5f5] font-medium">{pts}</span>
                                    {placement !== null && (
                                      <span className="text-[10px] text-[#555] ml-0.5">({placement})</span>
                                    )}
                                  </div>
                                ) : (
                                  <span className="text-[#333]">—</span>
                                )}
                              </td>
                            );
                          })}
                          <td className="px-4 py-3 text-center">
                            <span className={`font-black text-base ${p.rank === 1 ? "text-amber-400" : "text-[#f5f5f5]"}`}>
                              {p.totalPoints}
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </Card>
          </RevealOnScroll>
        )}

        {/* Game Results Cards */}
        {games.length > 0 && (
          <RevealOnScroll>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              {games.map((game) => {
                const sorted = [...game.results].sort((a, b) => a.placement - b.placement);
                return (
                  <Card key={game.id} hover={false} className="p-4 border-amber-500/10">
                    <div className="flex items-center justify-between mb-3">
                      <span className="text-sm font-bold text-amber-400">Game {game.gameNumber}</span>
                      <Badge variant={game.status === "COMPLETED" ? "green" : "default"}>
                        {game.status === "COMPLETED" ? "Xong" : "Chờ"}
                      </Badge>
                    </div>
                    <div className="space-y-1.5">
                      {sorted.map((r) => (
                        <div key={r.id} className="flex items-center justify-between text-xs">
                          <div className="flex items-center gap-2">
                            <span className={`w-5 text-center font-mono font-bold ${r.placement <= 3 ? "text-amber-400" : "text-[#666]"}`}>
                              {r.placement}
                            </span>
                            <span className="text-[#ccc]">{r.player.ign}</span>
                          </div>
                          <span className="text-[#f5f5f5] font-medium">{r.points}đ</span>
                        </div>
                      ))}
                      {sorted.length === 0 && (
                        <p className="text-xs text-[#555] text-center py-2">Chưa có kết quả</p>
                      )}
                    </div>
                  </Card>
                );
              })}
            </div>
          </RevealOnScroll>
        )}

        {/* Prediction link */}
        {warmupStage && warmupStage.status === "SCHEDULED" && (
          <RevealOnScroll>
            <div className="mt-8 text-center">
              <Link
                href={`/tournaments/${tournamentId}/predictions`}
                className="inline-flex items-center gap-2 bg-gradient-to-r from-amber-500/10 to-orange-500/10 hover:from-amber-500/20 hover:to-orange-500/20 border border-amber-500/20 rounded-xl px-6 py-3 text-amber-400 font-medium transition-all"
              >
                🎯 Dự đoán Top 4
              </Link>
            </div>
          </RevealOnScroll>
        )}
      </div>
    </div>
  );
}
