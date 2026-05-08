"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Trophy,
  ArrowLeft,
  Users,
  Target,
  BarChart3,
  TrendingUp,
  Award,
} from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface PlayerStat {
  playerId: string;
  ign: string;
  isGuest: boolean;
  totalGames: number;
  totalPoints: number;
  avgPoints: number;
  top1Count: number;
  top4Count: number;
  top1Rate: number;
  top4Rate: number;
  bestPlacement: number;
  stages: string[];
}

interface StageStat {
  stageId: string;
  stageName: string;
  stageType: string;
  status: string;
  totalGames: number;
  completedGames: number;
  totalPlayers: number;
  completionRate: number;
}

interface TournamentData {
  tournament: {
    id: string;
    name: string;
    season: number;
    status: string;
  };
  overview: {
    totalPlayers: number;
    guestPlayers: number;
    regularPlayers: number;
    totalStages: number;
    totalGames: number;
    completedGames: number;
    avgPointsPerGame: number;
  };
  playerStats: PlayerStat[];
  stageStats: StageStat[];
}

export default function TournamentAnalyticsPage() {
  const params = useParams();
  const [data, setData] = useState<TournamentData | null>(null);
  const [loading, setLoading] = useState(true);
  const [sortBy, setSortBy] = useState<"totalPoints" | "avgPoints" | "top4Rate">("totalPoints");

  useEffect(() => {
    fetch(`/api/analytics/tournaments/${params.id}`)
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
        Không tìm thấy giải đấu
      </div>
    );
  }

  const { tournament, overview, playerStats, stageStats } = data;

  const sortedPlayers = [...playerStats].sort((a, b) => {
    if (sortBy === "totalPoints") return b.totalPoints - a.totalPoints;
    if (sortBy === "avgPoints") return b.avgPoints - a.avgPoints;
    return b.top4Rate - a.top4Rate;
  });

  const topPerformers = sortedPlayers.slice(0, 5);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {/* Header */}
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/tournaments/${params.id}`} className="text-[#888] hover:text-[#f5f5f5] transition-colors">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold flex items-center gap-3">
            <BarChart3 className="h-8 w-8 text-[#dc2626]" />
            Thống kê giải đấu
          </h1>
          <p className="text-[#888] mt-1">
            {tournament.name} — Mùa {tournament.season}
          </p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        {[
          { label: "Tuyển thủ", value: overview.totalPlayers, icon: Users, color: "text-blue-400" },
          { label: "Trận đấu", value: `${overview.completedGames}/${overview.totalGames}`, icon: Target, color: "text-green-400" },
          { label: "Vòng đấu", value: overview.totalStages, icon: Trophy, color: "text-yellow-400" },
          { label: "TB điểm/trận", value: overview.avgPointsPerGame, icon: TrendingUp, color: "text-[#dc2626]" },
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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Top Performers */}
        <Card hover={false} className="p-6">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Award className="h-5 w-5 text-yellow-400" />
            Top 5 tuyển thủ
          </h2>
          <div className="space-y-3">
            {topPerformers.map((player, index) => (
              <Link
                key={player.playerId}
                href={`/analytics/players/${player.playerId}`}
                className="flex items-center gap-3 p-3 rounded-lg bg-[#111] hover:bg-[#1a1a1a] transition-colors"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${
                    index === 0
                      ? "bg-yellow-500/20 text-yellow-400"
                      : index === 1
                      ? "bg-gray-400/20 text-gray-300"
                      : index === 2
                      ? "bg-orange-500/20 text-orange-400"
                      : "bg-[#222] text-[#888]"
                  }`}
                >
                  {index + 1}
                </span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-[#f5f5f5] truncate">
                    {player.ign}
                    {player.isGuest && (
                      <Badge variant="default" className="ml-2 text-[10px]">
                        Khách mời
                      </Badge>
                    )}
                  </p>
                  <p className="text-xs text-[#888]">{player.totalGames} trận</p>
                </div>
                <div className="text-right">
                  <p className="text-sm font-bold text-[#dc2626]">{player.totalPoints}</p>
                  <p className="text-xs text-[#555]">điểm</p>
                </div>
              </Link>
            ))}
          </div>
        </Card>

        {/* Stage Progress */}
        <Card hover={false} className="p-6 lg:col-span-2">
          <h2 className="text-lg font-bold mb-4 flex items-center gap-2">
            <Trophy className="h-5 w-5 text-[#dc2626]" />
            Tiến độ vòng đấu
          </h2>
          <div className="space-y-4">
            {stageStats.map((stage) => (
              <div key={stage.stageId} className="p-4 bg-[#111] rounded-lg">
                <div className="flex items-center justify-between mb-2">
                  <div>
                    <h3 className="font-medium text-[#f5f5f5]">{stage.stageName}</h3>
                    <p className="text-xs text-[#888]">{stage.totalPlayers} tuyển thủ</p>
                  </div>
                  <Badge
                    variant={
                      stage.status === "COMPLETED"
                        ? "green"
                        : stage.status === "IN_PROGRESS"
                        ? "live"
                        : "default"
                    }
                  >
                    {stage.status === "COMPLETED"
                      ? "Đã xong"
                      : stage.status === "IN_PROGRESS"
                      ? "Đang diễn ra"
                      : "Sắp diễn ra"}
                  </Badge>
                </div>
                <div className="flex items-center gap-3">
                  <div className="flex-1 h-2 bg-[#222] rounded-full overflow-hidden">
                    <div
                      className="h-full bg-[#dc2626] rounded-full transition-all duration-500"
                      style={{ width: `${stage.completionRate}%` }}
                    />
                  </div>
                  <span className="text-xs text-[#888] w-16 text-right">
                    {stage.completedGames}/{stage.totalGames} trận
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      </div>

      {/* Full Player Rankings */}
      <Card hover={false} className="p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-bold flex items-center gap-2">
            <Users className="h-5 w-5 text-[#dc2626]" />
            Bảng xếp hạng chi tiết
          </h2>
          <div className="flex gap-2">
            {[
              { key: "totalPoints", label: "Tổng điểm" },
              { key: "avgPoints", label: "TB/trận" },
              { key: "top4Rate", label: "Top 4 %" },
            ].map((option) => (
              <button
                key={option.key}
                onClick={() => setSortBy(option.key as typeof sortBy)}
                className={`px-3 py-1.5 text-xs rounded-lg transition-colors ${
                  sortBy === option.key
                    ? "bg-[#dc2626] text-white"
                    : "bg-[#111] text-[#888] hover:text-[#f5f5f5] border border-[#222]"
                }`}
              >
                {option.label}
              </button>
            ))}
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-[#222]">
                <th className="text-left py-3 px-4 text-xs text-[#888] uppercase">#</th>
                <th className="text-left py-3 px-4 text-xs text-[#888] uppercase">Tuyển thủ</th>
                <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Trận</th>
                <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Tổng điểm</th>
                <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">TB/trận</th>
                <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Top 1</th>
                <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Top 4</th>
                <th className="text-center py-3 px-4 text-xs text-[#888] uppercase">Tỷ lệ Top 4</th>
              </tr>
            </thead>
            <tbody>
              {sortedPlayers.map((player, index) => (
                <tr
                  key={player.playerId}
                  className="border-b border-[#111] hover:bg-[#111] transition-colors"
                >
                  <td className="py-3 px-4">
                    <span
                      className={`w-6 h-6 rounded-full inline-flex items-center justify-center text-xs font-bold ${
                        index === 0
                          ? "bg-yellow-500/20 text-yellow-400"
                          : index === 1
                          ? "bg-gray-400/20 text-gray-300"
                          : index === 2
                          ? "bg-orange-500/20 text-orange-400"
                          : "bg-[#222] text-[#888]"
                      }`}
                    >
                      {index + 1}
                    </span>
                  </td>
                  <td className="py-3 px-4">
                    <Link
                      href={`/analytics/players/${player.playerId}`}
                      className="text-[#f5f5f5] hover:text-[#dc2626] transition-colors font-medium"
                    >
                      {player.ign}
                    </Link>
                    {player.isGuest && (
                      <Badge variant="default" className="ml-2 text-[10px]">
                        Khách mời
                      </Badge>
                    )}
                  </td>
                  <td className="text-center py-3 px-4 text-sm">{player.totalGames}</td>
                  <td className="text-center py-3 px-4 text-sm font-bold text-[#dc2626]">
                    {player.totalPoints}
                  </td>
                  <td className="text-center py-3 px-4 text-sm">{player.avgPoints}</td>
                  <td className="text-center py-3 px-4 text-sm text-yellow-400">
                    {player.top1Count}
                  </td>
                  <td className="text-center py-3 px-4 text-sm">{player.top4Count}</td>
                  <td className="text-center py-3 px-4 text-sm">
                    <span
                      className={`px-2 py-1 rounded text-xs font-medium ${
                        player.top4Rate >= 70
                          ? "bg-green-500/20 text-green-400"
                          : player.top4Rate >= 50
                          ? "bg-yellow-500/20 text-yellow-400"
                          : "bg-[#222] text-[#888]"
                      }`}
                    >
                      {player.top4Rate}%
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Card>
    </div>
  );
}
