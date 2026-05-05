"use client";

import { useState, useEffect } from "react";
import { Calendar, Clock } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface Game {
  id: string; gameNumber: number; status: string; startTime: string | null;
  group: { name: string; stage: { name: string; date: string; startTime: string } };
}

const STATUS_MAP: Record<string, { label: string; variant: "green" | "live" | "default" }> = {
  COMPLETED: { label: "Đã xong", variant: "green" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "live" },
  UPCOMING: { label: "Sắp diễn ra", variant: "default" },
};

export default function SchedulePage() {
  const [games, setGames] = useState<Game[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchSchedule(); }, []);

  const fetchSchedule = async () => {
    try {
      const res = await fetch("/api/players/schedule");
      if (!res.ok) throw new Error();
      setGames(await res.json());
    } catch { setError("Không thể tải lịch thi đấu."); } finally { setLoading(false); }
  };

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-white"><Calendar className="h-7 w-7 text-sblt-red" /> Lịch thi đấu</h1>
        <p className="text-sblt-muted mt-2">Lịch thi đấu cá nhân của bạn</p>
        <div className="sblt-divider w-16 mt-4" />
      </div>

      {games.length > 0 ? (
        <div className="space-y-4">
          {games.map((game) => {
            const cfg = STATUS_MAP[game.status] || STATUS_MAP.UPCOMING;
            return (
              <Card key={game.id} hover={false} className="p-5">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-white">{game.group.stage.name} — {game.group.name}</h3>
                    <p className="text-sblt-muted text-sm">Game {game.gameNumber}</p>
                  </div>
                  <Badge variant={cfg.variant}>{cfg.label}</Badge>
                </div>
                <div className="flex items-center gap-6 text-sm text-sblt-muted">
                  <span className="flex items-center gap-2"><Calendar className="h-4 w-4" />{new Date(game.group.stage.date).toLocaleDateString("vi-VN")}</span>
                  <span className="flex items-center gap-2"><Clock className="h-4 w-4" />{game.group.stage.startTime}</span>
                </div>
              </Card>
            );
          })}
        </div>
      ) : (
        <div className="text-center py-20">
          <Calendar className="h-16 w-16 text-sblt-border mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-sblt-muted mb-2">Chưa có lịch thi đấu</h2>
          <p className="text-sblt-muted text-sm">Lịch thi đấu sẽ được cập nhật khi bạn được phân bổ vào bảng đấu</p>
        </div>
      )}
    </div>
  );
}
