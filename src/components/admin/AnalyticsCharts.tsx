"use client";

import { useState, useEffect } from "react";
import { ChartCard } from "@/components/admin/charts/ChartCard";
import { RegistrationsChart } from "@/components/admin/charts/RegistrationsChart";
import { MatchDistributionChart } from "@/components/admin/charts/MatchDistributionChart";
import { TournamentStatusChart } from "@/components/admin/charts/TournamentStatusChart";
import { PlayerActivityChart } from "@/components/admin/charts/PlayerActivityChart";

interface OverviewData {
  registrationsByDate: { date: string; count: number }[];
  signupsByDate: { date: string; count: number }[];
  matchDistribution: { placement: number; count: number }[];
  tournamentStatusDistribution: { status: string; count: number }[];
  activePlayerCount: number;
  predictionCount: number;
  gameResultsByDate: { date: string; count: number }[];
}

interface ActivityData {
  dailyActivity: { date: string; count: number }[];
  topPlayers: { userId: string; name: string; activityCount: number }[];
  disputeStats: { total: number; resolved: number; rejected: number; resolutionRate: number };
}

const TIME_RANGES = [
  { label: "7 ngày", value: 7 },
  { label: "30 ngày", value: 30 },
  { label: "90 ngày", value: 90 },
  { label: "Tất cả", value: 365 },
];

export function AnalyticsCharts() {
  const [days, setDays] = useState(30);
  const [overview, setOverview] = useState<OverviewData | null>(null);
  const [activity, setActivity] = useState<ActivityData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, [days]);

  const fetchData = async () => {
    setLoading(true);
    setError(null);
    try {
      const [overviewRes, activityRes] = await Promise.all([
        fetch(`/api/admin/analytics/overview?days=${days}`),
        fetch(`/api/admin/analytics/activity?days=${days}`),
      ]);

      if (overviewRes.ok) setOverview(await overviewRes.json());
      if (activityRes.ok) setActivity(await activityRes.json());

      if (!overviewRes.ok || !activityRes.ok) {
        setError("Không thể tải dữ liệu thống kê");
      }
    } catch {
      setError("Đã xảy ra lỗi khi tải dữ liệu");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-semibold text-[#f5f5f5]">Thống kê</h2>
          <div className="flex gap-2">
            {TIME_RANGES.map((r) => (
              <div key={r.value} className="w-16 h-8 bg-[#111] rounded-lg animate-pulse" />
            ))}
          </div>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="h-80 bg-[#111] rounded-2xl animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8 text-[#888]">
        <p>{error}</p>
        <button onClick={fetchData} className="text-[#dc2626] text-sm mt-2 hover:underline">
          Thử lại
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h2 className="text-lg font-semibold text-[#f5f5f5]">Thống kê</h2>
        <div className="flex gap-2">
          {TIME_RANGES.map((r) => (
            <button
              key={r.value}
              onClick={() => setDays(r.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
                days === r.value
                  ? "bg-[#dc2626] text-white"
                  : "bg-[#111] text-[#888] hover:text-white hover:bg-[#222]"
              }`}
            >
              {r.label}
            </button>
          ))}
        </div>
      </div>

      {/* Quick stats */}
      {overview && (
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
            <div className="text-2xl font-bold text-[#f5f5f5]">{overview.activePlayerCount}</div>
            <div className="text-xs text-[#888]">Tuyển thủ active</div>
          </div>
          <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
            <div className="text-2xl font-bold text-[#f5f5f5]">{overview.predictionCount}</div>
            <div className="text-xs text-[#888]">Lượt dự đoán</div>
          </div>
          {activity?.disputeStats && (
            <>
              <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                <div className="text-2xl font-bold text-[#f5f5f5]">{activity.disputeStats.total}</div>
                <div className="text-xs text-[#888]">Kháng nghị</div>
              </div>
              <div className="bg-[#111] rounded-xl p-4 border border-[#222]">
                <div className="text-2xl font-bold text-[#f5f5f5]">{activity.disputeStats.resolutionRate}%</div>
                <div className="text-xs text-[#888]">Tỷ lệ giải quyết</div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Charts grid */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {overview?.registrationsByDate && (
          <ChartCard title="Đăng ký theo thời gian" description={`Số lượt đăng ký trong ${days} ngày qua`}>
            <RegistrationsChart data={overview.registrationsByDate} />
          </ChartCard>
        )}

        {overview?.tournamentStatusDistribution && (
          <ChartCard title="Trạng thái giải đấu" description="Phân bố trạng thái các giải đấu">
            <TournamentStatusChart data={overview.tournamentStatusDistribution} />
          </ChartCard>
        )}

        {overview?.matchDistribution && (
          <ChartCard title="Phân bố kết quả" description="Số lần đạt từng thứ hạng">
            <MatchDistributionChart data={overview.matchDistribution} />
          </ChartCard>
        )}

        {activity?.dailyActivity && (
          <ChartCard title="Hoạt động tuyển thủ" description="Lượt hoạt động theo ngày">
            <PlayerActivityChart data={activity.dailyActivity} />
          </ChartCard>
        )}
      </div>

      {/* Top players */}
      {activity?.topPlayers && activity.topPlayers.length > 0 && (
        <div className="bg-[#111] rounded-2xl p-6 border border-[#222]">
          <h3 className="text-base font-semibold text-[#f5f5f5] mb-4">Tuyển thủ active nhất</h3>
          <div className="space-y-3">
            {activity.topPlayers.slice(0, 5).map((player, i) => (
              <div key={player.userId} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm font-bold text-[#555] w-6">#{i + 1}</span>
                  <span className="text-sm text-[#f5f5f5]">{player.name}</span>
                </div>
                <span className="text-sm text-[#888]">{player.activityCount} hoạt động</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
