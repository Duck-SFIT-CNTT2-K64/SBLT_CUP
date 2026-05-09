"use client";

import { useState, useEffect } from "react";
import { FileText, Medal } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Alert } from "@/components/ui/Alert";

interface GameResult {
  id: string; placement: number; points: number;
  game: { gameNumber: number; group: { name: string; stage: { name: string } } };
}

export default function ResultsPage() {
  const [results, setResults] = useState<GameResult[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/players/results");
        if (!res.ok) throw new Error();
        if (!cancelled) setResults(await res.json());
      } catch { if (!cancelled) setError("Không thể tải kết quả thi đấu."); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const getPlacementBadge = (placement: number) => {
    if (placement === 1) return <span className="flex items-center gap-1"><Medal className="h-4 w-4 text-yellow-400" /><span className="font-bold text-yellow-400">1st</span></span>;
    if (placement === 2) return <span className="flex items-center gap-1"><Medal className="h-4 w-4 text-gray-300" /><span className="font-bold text-gray-300">2nd</span></span>;
    if (placement === 3) return <span className="flex items-center gap-1"><Medal className="h-4 w-4 text-orange-400" /><span className="font-bold text-orange-400">3rd</span></span>;
    return <span className="text-[#888]">{placement}th</span>;
  };

  const totalPoints = results.reduce((s, r) => s + r.points, 0);
  const avgPlacement = results.length > 0 ? (results.reduce((s, r) => s + r.placement, 0) / results.length).toFixed(1) : 0;

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-[#f5f5f5]"><FileText className="h-7 w-7 text-[#dc2626]" /> Kết quả thi đấu</h1>
        <p className="text-[#888] mt-2">Kết quả các trận đấu của bạn</p>
        <div className="sblt-divider w-16 mt-4" />
      </div>

      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}

      {results.length > 0 && (
        <div className="grid grid-cols-3 gap-4 mb-8">
          {[{ value: totalPoints, label: "Tổng điểm", color: "text-[#dc2626]" }, { value: results.length, label: "Trận đấu", color: "text-[#f5f5f5]" }, { value: avgPlacement, label: "Xếp hạng TB", color: "text-[#f5f5f5]" }].map((stat) => (
            <Card key={stat.label} hover={false} className="p-4 text-center">
              <div className={`text-2xl font-bold ${stat.color}`}>{stat.value}</div>
              <div className="text-xs text-[#888] mt-1">{stat.label}</div>
            </Card>
          ))}
        </div>
      )}

      {results.length > 0 ? (
        <div className="space-y-3">
          {results.map((r) => (
            <Card key={r.id} hover={false} className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-[#888] mb-1">{r.game.group.stage.name} — {r.game.group.name}</div>
                  <div className="font-medium text-[#f5f5f5]">Game {r.game.gameNumber}</div>
                </div>
                <div className="flex items-center gap-4">
                  {getPlacementBadge(r.placement)}
                  <div className="text-right">
                    <div className="text-lg font-bold text-[#dc2626]">{r.points}</div>
                    <div className="text-xs text-[#888]">điểm</div>
                  </div>
                </div>
              </div>
            </Card>
          ))}
        </div>
      ) : (
        <div className="text-center py-20">
          <FileText className="h-16 w-16 text-[#555] mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-[#888] mb-2">Chưa có kết quả</h2>
          <p className="text-[#888] text-sm">Kết quả sẽ được cập nhật khi bạn tham gia thi đấu</p>
        </div>
      )}
    </div>
  );
}
