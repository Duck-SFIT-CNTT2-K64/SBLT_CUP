"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PredictionScoreCard from "@/components/predictions/PredictionScoreCard";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { ArrowLeft, Trophy, Loader2 } from "lucide-react";
import { Alert } from "@/components/ui/Alert";

interface LeaderboardEntry {
  rank: number;
  userId: string;
  userName: string;
  totalScore: number;
  entries: {
    groupName: string;
    rank1Correct: boolean;
    rank2Correct: boolean;
    rank3Correct: boolean;
    rank4Correct: boolean;
    points: number;
  }[];
}

export default function StagePredictionLeaderboardPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [leaderboard, setLeaderboard] = useState<LeaderboardEntry[]>([]);
  const [stageName, setStageName] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

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
        className="inline-flex items-center gap-1 text-sm text-sblt-muted hover:text-white mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Trophy className="h-7 w-7 text-sblt-red" />
          Bảng xếp hạng dự đoán &mdash; {stageName}
        </h1>
        <p className="text-sblt-muted">
          Kết quả dự đoán của tất cả người tham gia cho vòng đấu này.
        </p>
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-sblt-red animate-spin" />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="text-center py-12 text-sblt-muted">
          Chưa có kết quả dự đoán cho vòng đấu này.
        </div>
      ) : (
        <div className="space-y-3">
          {leaderboard.map((entry) => (
            <div key={entry.rank} className="relative">
              {entry.rank <= 3 && (
                <div className="absolute -left-2 top-1/2 -translate-y-1/2">
                  {entry.rank === 1 && <Badge variant="red" className="text-xs">Hạng 1</Badge>}
                  {entry.rank === 2 && <Badge variant="default" className="text-xs">Hạng 2</Badge>}
                  {entry.rank === 3 && <Badge variant="yellow" className="text-xs">Hạng 3</Badge>}
                </div>
              )}
              <PredictionScoreCard
                userName={entry.userName}
                totalScore={entry.totalScore}
                entries={entry.entries}
                isCurrentUser={session?.user?.id === entry.userId}
              />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
