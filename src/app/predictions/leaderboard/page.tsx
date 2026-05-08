"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Trophy, Target, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
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
    return <span className="text-[#888] text-sm w-16 text-center">#{rank}</span>;
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <RevealOnScroll>
        <div className="text-center mb-10">
          <Target className="h-14 w-14 text-[#dc2626] mx-auto mb-4" />
          <h1 className="sblt-heading text-3xl text-[#f5f5f5] mb-3 tracking-tight">Bảng xếp hạng Dự đoán</h1>
          <p className="text-[#888] max-w-xl mx-auto text-sm">
            Xếp hạng tổng hợp điểm dự đoán qua tất cả các vòng đấu.
            Người có nhiều điểm dự đoán nhất sẽ nhận giải thưởng từ Riot!
          </p>
          <div className="w-16 h-0.5 bg-[#dc2626] mx-auto mt-4" />
        </div>
      </RevealOnScroll>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          Chưa có kết quả dự đoán nào.
        </div>
      ) : (
        <RevealOnScroll>
          <Card hover={false}>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Trophy className="h-5 w-5 text-[#dc2626]" />
                Top dự đoán
              </CardTitle>
            </CardHeader>
            <CardContent>
              {/* Desktop Table View */}
              <div className="hidden md:block overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-[#222]">
                      <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase tracking-wider">Hạng</th>
                      <th className="text-left py-3 px-4 text-[#888] font-medium text-xs uppercase tracking-wider">Người chơi</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium text-xs uppercase tracking-wider">Vòng đã dự đoán</th>
                      <th className="text-center py-3 px-4 text-[#888] font-medium text-xs uppercase tracking-wider">Vòng có điểm</th>
                      <th className="text-right py-3 px-4 text-[#888] font-medium text-xs uppercase tracking-wider">Tổng điểm</th>
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
                            "border-b border-[#222]/50 transition-colors cursor-pointer",
                            isCurrentUser && "bg-[#dc2626]/[0.04]",
                            rank <= 3 && "bg-[#dc2626]/[0.02]",
                            isExpanded && "bg-[#0d0d0d]"
                          )}
                          onClick={() => toggleExpand(entry.id)}
                        >
                          <td className="py-3 px-4">{rankBadge(rank)}</td>
                          <td className="py-3 px-4">
                            <span className={cn("font-medium", isCurrentUser ? "text-[#dc2626]" : "text-[#f5f5f5]")}>
                              {entry.name}
                            </span>
                            {isCurrentUser && (
                              <span className="ml-2 text-xs bg-[#dc2626]/10 text-red-400 px-1.5 py-0.5 rounded">
                                Bạn
                              </span>
                            )}
                          </td>
                          <td className="py-3 px-4 text-center text-[#888]">
                            {entry.stagesPredicted}
                          </td>
                          <td className="py-3 px-4 text-center text-[#888]">
                            {entry.stagesWithPoints}
                          </td>
                          <td className="py-3 px-4 text-right">
                            <span className={cn("font-bold", rank <= 3 ? "text-[#dc2626]" : "text-[#f5f5f5]")}>
                              {entry.totalPredictionPoints}
                            </span>
                          </td>
                          <td className="py-3 px-4">
                            {isExpanded ? (
                              <ChevronUp className="h-4 w-4 text-[#888]" />
                            ) : (
                              <ChevronDown className="h-4 w-4 text-[#888]" />
                            )}
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              {/* Mobile Card View */}
              <div className="md:hidden space-y-3">
                {leaderboard.map((entry, idx) => {
                  const rank = idx + 1;
                  const isCurrentUser = session?.user?.id === entry.id;
                  const isExpanded = expandedUserId === entry.id;

                  return (
                    <div key={entry.id}>
                      <div
                        className={cn(
                          "p-4 rounded-lg border transition-all cursor-pointer",
                          isCurrentUser ? "bg-[#dc2626]/[0.08] border-[#dc2626]/30" : "bg-[#111] border-[#222]",
                          rank <= 3 && !isCurrentUser && "bg-[#dc2626]/[0.04] border-[#dc2626]/20",
                          isExpanded && "bg-[#0d0d0d] border-[#dc2626]/40"
                        )}
                        onClick={() => toggleExpand(entry.id)}
                      >
                        <div className="flex items-start justify-between gap-3">
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2 mb-2">
                              {rankBadge(rank)}
                              <span className={cn("font-bold truncate", isCurrentUser ? "text-[#dc2626]" : "text-[#f5f5f5]")}>
                                {entry.name}
                              </span>
                              {isCurrentUser && (
                                <span className="text-xs bg-[#dc2626]/20 text-red-400 px-1.5 py-0.5 rounded whitespace-nowrap">
                                  Bạn
                                </span>
                              )}
                            </div>
                            <div className="grid grid-cols-3 gap-2 text-xs text-[#888]">
                              <div>
                                <p className="text-[#666] text-[10px] uppercase tracking-wider mb-0.5">Vòng dự đoán</p>
                                <p className="text-[#f5f5f5] font-semibold">{entry.stagesPredicted}</p>
                              </div>
                              <div>
                                <p className="text-[#666] text-[10px] uppercase tracking-wider mb-0.5">Vòng điểm</p>
                                <p className="text-[#f5f5f5] font-semibold">{entry.stagesWithPoints}</p>
                              </div>
                              <div className="text-right">
                                <p className="text-[#666] text-[10px] uppercase tracking-wider mb-0.5">Tổng điểm</p>
                                <p className={cn("font-bold text-lg", rank <= 3 ? "text-[#dc2626]" : "text-[#f5f5f5]")}>
                                  {entry.totalPredictionPoints}đ
                                </p>
                              </div>
                            </div>
                          </div>
                          <div className="flex-shrink-0 mt-1">
                            {isExpanded ? (
                              <ChevronUp className="h-5 w-5 text-[#dc2626]" />
                            ) : (
                              <ChevronDown className="h-5 w-5 text-[#888]" />
                            )}
                          </div>
                        </div>
                      </div>

                      {isExpanded && (
                        <div className="mt-3 border-t border-[#222] pt-3">
                          {loadingDetail === entry.id ? (
                            <div className="flex justify-center py-4">
                              <Loader2 className="h-5 w-5 text-[#dc2626] animate-spin" />
                            </div>
                          ) : userDetails[entry.id] ? (
                            <div className="space-y-3">
                              <p className="text-xs text-[#888] uppercase tracking-wider font-medium">
                                Chi tiết dự đoán
                              </p>
                              {userDetails[entry.id].map((stage) => (
                                <div key={stage.stageId} className="bg-[#0d0d0d] rounded-lg p-3 border border-[#222]">
                                  <div className="flex items-center justify-between mb-3">
                                    <span className="text-[#f5f5f5] font-medium text-sm">{stage.stageName}</span>
                                    <span className="text-[#dc2626] font-bold text-sm">{stage.totalScore}đ</span>
                                  </div>
                                  <div className="space-y-2">
                                    {stage.entries.map((e, i) => (
                                      <div key={i} className="bg-[#111] rounded-lg p-2.5 border border-[#222]/50">
                                        <div className="flex items-center justify-between mb-2">
                                          <span className="text-[#888] text-xs font-medium">{e.groupName}</span>
                                          <span className="text-[#dc2626] text-xs font-semibold">{e.points}đ</span>
                                        </div>
                                        <div className="space-y-2">
                                          <div>
                                            <p className="text-[#666] text-[10px] uppercase tracking-wider font-medium mb-1">Dự đoán</p>
                                            {e.predictedPlayers.map((ign, pi) => {
                                              const correct = pi === 0 ? e.rank1Correct
                                                : pi === 1 ? e.rank2Correct
                                                : pi === 2 ? e.rank3Correct
                                                : e.rank4Correct;
                                              return (
                                                <div key={pi} className="flex items-center gap-1 mb-1">
                                                  <span className="text-[#888] text-xs w-5 font-medium">#{pi + 1}</span>
                                                  <span className={cn("text-xs truncate flex-1", correct ? "text-emerald-400 font-medium" : "text-[#888]")}>
                                                    {ign}
                                                  </span>
                                                  {correct ? (
                                                    <CheckCircle className="h-3 w-3 text-emerald-400 flex-shrink-0" />
                                                  ) : (
                                                    <XCircle className="h-3 w-3 text-red-400/50 flex-shrink-0" />
                                                  )}
                                                </div>
                                              );
                                            })}
                                          </div>
                                          <div className="border-t border-[#222]/30 pt-2">
                                            <p className="text-[#666] text-[10px] uppercase tracking-wider font-medium mb-1">Thực tế</p>
                                            {e.actualResults.map((r, ri) => (
                                              <div key={ri} className="flex items-center gap-1 mb-1">
                                                <span className="text-[#888] text-xs w-5 font-medium">
                                                  {r.finalRank ? `#${r.finalRank}` : `#${ri + 1}`}
                                                </span>
                                                <span className="text-[#f5f5f5] text-xs truncate flex-1">{r.ign}</span>
                                              </div>
                                            ))}
                                            {e.actualResults.length === 0 && (
                                              <span className="text-[#888] text-xs italic">Chưa có kết quả</span>
                                            )}
                                          </div>
                                        </div>
                                      </div>
                                    ))}
                                  </div>
                                </div>
                              ))}
                              {userDetails[entry.id].length === 0 && (
                                <p className="text-[#888] text-xs text-center py-2">
                                  Chưa có kết quả dự đoán nào.
                                </p>
                              )}
                            </div>
                          ) : (
                            <p className="text-[#888] text-xs text-center py-2">
                              Không thể tải chi tiết.
                            </p>
                          )}
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Desktop Expansion Details */}
              {expandedUserId && (
                <div className="hidden md:block border-t border-[#222] bg-[#0d0d0d] p-5 mt-0">
                  {loadingDetail === expandedUserId ? (
                    <div className="flex justify-center py-6">
                      <Loader2 className="h-6 w-6 text-[#dc2626] animate-spin" />
                    </div>
                  ) : userDetails[expandedUserId] ? (
                    <div className="space-y-4">
                      <p className="text-xs text-[#888] uppercase tracking-wider font-medium">
                        Chi tiết dự đoán
                      </p>
                      {userDetails[expandedUserId].map((stage) => (
                        <div key={stage.stageId} className="bg-[#111] rounded-lg p-4 border border-[#222]">
                          <div className="flex items-center justify-between mb-3">
                            <span className="text-[#f5f5f5] font-medium">{stage.stageName}</span>
                            <span className="text-[#dc2626] font-bold">{stage.totalScore}đ</span>
                          </div>
                          <div className="space-y-3">
                            {stage.entries.map((e, i) => (
                              <div key={i} className="bg-[#0d0d0d] rounded-lg p-3">
                                <div className="flex items-center justify-between mb-2">
                                  <span className="text-[#888] text-sm">{e.groupName}</span>
                                  <span className="text-[#888] text-sm">{e.points}đ</span>
                                </div>
                                <div className="grid grid-cols-2 gap-3 text-sm">
                                  <div>
                                    <p className="text-[#888] text-xs mb-1.5">Dự đoán</p>
                                    {e.predictedPlayers.map((ign, pi) => {
                                      const correct = pi === 0 ? e.rank1Correct
                                        : pi === 1 ? e.rank2Correct
                                        : pi === 2 ? e.rank3Correct
                                        : e.rank4Correct;
                                      return (
                                        <div key={pi} className="flex items-center gap-1.5 mb-1">
                                          <span className="text-[#888] text-xs w-4">#{pi + 1}</span>
                                          <span className={correct ? "text-emerald-400" : "text-[#888]"}>
                                            {ign}
                                          </span>
                                          {correct ? (
                                            <CheckCircle className="h-3 w-3 text-emerald-400 ml-auto" />
                                          ) : (
                                            <XCircle className="h-3 w-3 text-red-400/50 ml-auto" />
                                          )}
                                        </div>
                                      );
                                    })}
                                  </div>
                                  <div>
                                    <p className="text-[#888] text-xs mb-1.5">Thực tế</p>
                                    {e.actualResults.map((r, ri) => (
                                      <div key={ri} className="flex items-center gap-1.5 mb-1">
                                        <span className="text-[#888] text-xs w-4">
                                          {r.finalRank ? `#${r.finalRank}` : `#${ri + 1}`}
                                        </span>
                                        <span className="text-[#f5f5f5]">{r.ign}</span>
                                      </div>
                                    ))}
                                    {e.actualResults.length === 0 && (
                                      <span className="text-[#888] text-xs italic">Chưa có kết quả</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                      {userDetails[expandedUserId].length === 0 && (
                        <p className="text-[#888] text-sm text-center py-4">
                          Chưa có kết quả dự đoán nào.
                        </p>
                      )}
                    </div>
                  ) : (
                    <p className="text-[#888] text-sm text-center py-4">
                      Không thể tải chi tiết.
                    </p>
                  )}
                </div>
              )}
            </CardContent>
          </Card>
        </RevealOnScroll>
      )}
    </div>
  );
}
