"use client";

import { useState, useEffect } from "react";
import { FileText, Medal } from "lucide-react";

interface GameResult {
  id: string;
  placement: number;
  points: number;
  game: {
    gameNumber: number;
    group: {
      name: string;
      stage: {
        name: string;
      };
    };
  };
}

export default function ResultsPage() {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchResults();
  }, []);

  const fetchResults = async () => {
    try {
      const res = await fetch("/api/players/results");
      if (!res.ok) throw new Error("Failed to fetch results");
      const data = await res.json();
      setResults(data);
    } catch (error) {
      console.error("Failed to fetch results:", error);
      setError("Không thể tải kết quả thi đấu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getPlacementBadge = (placement: number) => {
    if (placement === 1)
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-yellow-500" />
          <span className="font-bold text-yellow-500">1st</span>
        </div>
      );
    if (placement === 2)
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-gray-400" />
          <span className="font-bold text-gray-400">2nd</span>
        </div>
      );
    if (placement === 3)
      return (
        <div className="flex items-center gap-1">
          <Medal className="h-4 w-4 text-amber-600" />
          <span className="font-bold text-amber-600">3rd</span>
        </div>
      );
    return <span className="text-gray-500">{placement}th</span>;
  };

  const totalPoints = results.reduce((sum, r) => sum + r.points, 0);
  const averagePlacement =
    results.length > 0
      ? (results.reduce((sum, r) => sum + r.placement, 0) / results.length).toFixed(1)
      : 0;

  if (loading) {
    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <FileText className="h-8 w-8 text-yellow-500" />
          Kết quả thi đấu
        </h1>
        <p className="text-gray-400 mt-2">Kết quả các trận đấu của bạn</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Stats */}
      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold text-yellow-500">{totalPoints}</div>
            <div className="text-sm text-gray-400">Tổng điểm</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{results.length}</div>
            <div className="text-sm text-gray-400">Trận đấu</div>
          </div>
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-4 text-center">
            <div className="text-2xl font-bold">{averagePlacement}</div>
            <div className="text-sm text-gray-400">Xếp hạng TB</div>
          </div>
        </div>
      )}

      {/* Results List */}
      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((result) => (
            <div
              key={result.id}
              className="bg-gray-900 border border-gray-800 rounded-xl p-4"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-sm text-gray-400 mb-1">
                    {result.game.group.stage.name} - {result.game.group.name}
                  </div>
                  <div className="font-medium">Game {result.game.gameNumber}</div>
                </div>
                <div className="flex items-center gap-4">
                  {getPlacementBadge(result.placement)}
                  <div className="text-right">
                    <div className="text-lg font-bold text-yellow-500">
                      {result.points}
                    </div>
                    <div className="text-xs text-gray-400">điểm</div>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">
            Chưa có kết quả
          </h2>
          <p className="text-gray-500">
            Kết quả sẽ được cập nhật khi bạn tham gia thi đấu
          </p>
        </div>
      )}
    </div>
  );
}
