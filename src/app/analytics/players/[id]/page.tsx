"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  TrendingUp,
  Target,
  Award,
  BarChart3,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PlayerStats {
  totalGames: number;
  totalPoints: number;
  avgPoints: number;
  top1Count: number;
  top4Count: number;
  top1Rate: number;
  top4Rate: number;
}

interface TournamentStat {
  tournamentId: string;
  tournamentName: string;
  season: number;
  games: number;
  points: number;
  top1: number;
  top4: number;
}

interface TrendPoint {
  game: number;
  points: number;
  placement: number;
  cumulativeAvg: number;
}

interface PlacementDist {
  placement: number;
  count: number;
}

interface PlayerData {
  player: {
    id: string;
    ign: string;
    name: string;
    avatar: string | null;
    rank: string | null;
  };
  stats: PlayerStats;
  tournamentStats: TournamentStat[];
  trend: TrendPoint[];
  placementDistribution: PlacementDist[];
}

export default function PlayerAnalyticsPage() {
  const params = useParams();
  const [data, setData] = useState<PlayerData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/analytics/players/${params.id}`)
      .then((r) => r.json())
      .then(setData)
      .catch(console.error)
      .finally(() => setLoading(false));
  }, [params.id]);

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" />
      </div>
    );
  }

  if (!data) {
    return (
      <div className="max-w-7xl mx-auto px-4 py-20 text-center text-[#888]">
        Không tìm thấy tuyển thủ
      </div>
    );
  }

  const { player, stats, tournamentStats, trend, placementDistribution } = data;
  const maxPlacementCount = Math.max(...placementDistribution.map((p) => p.count), 1);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href="/leaderboard" className="text-[#888] hover:text-[#f5f5f5] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#dc2626]" />
            Thống kê chi tiết
          </h1>
          <p className="text-[#888] mt-1">{player.ign}</p>
        </div>
      </div>

      {/* Stats Overview */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tổng điểm", value: stats.totalPoints, icon: Trophy, color: "text-[#dc2626]" },
          { label: "Trận đấu", value: stats.totalGames, icon: Target, color: "text-blue-400" },
          { label: "TB điểm/trận", value: stats.avgPoints, icon: TrendingUp, color: "text-green-400" },
          { label: "Tỷ lệ Top 4", value: `${stats.top4Rate}%`, icon: Award, color: "text-yellow-400" },
        ].map((stat) => (
          <Card key={stat.label} hover={false} className="p-4">
            <div className="flex items-center gap-3">
              <stat.icon className={`h-5 w-5 ${stat.color}`} />
              <div>
                <p className="text-xs text-[#888]">{stat.label}</p>
                <p className="text-xl font-bold text-[#f5f5f5]">{stat.value}</p>
              </div>
            </div>
          </Card>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Placement Distribution */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Target className="h-5 w-5 text-[#dc2626]" />
            Phân bố thứ hạng
          </h2>
          <div className="space-y-3">
            {placementDistribution.map((dist) => (
              <div key={dist.placement} className="flex items-center gap-3">
                <span className="w-12 text-sm text-[#888]">Top {dist.placement}</span>
                <div className="flex-1 h-6 bg-[#111] rounded overflow-hidden">
                  <div
                    className={`h-full rounded transition-all duration-500 ${
                      dist.placement === 1
                        ? "bg-yellow-500"
                        : dist.placement <= 4
                        ? "bg-[#dc2626]"
                        : "bg-[#333]"
                    }`}
                    style={{ width: `${(dist.count / maxPlacementCount) * 100}%` }}
                  />
                </div>
                <span className="w-12 text-right text-sm font-medium text-[#f5f5f5]">
                  {dist.count}
                </span>
              </div>
            ))}
          </div>
          <div className="mt-4 pt-4 border-t border-[#222] grid grid-cols-2 gap-4">
            <div>
              <p className="text-xs text-[#888]">Top 1</p>
              <p className="text-lg font-bold text-yellow-400">{stats.top1Count} ({stats.top1Rate}%)</p>
            </div>
            <div>
              <p className="text-xs text-[#888]">Top 4</p>
              <p className="text-lg font-bold text-[#dc2626]">{stats.top4Count} ({stats.top4Rate}%)</p>
            </div>
          </div>
        </Card>

        {/* Performance Trend */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <TrendingUp className="h-5 w-5 text-green-400" />
            Xu hướng phong độ
          </h2>
          {trend.length > 0 ? (
            <div className="h-48 flex items-end gap-1">
              {trend.map((point, i) => (
                <div key={i} className="flex-1 flex flex-col items-center">
                  <div
                    className={`w-full rounded-t transition-all duration-300 ${
                      point.placement === 1
                        ? "bg-yellow-500"
                        : point.placement <= 4
                        ? "bg-[#dc2626]"
                        : "bg-[#333]"
                    }`}
                    style={{ height: `${(point.points / 8) * 100}%` }}
                  />
                  <span className="text-[10px] text-[#555] mt-1">{point.game}</span>
                </div>
              ))}
            </div>
          ) : (
            <div className="h-48 flex items-center justify-center text-[#555]">
              Chưa có dữ liệu
            </div>
          )}
          <div className="mt-4 pt-4 border-t border-[#222]">
            <p className="text-xs text-[#888]">
              Điểm trung bình tích lũy:{" "}
              <span className="text-[#f5f5f5] font-medium">
                {trend.length > 0 ? trend[trend.length - 1].cumulativeAvg.toFixed(2) : "N/A"}
              </span>
            </p>
          </div>
        </Card>

        {/* Tournament History */}
        <Card hover={false} className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#dc2626]" />
            Lịch sử giải đấu
          </h2>
          {tournamentStats.length > 0 ? (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-[#222]">
                    <th className="text-left py-3 px-4 text-xs text-[#888] uppercase">Giải đấu</th>
                    <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Trận</th>
                    <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Tổng điểm</th>
                    <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">TB/trận</th>
                    <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Top 1</th>
                    <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Top 4</th>
                  </tr>
                </thead>
                <tbody>
                  {tournamentStats.map((ts) => (
                    <tr key={ts.tournamentId} className="border-b border-[#111] hover:bg-[#111]">
                      <td className="py-3 px-4">
                        <Link
                          href={`/tournaments/${ts.tournamentId}`}
                          className="text-[#f5f5f5] hover:text-[#dc2626] transition-colors"
                        >
                          {ts.tournamentName}
                        </Link>
                        <span className="text-xs text-[#555] ml-2">Mùa {ts.season}</span>
                      </td>
                      <td className="text-center py-3 px-4 text-sm">{ts.games}</td>
                      <td className="text-center py-3 px-4 text-sm font-bold text-[#dc2626]">
                        {ts.points}
                      </td>
                      <td className="text-center py-3 px-4 text-sm">
                        {ts.games > 0 ? (ts.points / ts.games).toFixed(2) : "0"}
                      </td>
                      <td className="text-center py-3 px-4 text-sm text-yellow-400">{ts.top1}</td>
                      <td className="text-center py-3 px-4 text-sm">{ts.top4}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          ) : (
            <p className="text-center text-[#555] py-8">Chưa tham gia giải đấu nào</p>
          )}
        </Card>
      </div>
    </div>
  );
}
