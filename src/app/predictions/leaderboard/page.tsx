"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Target, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

interface PredictionLeaderboardEntry {
  id: string;
  name: string;
  totalPredictionPoints: number;
  stagesPredicted: number;
  stagesWithPoints: number;
}

export default function GlobalPredictionLeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/predictions/leaderboard")
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || "Lỗi tải dữ liệu");
          return;
        }
        setLeaderboard(Array.isArray(data) ? data : []);
      })
      .catch(() => setError("Lỗi kết nối. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  const rankBadge = (rank: number) => {
    if (rank === 1) return <Badge variant="red">Hạng 1</Badge>;
    if (rank === 2) return <Badge variant="white">Hạng 2</Badge>;
    if (rank === 3) return <Badge variant="yellow">Hạng 3</Badge>;
    return <span className="text-sblt-muted text-sm w-16 text-center">#{rank}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Hero */}
      <div className="text-center mb-10">
        <Target className="h-14 w-14 text-sblt-red mx-auto mb-4" />
        <h1 className="text-3xl font-bold text-white mb-3">Bảng xếp hạng Dự đoán</h1>
        <p className="text-sblt-muted max-w-xl mx-auto">
          Xếp hạng tổng hợp điểm dự đoán qua tất cả các vòng đấu.
          Người có nhiều điểm dự đoán nhất sẽ nhận giải thưởng từ Riot!
        </p>
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-sblt-red animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-sblt-muted">
          Chưa có kết quả dự đoán nào.
        </div>
      ) : (
        <Card hover={false}>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Trophy className="h-5 w-5 text-sblt-red" />
              Top dự đoán
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-sblt-border">
                    <th className="text-left py-3 px-4 text-sblt-muted font-medium">Hạng</th>
                    <th className="text-left py-3 px-4 text-sblt-muted font-medium">Người chơi</th>
                    <th className="text-center py-3 px-4 text-sblt-muted font-medium">Vòng đã dự đoán</th>
                    <th className="text-center py-3 px-4 text-sblt-muted font-medium">Vòng có điểm</th>
                    <th className="text-right py-3 px-4 text-sblt-muted font-medium">Tổng điểm</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    const isCurrentUser = session?.user?.id === entry.id;

                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          "border-b border-sblt-border/50 transition-colors",
                          isCurrentUser && "bg-sblt-red/5",
                          rank <= 3 && "bg-sblt-red/[0.02]"
                        )}
                      >
                        <td className="py-3 px-4">{rankBadge(rank)}</td>
                        <td className="py-3 px-4">
                          <span className={cn("font-medium", isCurrentUser ? "text-sblt-red" : "text-white")}>
                            {entry.name}
                          </span>
                          {isCurrentUser && (
                            <span className="ml-2 text-[10px] bg-sblt-red/10 text-red-400 px-1.5 py-0.5 rounded">
                              Bạn
                            </span>
                          )}
                        </td>
                        <td className="py-3 px-4 text-center text-sblt-muted">
                          {entry.stagesPredicted}
                        </td>
                        <td className="py-3 px-4 text-center text-sblt-muted">
                          {entry.stagesWithPoints}
                        </td>
                        <td className="py-3 px-4 text-right">
                          <span className={cn("font-bold", rank <= 3 ? "text-sblt-red" : "text-white")}>
                            {entry.totalPredictionPoints}
                          </span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
