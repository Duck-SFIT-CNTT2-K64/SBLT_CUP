"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PredictionScoreCard from "@/components/predictions/PredictionScoreCard";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

interface ActualResult {
  ign: string;
  finalRank: number | null;
}

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
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

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-[#dc2626]" />
          Bảng xếp hạng dự đoán &mdash; {stageName}
        </h1>
        <p className="text-[#888]">
          Kết quả dự đoán của tất cả người tham gia cho vòng đấu này. Nhấp vào để xem chi tiết.
        </p>
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          Chưa có kết quả dự đoán cho vòng đấu này.
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <PredictionScoreCard
              key={entry.userId}
              userName={entry.userName}
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
      )}
    </div>
  );
}
