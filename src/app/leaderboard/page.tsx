"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface PlayerRow {
  id: string;
  ign: string;
  rank: string | null;
  totalPoints: number;
  totalGames: number;
  top1Count: number;
  top4Count: number;
  avgPlacement: number;
  tournamentsPlayed: number;
  top4Rate: number;
}

export default function LeaderboardPage() {
  const [players, setPlayers] = useState<PlayerRow[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/leaderboard")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setPlayers(data))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  const getRankBadge = (idx: number) => {
    if (idx === 0) return "bg-yellow-500/20 text-yellow-400 border border-yellow-500/30";
    if (idx === 1) return "bg-gray-400/20 text-gray-300 border border-gray-400/30";
    if (idx === 2) return "bg-orange-500/20 text-orange-400 border border-orange-500/30";
    return "bg-sblt-border/50 text-sblt-muted";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeading title="Bảng xếp hạng" subtitle="Tổng hợp thành tích tất cả các giải đấu" />

      {players.length === 0 ? (
        <div className="text-center py-20 text-sblt-muted">Chưa có dữ liệu</div>
      ) : (
        <Card hover={false} className="overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-sblt-dark border-b-2 border-sblt-red">
                  <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-12">#</th>
                  <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Tên ingame</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Giải đấu</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Trận</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Top1</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Top4%</th>
                  <th className="text-center py-3 px-3 text-sblt-muted font-semibold text-xs uppercase tracking-wider">TB hạng</th>
                  <th className="text-right py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Tổng điểm</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr key={p.id} className={`border-b border-sblt-border transition-colors ${idx === 0 ? "bg-sblt-red/5" : "hover:bg-sblt-dark/30"}`}>
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-7 h-7 rounded-full text-xs font-bold ${getRankBadge(idx)}`}>
                        {idx + 1}
                      </span>
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold text-white">{p.ign}</div>
                      {p.rank && <div className="text-xs text-sblt-muted">{p.rank}</div>}
                    </td>
                    <td className="py-3 px-3 text-center text-sblt-white">{p.tournamentsPlayed}</td>
                    <td className="py-3 px-3 text-center text-sblt-white">{p.totalGames}</td>
                    <td className="py-3 px-3 text-center font-semibold text-sblt-red">{p.top1Count}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-medium ${p.top4Rate >= 50 ? "text-green-400" : "text-sblt-muted"}`}>
                        {p.top4Rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-sblt-white">{p.avgPlacement}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-sblt-red font-bold text-base">{p.totalPoints}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Card>
      )}
    </div>
  );
}
