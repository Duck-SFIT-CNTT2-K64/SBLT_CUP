"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { Trophy, ArrowLeft, Users } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface GameResult { id: string; placement: number; points: number; playerId: string; player: { id: string; ign: string } }
interface Game { id: string; gameNumber: number; status: string; results: GameResult[] }
interface GroupPlayer { id: string; totalPoints: number; player: { id: string; ign: string } }
interface Group { id: string; name: string; groupOrder: number; players: GroupPlayer[]; games: Game[] }
interface Stage { id: string; name: string; stageOrder: number; totalGames: number; groups: Group[] }
interface Tournament { id: string; name: string; season: number; stages: Stage[] }

export default function BracketsPage() {
  const params = useParams();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedStageId, setSelectedStageId] = useState<string | null>(null);
  const [selectedGameNumber, setSelectedGameNumber] = useState<number>(1);

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
  const maxGames = stage ? Math.max(...stage.groups.map((g) => g.games.length), 1) : 1;
  const gameNumbers = Array.from({ length: maxGames }, (_, i) => i + 1);

  const getGameResults = (group: Group, gameNumber: number) => {
    const game = group.games.find((g) => g.gameNumber === gameNumber);
    if (!game || game.results.length === 0) return null;
    return [...game.results].sort((a, b) => a.placement - b.placement);
  };

  const getPointColor = (points: number) => {
    if (points >= 7) return "text-sblt-red font-bold";
    if (points >= 5) return "text-white font-semibold";
    if (points >= 3) return "text-sblt-white";
    return "text-sblt-muted";
  };

  const getPlacementBg = (placement: number) => {
    if (placement === 1) return "bg-sblt-red/10 border-l-2 border-sblt-red";
    if (placement <= 4) return "bg-sblt-dark/80";
    return "";
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/tournaments/${params.id}`} className="text-sblt-muted hover:text-white transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Trophy className="h-6 w-6 text-sblt-red" />
            Bảng đấu theo Round
          </h1>
          <p className="text-sblt-muted text-sm">{tournament.name} — Mùa {tournament.season}</p>
        </div>
      </div>

      {/* Stage + Game selector */}
      <Card hover={false} className="p-4 mb-6">
        <div className="flex flex-col sm:flex-row gap-4">
          <div>
            <p className="text-xs text-sblt-muted mb-2 uppercase tracking-wider">Vòng đấu</p>
            <div className="flex gap-2 flex-wrap">
              {tournament.stages.map((s) => (
                <button
                  key={s.id}
                  onClick={() => { setSelectedStageId(s.id); setSelectedGameNumber(1); }}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedStageId === s.id ? "bg-sblt-red text-white" : "bg-sblt-dark text-sblt-muted hover:text-white border border-sblt-border"
                  }`}
                >
                  {s.name}
                </button>
              ))}
            </div>
          </div>
          {stage && maxGames > 0 && (
            <div>
              <p className="text-xs text-sblt-muted mb-2 uppercase tracking-wider">Game</p>
              <div className="flex gap-2">
                {gameNumbers.map((n) => (
                  <button
                    key={n}
                    onClick={() => setSelectedGameNumber(n)}
                    className={`w-10 h-8 rounded-lg text-sm font-bold transition-colors ${
                      selectedGameNumber === n ? "bg-white text-black" : "bg-sblt-dark text-sblt-muted hover:text-white border border-sblt-border"
                    }`}
                  >
                    R{n}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Stage info */}
      {stage && (
        <div className="flex items-center gap-4 mb-4 text-sm text-sblt-muted">
          <span className="flex items-center gap-1"><Users className="h-4 w-4" />{stage.groups.reduce((sum, g) => sum + g.players.length, 0)} người</span>
          <span>{stage.groups.length} bảng</span>
          <span className="ml-auto text-sblt-red font-medium">Round {selectedGameNumber} / {maxGames}</span>
        </div>
      )}

      {/* Lobbies grid */}
      {stage && stage.groups.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[...stage.groups].sort((a, b) => a.groupOrder - b.groupOrder).map((group, idx) => {
            const results = getGameResults(group, selectedGameNumber);
            const sortedPlayers = [...group.players].sort((a, b) => b.totalPoints - a.totalPoints);

            return (
              <Card key={group.id} hover={false} className="overflow-hidden">
                <div className="flex items-center justify-between px-4 py-2.5 bg-sblt-dark border-b border-sblt-border">
                  <span className="text-sm font-semibold text-white">Bảng {idx + 1}</span>
                  <span className="text-xs text-sblt-muted">{group.name}</span>
                </div>
                <div className="p-2 space-y-0.5">
                  {results ? results.map((r) => (
                    <div key={r.id} className={`flex items-center justify-between px-3 py-1.5 rounded text-sm ${getPlacementBg(r.placement)}`}>
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sblt-muted w-4 text-xs shrink-0">{r.placement}</span>
                        <span className="text-white truncate">{r.player.ign}</span>
                      </div>
                      <span className={`shrink-0 ml-2 ${getPointColor(r.points)}`}>{r.points}pts</span>
                    </div>
                  )) : sortedPlayers.length > 0 ? sortedPlayers.map((gp, i) => (
                    <div key={gp.id} className="flex items-center justify-between px-3 py-1.5 rounded text-sm">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-sblt-border w-4 text-xs shrink-0">{i + 1}</span>
                        <span className="text-sblt-muted truncate">{gp.player.ign}</span>
                      </div>
                      <span className="text-sblt-border shrink-0 ml-2 text-xs">{gp.totalPoints > 0 ? `${gp.totalPoints}pts` : "—"}</span>
                    </div>
                  )) : (
                    <div className="text-center py-4 text-sblt-border text-xs">Chưa phân bổ</div>
                  )}
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20 text-sblt-muted">
          <Trophy className="h-12 w-12 mx-auto mb-4 opacity-30" />
          <p>Chưa có bảng đấu cho vòng này</p>
        </div>
      )}
    </div>
  );
}
