"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PredictionScoreCard from "@/components/predictions/PredictionScoreCard";
import TopWinners from "@/components/leaderboard/TopWinners";
import { DuckRace } from "@/components/tft";
import { ArrowLeft, Loader2, Trophy, Search, ChevronLeft, ChevronRight } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { useSSE } from "@/lib/hooks/useSSE";

interface ActualResult {
  ign: string;
  finalRank: number | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  userAvatar?: string | null;
  totalScore: number;
  entries: {
    groupName: string;
    slot1Correct: boolean;
    slot2Correct: boolean;
    slot3Correct: boolean;
    slot4Correct: boolean;
    points: number;
    predictedPlayers: string[];
    actualResults: ActualResult[];
  }[];
}

export default function StagePredictionLeaderboardPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stageName, setStageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expandedRank, setExpandedRank] = useState<number | null>(null);
  const [showDuckRace, setShowDuckRace] = useState(false);
  const [duckRacePlayers, setDuckRacePlayers] = useState<{ id: string; ign: string; avatar?: string | null }[]>([]);
  const [duckRaceTriggering, setDuckRaceTriggering] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [currentPage, setCurrentPage] = useState(1);

  const PAGE_SIZE = 20;
  const tournamentId = params.id as string;
  const stageId = params.stageId as string;

  // SSE listener for duck race events
  const handleSSE = useCallback((event: string, data: unknown) => {
    if (event === "duck-race-start" && data && typeof data === "object") {
      const d = data as Record<string, unknown>;
      setDuckRacePlayers((d.players as { id: string; ign: string; avatar?: string | null }[]) || []);
      setShowDuckRace(true);
    }
  }, []);

  useSSE({ tournamentId, onEvent: handleSSE });

  // Check if top score has ties
  const topScore = leaderboard[0]?.totalScore ?? 0;
  const tiedCount = leaderboard.filter((e) => e.totalScore === topScore).length;
  const hasTie = tiedCount > 1;

  // Pagination + search (client-side)
  const filtered = searchQuery.trim()
    ? leaderboard.filter((e) =>
        e.userName.toLowerCase().includes(searchQuery.trim().toLowerCase())
      )
    : leaderboard;
  const totalPages = Math.ceil(filtered.length / PAGE_SIZE);
  const paginatedEntries = filtered.slice(
    (currentPage - 1) * PAGE_SIZE,
    currentPage * PAGE_SIZE
  );

  const triggerDuckRace = async () => {
    setDuckRaceTriggering(true);
    try {
      await fetch(`/api/tournaments/${tournamentId}/predictions/${stageId}/tiebreaker`, { method: "POST" });
    } catch {
      // ignore
    } finally {
      setDuckRaceTriggering(false);
    }
  };

  function getPageNumbers(current: number, total: number): (number | "...")[] {
    if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);
    if (current <= 3) return [1, 2, 3, 4, "...", total];
    if (current >= total - 2) return [1, "...", total - 3, total - 2, total - 1, total];
    return [1, "...", current - 1, current, current + 1, "...", total];
  }

  useEffect(() => {
    fetch(`/api/tournaments/${tournamentId}/predictions/${stageId}/leaderboard`)
      .then(async (r) => {
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || "Lỗi tải dữ liệu");
          return;
        }
        setLeaderboard(data.leaderboard || []);
        setStageName(data.stageName || "");
      })
      .catch(() => setError("Lỗi kết nối. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [tournamentId, stageId]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link
        href={`/tournaments/${tournamentId}/predictions`}
        className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-[#f5f5f5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      <RevealOnScroll>
        <SectionHeading title="Bảng xếp hạng" subtitle={stageName || "Kết quả dự đoán của tất cả người tham gia"} />
      </RevealOnScroll>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {/* Duck Race Tie-breaker */}
      {showDuckRace && duckRacePlayers.length > 0 && (
        <RevealOnScroll>
          <div className="mb-8 bg-gradient-to-br from-yellow-500/5 to-orange-500/5 border border-yellow-500/20 rounded-2xl p-6">
            <DuckRace
              players={duckRacePlayers}
              autoStart
              onWinner={(winnerId) => {
                console.log("Duck race winner:", winnerId);
              }}
            />
          </div>
        </RevealOnScroll>
      )}

      {/* Admin: Trigger duck race when there's a tie */}
      {!showDuckRace && hasTie && session?.user?.role === "ADMIN" && (
        <RevealOnScroll>
          <div className="mb-6 bg-[#111] border border-[#222] rounded-xl p-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Trophy className="h-5 w-5 text-yellow-400" />
              <div>
                <p className="text-sm text-[#f5f5f5] font-medium">{tiedCount} người cùng {topScore} điểm</p>
                <p className="text-xs text-[#888]">Kích hoạt đua vịt để chọn người thắng</p>
              </div>
            </div>
            <button
              onClick={triggerDuckRace}
              disabled={duckRaceTriggering}
              className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 disabled:opacity-50 text-black font-bold px-4 py-2 rounded-lg text-sm transition-all"
            >
              {duckRaceTriggering ? "Đang khởi động..." : "🦆 Đua vịt"}
            </button>
          </div>
        </RevealOnScroll>
      )}

      {!loading && leaderboard.length > 0 && (
        <RevealOnScroll>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {[
            { label: "Người tham gia", value: leaderboard.length, color: "text-[#f5f5f5]" },
            { label: "Điểm cao nhất", value: leaderboard[0]?.totalScore ?? 0, color: "text-[#dc2626]" },
            { label: "Điểm trung bình", value: Math.round(leaderboard.reduce((s, e) => s + e.totalScore, 0) / leaderboard.length), color: "text-[#f5f5f5]" },
          ].map((stat) => (
            <div key={stat.label} className="rounded-xl border border-[#222] bg-[#111] px-4 py-3 text-center border-l-2 border-l-[#dc2626]">
              <div className="text-[10px] uppercase tracking-[0.2em] text-[#888] font-medium">{stat.label}</div>
              <div className={`mt-1.5 text-xl font-black ${stat.color}`} style={{ fontFamily: "var(--font-heading)" }}>
                {stat.value}
              </div>
            </div>
          ))}
        </div>
        </RevealOnScroll>
      )}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          Chưa có kết quả dự đoán cho vòng đấu này.
        </div>
      ) : (
        <>
          {leaderboard.length >= 1 && (
            <RevealOnScroll>
              <TopWinners
                winners={leaderboard.slice(0, 4).map((e) => ({
                  id: e.userId,
                  name: e.userName,
                  avatar: e.userAvatar,
                  score: e.totalScore,
                  rank: e.rank,
                }))}
              />
            </RevealOnScroll>
          )}

          {/* Search */}
          {leaderboard.length > PAGE_SIZE && (
            <div className="relative mb-4 mt-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-[#888]" />
              <input
                type="text"
                placeholder="Tìm theo tên..."
                value={searchQuery}
                onChange={(e) => {
                  setSearchQuery(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-10 pr-4 py-2.5 bg-[#111] border border-[#222] rounded-xl text-[#f5f5f5] text-sm placeholder-[#555] focus:border-[#dc2626]/50 focus:outline-none transition-colors"
              />
            </div>
          )}

          <div className="space-y-3">
            {paginatedEntries.map((entry) => (
              <PredictionScoreCard
                key={entry.userId}
                userName={entry.userName}
                userAvatar={entry.userAvatar}
                totalScore={entry.totalScore}
                entries={entry.entries}
                rank={entry.rank}
                isCurrentUser={session?.user?.id === entry.userId}
                expanded={expandedRank === entry.rank}
                onToggle={() =>
                  setExpandedRank(expandedRank === entry.rank ? null : entry.rank)
                }
              />
            ))}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-1.5 mt-6">
              <button
                onClick={() => setCurrentPage((p) => Math.max(1, p - 1))}
                disabled={currentPage === 1}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#222] bg-[#111] text-[#888] hover:text-[#f5f5f5] hover:border-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronLeft className="h-4 w-4" />
              </button>
              {getPageNumbers(currentPage, totalPages).map((page, i) =>
                page === "..." ? (
                  <span key={`dots-${i}`} className="px-1 text-[#555] text-sm">...</span>
                ) : (
                  <button
                    key={page}
                    onClick={() => setCurrentPage(page as number)}
                    className={`flex items-center justify-center h-8 min-w-[32px] px-2 rounded-lg text-sm font-medium transition-colors ${
                      page === currentPage
                        ? "bg-[#dc2626] text-white border border-[#dc2626]"
                        : "border border-[#222] bg-[#111] text-[#888] hover:text-[#f5f5f5] hover:border-[#333]"
                    }`}
                  >
                    {page}
                  </button>
                )
              )}
              <button
                onClick={() => setCurrentPage((p) => Math.min(totalPages, p + 1))}
                disabled={currentPage === totalPages}
                className="flex items-center justify-center h-8 w-8 rounded-lg border border-[#222] bg-[#111] text-[#888] hover:text-[#f5f5f5] hover:border-[#333] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
              >
                <ChevronRight className="h-4 w-4" />
              </button>
            </div>
          )}

          {/* Search result count */}
          {searchQuery.trim() && (
            <p className="text-center text-xs text-[#555] mt-3">
              {filtered.length} kết quả cho &ldquo;{searchQuery.trim()}&rdquo;
            </p>
          )}
        </>
      )}
    </div>
  );
}
