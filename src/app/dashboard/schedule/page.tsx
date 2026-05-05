"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";

interface Game {
  id: string;
  gameNumber: number;
  status: string;
  startTime: string | null;
  group: {
    name: string;
    stage: {
      name: string;
      date: string;
      startTime: string;
    };
  };
}

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchSchedule();
  }, []);

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/players/schedule");
      if (!res.ok) throw new Error("Failed to fetch schedule");
      const data = await res.json();
      setGames(data);
    } catch (error) {
      console.error("Failed to fetch schedule:", error);
      setError("Không thể tải lịch thi đấu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <Calendar className="h-8 w-8 text-yellow-500" />
          Lịch thi đấu
        </h1>
        <p className="text-gray-400 mt-2">Lịch thi đấu cá nhân của bạn</p>
      </div>

      {games.length > 0 ? (
        <div className="space-y-4">
          {games.map((game) => (
            <div
              key={game.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-6"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-lg mb-1">
                    {game.group.stage.name} - {game.group.name}
                  </h3>
                  <p className="text-gray-400">Game {game.gameNumber}</p>
                </div>
                <span
                  className={`px-3 py-1 rounded-full text-xs font-medium ${
                    game.status === "COMPLETED"
                      ? "bg-green-500/20 text-green-400"
                      : game.status === "IN_PROGRESS"
                      ? "bg-blue-500/20 text-blue-400"
                      : "bg-gray-700 text-gray-400"
                  }`}
                >
                  {game.status === "COMPLETED"
                    ? "Đã xong"
                    : game.status === "IN_PROGRESS"
                    ? "Đang diễn ra"
                    : "Sắp diễn ra"}
                </span>
              </div>

              <div className="mt-4 flex items-center gap-6 text-sm text-gray-400">
                <div className="flex items-center gap-2">
                  <Calendar className="h-4 w-4" />
                  <span>
                    {new Date(game.group.stage.date).toLocaleDateString("vi-VN")}
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <Clock className="h-4 w-4" />
                  <span>{game.group.stage.startTime}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <Calendar className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">
            Chưa có lịch thi đấu
          </h2>
          <p className="text-gray-500">
            Lịch thi đấu sẽ được cập nhật khi bạn được phân bổ vào bảng đấu
          </p>
        </div>
      )}
    </div>
  );
}
