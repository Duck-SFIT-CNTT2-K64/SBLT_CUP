"use client";

import { useState, useEffect } from "react";
import { Trophy, Medal } from "lucide-react";

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
      .then((r) => { if (!r.ok) throw new Error("Failed"); return r.json(); })
      .then((data) => { setPlayers(data); })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20 text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-10">
        <Trophy className="h-14 w-14 text-red-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-2">Bảng xếp hạng</h1>
        <p className="text-gray-400">Tổng hợp thành tích tất cả các giải đấu</p>
      </div>

      {players.length === 0 ? (
        <div className="text-center py-20 text-gray-500">Chưa có dữ liệu</div>
      ) : (
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-zinc-700 bg-zinc-800/60">
                  <th className="text-left py-3 px-4 text-gray-400 font-medium w-12">#</th>
                  <th className="text-left py-3 px-4 text-gray-400 font-medium">Tên ingame</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">Giải đấu</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">Trận</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">Top1</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">Top4%</th>
                  <th className="text-center py-3 px-3 text-gray-400 font-medium">TB hạng</th>
                  <th className="text-right py-3 px-4 text-gray-400 font-medium">Tổng điểm</th>
                </tr>
              </thead>
              <tbody>
                {players.map((p, idx) => (
                  <tr
                    key={p.id}
                    className={`border-b border-zinc-800 transition-colors ${
                      idx === 0 ? "bg-red-600/10" : "hover:bg-zinc-800/30"
                    }`}
                  >
                    <td className="py-3 px-4">
                      {idx < 3 ? (
                        <Medal className={`h-5 w-5 ${idx === 0 ? "text-red-500" : idx === 1 ? "text-zinc-400" : "text-amber-700"}`} />
                      ) : (
                        <span className="text-gray-500">{idx + 1}</span>
                      )}
                    </td>
                    <td className="py-3 px-4">
                      <div className="font-semibold">{p.ign}</div>
                      {p.rank && <div className="text-xs text-gray-500">{p.rank}</div>}
                    </td>
                    <td className="py-3 px-3 text-center text-gray-300">{p.tournamentsPlayed}</td>
                    <td className="py-3 px-3 text-center text-gray-300">{p.totalGames}</td>
                    <td className="py-3 px-3 text-center font-semibold text-red-400">{p.top1Count}</td>
                    <td className="py-3 px-3 text-center">
                      <span className={`text-xs font-medium ${p.top4Rate >= 50 ? "text-green-400" : "text-gray-400"}`}>
                        {p.top4Rate}%
                      </span>
                    </td>
                    <td className="py-3 px-3 text-center text-gray-300">{p.avgPlacement}</td>
                    <td className="py-3 px-4 text-right">
                      <span className="text-red-400 font-bold text-base">{p.totalPoints}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
