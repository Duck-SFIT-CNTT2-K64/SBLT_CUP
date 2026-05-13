"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PredictionScoreCard from "@/components/predictions/PredictionScoreCard";
import TopWinners from "@/components/leaderboard/TopWinners";
import { ArrowLeft, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

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

  const tournamentId = params.id as string;
  const stageId = params.stageId as string;

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
        <RevealOnScroll>
        <>
          {leaderboard.length >= 1 && (
            <TopWinners
              winners={leaderboard.slice(0, 4).map((e, idx) => ({
                id: e.userId,
                name: e.userName,
                avatar: e.userAvatar,
                score: e.totalScore,
                rank: idx + 1,
              }))}
            />
          )}
          <div className="space-y-3">
            {leaderboard.map((entry) => (
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
        </>
        </RevealOnScroll>
      )}
    </div>
  );
}
