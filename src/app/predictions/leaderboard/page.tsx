"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Target, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { cn } from "@/lib/utils";

interface PredictionLeaderboardEntry {
  id: string;
  name: string;
  totalPredictionPoints: number;
  stagesPredicted: number;
  stagesWithPoints: number;
}

interface StageDetail {
  stageId: string;
  stageName: string;
  stageType: string;
  totalScore: number;
  entries: {
    groupName: string;
    predictedPlayers: string[];
    actualResults: { ign: string; finalRank: number | null }[];
    rank1Correct: boolean;
    rank2Correct: boolean;
    rank3Correct: boolean;
    rank4Correct: boolean;
    points: number;
  }[];
}

export default function GlobalPredictionLeaderboardPage() {
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<PredictionLeaderboardEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedUserId, setExpandedUserId] = useState<string | null>(null);
  const [userDetails, setUserDetails] = useState<Record<string, StageDetail[]>>({});
  const [loadingDetail, setLoadingDetail] = useState<string | null>(null);

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

  const toggleExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    if (userDetails[userId]) return;

    setLoadingDetail(userId);
    try {
      const r = await fetch(`/api/predictions/leaderboard/${userId}`);
      const data = await r.json();
      if (r.ok) {
        setUserDetails((prev) => ({ ...prev, [userId]: data.stages || [] }));
      }
    } catch {
      // silently fail
    } finally {
      setLoadingDetail(null);
    }
  };

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
                    <th className="w-10"></th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((entry, idx) => {
                    const rank = idx + 1;
                    const isCurrentUser = session?.user?.id === entry.id;
                    const isExpanded = expandedUserId === entry.id;

                    return (
                      <tr
                        key={entry.id}
                        className={cn(
                          "border-b border-sblt-border/50 transition-colors cursor-pointer",
                          isCurrentUser && "bg-sblt-red/5",
                          rank <= 3 && "bg-sblt-red/[0.02]",
                          isExpanded && "bg-sblt-dark"
                        )}
                        onClick={() => toggleExpand(entry.id)}
                      >
                        <td className="py-3 px-4">{rankBadge(rank)}</td>
                        <td className="py-3 px-4">
                          <span className={cn("font-medium", isCurrentUser ? "text-sblt-red" : "text-white")}>
                            {entry.name}
                          </span>
                          {isCurrentUser && (
                            <span className="ml-2 text-xs bg-sblt-red/10 text-red-400 px-1.5 py-0.5 rounded">
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
                        <td className="py-3 px-4">
                          {isExpanded ? (
                            <ChevronUp className="h-4 w-4 text-sblt-muted" />
                          ) : (
                            <ChevronDown className="h-4 w-4 text-sblt-muted" />
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Expanded detail panel */}
              {expandedUserId && (
                <div className="border-t border-sblt-border bg-sblt-dark/50 p-5">
                  {loadingDetail === expandedUserId ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 text-sblt-red animate-spin" />
                    </div>
                  ) : userDetails[expandedUserId] ? (
                    <div className="space-y-4">
                      <p className="text-xs text-sblt-muted uppercase tracking-wider font-medium">
                        Chi tiết dự đoán
                      </p>
                      {userDetails[expandedUserId].map((stage) => (
                        <div key={stage.stageId} className="bg-sblt-card rounded-lg p-4 border border-sblt-border">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-white font-medium">{stage.stageName}</span>
                            <span className="text-sblt-red font-bold">{stage.totalScore}đ</span>
                          </div>
                          <div className="space-y-3">
                            {stage.entries.map((e, i) => (
                              <div key={i} className="bg-sblt-dark rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-sblt-muted text-sm">{e.groupName}</span>
                                  <span className="text-sblt-muted text-sm">{e.points}đ</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-sblt-muted text-xs mb-1.5">Dự đoán</p>
                                    {e.predictedPlayers.map((ign, pi) => {
                                      const correct = pi === 0 ? e.rank1Correct
                                        : pi === 1 ? e.rank2Correct
                                        : pi === 2 ? e.rank3Correct
                                        : e.rank4Correct;
                                      return (
                                        <div key={pi} className="flex items-center gap-1.5 mb-1">
                                          <span className="text-sblt-muted text-xs w-4">#{pi + 1}</span>
                                          <span className={correct ? "text-green-400" : "text-sblt-muted"}>
                                            {ign}
                                          </span>
                                          {correct ? (
                                            <CheckCircle className="h-3 w-3 text-green-400 ml-auto" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-400/50 ml-auto" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div>
                                    <p className="text-sblt-muted text-xs mb-1.5">Thực tế</p>
                                    {e.actualResults.map((r, ri) => (
                                      <div key={ri} className="flex items-center gap-1.5 mb-1">
                                        <span className="text-sblt-muted text-xs w-4">
                                          {r.finalRank ? `#${r.finalRank}` : `#${ri + 1}`}
                                        </span>
                                        <span className="text-white">{r.ign}</span>
                                      </div>
                                    ))}
                                    {e.actualResults.length === 0 && (
                                      <span className="text-sblt-muted text-xs italic">Chưa có kết quả</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {userDetails[expandedUserId].length === 0 && (
                        <p className="text-sblt-muted text-sm text-center py-4">
                          Chưa có kết quả dự đoán nào.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-sblt-muted text-sm text-center py-4">
                      Không thể tải chi tiết.
                    </p>
                  )}
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
