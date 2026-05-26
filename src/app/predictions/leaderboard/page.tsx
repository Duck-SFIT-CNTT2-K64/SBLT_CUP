"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Avatar } from "@/components/ui/Avatar";
import TopWinners from "@/components/leaderboard/TopWinners";
import { Trophy, Target, Loader2, ChevronDown, ChevronUp, CheckCircle, XCircle, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { cn } from "@/lib/utils";

interface PredictionLeaderboardEntry {
  id: string;
  name: string;
  avatar?: string | null;
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
    slot1Correct: boolean;
    slot2Correct: boolean;
    slot3Correct: boolean;
    slot4Correct: boolean;
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
  const [tournaments, setTournaments] = useState<{ id: string; name: string; season: number }[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string>("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const PAGE_SIZE = 20;

  // Fetch tournaments list
  useEffect(() => {
    fetch("/api/tournaments")
      .then(async (r) => {
        const data = await r.json();
        if (r.ok && data.data) {
          setTournaments(data.data.map((t: { id: string; name: string; season: number }) => ({
            id: t.id,
            name: t.name,
            season: t.season,
          })));
        }
      })
      .catch(() => {});
  }, []);

  // Fetch leaderboard when tournament selection changes
  useEffect(() => {
    setLoading(true);
    setError("");
    const params = new URLSearchParams();
    if (selectedTournamentId !== "all") params.set("tournamentId", selectedTournamentId);
    const qs = params.toString();
    fetch(`/api/predictions/leaderboard${qs ? `?${qs}` : ""}`)
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
  }, [selectedTournamentId]);

  const toggleExpand = async (userId: string) => {
    if (expandedUserId === userId) {
      setExpandedUserId(null);
      return;
    }
    setExpandedUserId(userId);

    if (userDetails[userId]) return;

    setLoadingDetail(userId);
    try {
      const qs = selectedTournamentId !== "all" ? `?tournamentId=${selectedTournamentId}` : "";
      const r = await fetch(`/api/predictions/leaderboard/${userId}${qs}`);
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

  const filtered = searchQuery.trim()
    ? leaderboard.filter((e) =>
        e.name.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : leaderboard;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedEntries = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, "...", total];
    if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <RevealOnScroll>
        <div className="text-center mb-10">
          <Target className="h-14 w-14 text-[#dc2626] mx-auto mb-4" />
          <h1 className="sblt-heading text-3xl text-[#f5f5f5] mb-3 tracking-tight">Bảng xếp hạng Dự đoán</h1>
          <p className="text-[#888] max-w-xl mx-auto text-sm">
            {selectedTournamentId === "all"
              ? "Xếp hạng tổng hợp điểm dự đoán qua tất cả các vòng đấu. Người có nhiều điểm dự đoán nhất sẽ nhận phần thưởng từ BTC!"
              : `Xếp hạng điểm dự đoán ${tournaments.find((t) => t.id === selectedTournamentId)?.name || ""}. Cộng dồn điểm qua tất cả các vòng đấu.`}
          </p>
          <div className="w-16 h-0.5 bg-[#dc2626] mx-auto mt-4" />
        </div>
      </RevealOnScroll>

      {/* Tournament Selector */}
      {tournaments.length > 0 && (
        <div className="mb-6">
          <select
            value={selectedTournamentId}
            onChange={(e) => {
              setSelectedTournamentId(e.target.value);
              setExpandedUserId(null);
              setUserDetails({});
              setSearchQuery("");
              setCurrentPage(1);
            }}
            className="bg-[#111] border border-[#222] rounded-xl text-[#f5f5f5] text-sm px-4 py-2.5 focus:border-[#dc2626]/50 focus:outline-none transition-colors"
          >
            <option value="all">Tất cả giải đấu</option>
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>{t.name} — Mùa {t.season}</option>
            ))}
          </select>
        </div>
      )}

      {leaderboard.length > PAGE_SIZE && (
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888]" />
          <input
            type="text"
            placeholder="Tìm theo tên..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setCurrentPage(1); }}
            className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#222] rounded-xl text-[#f5f5f5] text-sm placeholder-[#555] focus:border-[#dc2626]/50 focus:outline-none transition-colors"
          />
        </div>
      )}

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
          {leaderboard.length >= 1 && (
            <TopWinners
              winners={leaderboard.slice(0, 4).map((e, idx) => ({
                id: e.id,
                name: e.name,
                avatar: e.avatar,
                score: e.totalPredictionPoints,
                rank: idx + 1,
              }))}
            />
          )}
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
                    {paginatedEntries.map((entry, idx) => {
                      const rank = (currentPage - 1) * PAGE_SIZE + idx + 1;
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
                            <div className="flex items-center gap-2">
                              <Avatar name={entry.name} src={entry.avatar ?? undefined} size="sm" />
                              <span className={cn("font-medium", isCurrentUser ? "text-[#dc2626]" : "text-[#f5f5f5]")}>
                                {entry.name}
                              </span>
                              {isCurrentUser && (
                                <span className="ml-2 text-xs bg-[#dc2626]/10 text-red-400 px-1.5 py-0.5 rounded">
                                  Bạn
                                </span>
                              )}
                            </div>
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
                {paginatedEntries.map((entry, idx) => {
                  const rank = (currentPage - 1) * PAGE_SIZE + idx + 1;
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
                              <Avatar name={entry.name} src={entry.avatar ?? undefined} size="sm" />
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
                                            <p className="text-[#666] text-[10px] uppercase tracking-wider font-medium mb-1">Dự đoán (4 người đi tiếp)</p>
                                            {e.predictedPlayers.map((ign, pi) => {
                                              const correct = pi === 0 ? e.slot1Correct
                                                : pi === 1 ? e.slot2Correct
                                                : pi === 2 ? e.slot3Correct
                                                : e.slot4Correct;
                                              return (
                                                <div key={pi} className="flex items-center gap-1 mb-1">
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
                                            <p className="text-[#666] text-[10px] uppercase tracking-wider font-medium mb-1">Top 4 thực tế</p>
                                            {e.actualResults.map((r, ri) => (
                                              <div key={ri} className="flex items-center gap-1 mb-1">
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
                                    <p className="text-[#888] text-xs mb-1.5">Dự đoán (4 người đi tiếp)</p>
                                    {e.predictedPlayers.map((ign, pi) => {
                                      const correct = pi === 0 ? e.slot1Correct
                                        : pi === 1 ? e.slot2Correct
                                        : pi === 2 ? e.slot3Correct
                                        : e.slot4Correct;
                                      return (
                                        <div key={pi} className="flex items-center gap-1.5 mb-1">
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
                                    <p className="text-[#888] text-xs mb-1.5">Top 4 thực tế</p>
                                    {e.actualResults.map((r, ri) => (
                                      <div key={ri} className="flex items-center gap-1.5 mb-1">
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

              {searchQuery.trim() && (
                <p className="text-center text-xs text-[#555] mt-3">
                  {filtered.length} kết quả cho &quot;{searchQuery.trim()}&quot;
                </p>
              )}

              {totalPages > 1 && (
                <div className="flex items-center justify-center gap-1.5 mt-6">
                  <button
                    onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                    disabled={currentPage === 1}
                    className="p-2 rounded-lg border border-[#222] text-[#888] hover:text-[#f5f5f5] hover:border-[#dc2626]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  {getPageNumbers(currentPage, totalPages).map((page, i) =>
                    page === "..." ? (
                      <span key={`ellipsis-${i}`} className="px-2 text-[#555] text-sm">...</span>
                    ) : (
                      <button
                        key={page}
                        onClick={() => setCurrentPage(page as number)}
                        className={cn(
                          "px-3 py-1.5 rounded-lg text-sm font-medium transition-colors",
                          currentPage === page
                            ? "bg-[#dc2626] text-white"
                            : "border border-[#222] text-[#888] hover:text-[#f5f5f5] hover:border-[#dc2626]/50"
                        )}
                      >
                        {page}
                      </button>
                    )
                  )}
                  <button
                    onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                    disabled={currentPage === totalPages}
                    className="p-2 rounded-lg border border-[#222] text-[#888] hover:text-[#f5f5f5] hover:border-[#dc2626]/50 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </div>
              )}
            </CardContent>
          </Card>
        </RevealOnScroll>
      )}
    </div>
  );
}
