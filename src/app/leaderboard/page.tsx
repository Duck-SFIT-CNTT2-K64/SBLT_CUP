"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Target, BarChart3 } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

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

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  const getRankBadge = (idx: number) => {
    if (idx === 0) return "bg-yellow-500/15 text-yellow-400 border border-yellow-500/25";
    if (idx === 1) return "bg-gray-400/15 text-gray-300 border border-gray-400/25";
    if (idx === 2) return "bg-orange-500/15 text-orange-400 border border-orange-500/25";
    return "bg-[#222] text-[#888]";
  };

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <RevealOnScroll>
        <SectionHeading title="Bảng xếp hạng" subtitle="Tổng hợp thành tích tất cả các giải đấu" />
      </RevealOnScroll>

      <RevealOnScroll>
        <div className="mb-6">
          <Link
            href="/predictions/leaderboard"
            className="inline-flex items-center gap-2 px-4 py-2 text-sm bg-[#dc2626]/10 text-[#dc2626] border border-[#dc2626]/25 rounded hover:bg-[#dc2626]/20 transition-colors duration-300"
          >
            <Target className="h-4 w-4" />
            Xem bảng xếp hạng Dự đoán
          </Link>
        </div>
      </RevealOnScroll>

      {players.length === 0 ? (
        <div className="text-center py-20 text-[#888]">Chưa có dữ liệu</div>
      ) : (
        <RevealOnScroll>
          <Card hover={false} className="overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-[#0e0e0e] border-b-2 border-[#dc2626]">
                    <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider w-12">#</th>
                    <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Tên ingame</th>
                    <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider">Giải đấu</th>
                    <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider">Trận</th>
                    <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider">Top1</th>
                    <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider">Top4%</th>
                    <th className="text-center py-3 px-3 text-[#888] font-semibold text-xs uppercase tracking-wider">TB hạng</th>
                    <th className="text-right py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {players.map((p, idx) => (
                    <tr key={p.id} className={`border-b border-[#222] transition-colors ${idx === 0 ? "bg-[#dc2626]/[0.04]" : "hover:bg-[#0d0d0d]"}`}>
                      <td className="py-3 px-4">
                        <span className={`inline-flex items-center justify-center w-7 h-7 rounded text-xs font-bold ${getRankBadge(idx)}`}>
                          {idx + 1}
                        </span>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Link
                            href={`/analytics/players/${p.id}`}
                            className="font-semibold text-[#f5f5f5] hover:text-[#dc2626] transition-colors"
                          >
                            {p.ign}
                          </Link>
                          <Link
                            href={`/analytics/players/${p.id}`}
                            className="text-[#555] hover:text-[#dc2626] transition-colors"
                            title="Xem thống kê chi tiết"
                          >
                            <BarChart3 className="h-3.5 w-3.5" />
                          </Link>
                        </div>
                        {p.rank && <div className="text-xs text-[#888]">{p.rank}</div>}
                      </td>
                      <td className="py-3 px-3 text-center text-[#f5f5f5]">{p.tournamentsPlayed}</td>
                      <td className="py-3 px-3 text-center text-[#f5f5f5]">{p.totalGames}</td>
                      <td className="py-3 px-3 text-center font-semibold text-[#dc2626]">{p.top1Count}</td>
                      <td className="py-3 px-3 text-center">
                        <span className={`text-xs font-medium ${p.top4Rate >= 50 ? "text-emerald-400" : "text-[#888]"}`}>
                          {p.top4Rate}%
                        </span>
                      </td>
                      <td className="py-3 px-3 text-center text-[#f5f5f5]">{p.avgPlacement}</td>
                      <td className="py-3 px-4 text-right">
                        <span className="text-[#dc2626] font-bold text-base">{p.totalPoints}</span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </RevealOnScroll>
      )}
    </div>
  );
}
