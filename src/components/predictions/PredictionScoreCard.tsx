"use client";

import { CheckCircle, XCircle, ChevronDown, ChevronUp } from "lucide-react";
import { cn } from "@/lib/utils";
import { Badge } from "@/components/ui/Badge";

interface ActualResult {
  ign: string;
  finalRank: number | null;
}

interface EntryResult {
  groupName: string;
  rank1Correct: boolean;
  rank2Correct: boolean;
  rank3Correct: boolean;
  rank4Correct: boolean;
  points: number;
  predictedPlayers: string[];
  actualResults: ActualResult[];
}

interface PredictionScoreCardProps {
  userName: string;
  totalScore: number;
  entries: EntryResult[];
  rank?: number;
  isCurrentUser?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

function RankBadge({ rank }: { rank: number }) {
  if (rank === 1) return <Badge variant="red">Hạng 1</Badge>;
  if (rank === 2) return <Badge variant="white">Hạng 2</Badge>;
  if (rank === 3) return <Badge variant="yellow">Hạng 3</Badge>;
  return <span className="text-sblt-muted text-sm font-medium w-12 text-center">#{rank}</span>;
}

export default function PredictionScoreCard({
  userName,
  totalScore,
  entries,
  rank,
  isCurrentUser = false,
  expanded = false,
  onToggle,
}: PredictionScoreCardProps) {
  return (
    <div
      className={cn(
        "bg-sblt-card border rounded-xl transition-all cursor-pointer",
        isCurrentUser ? "border-sblt-red" : "border-sblt-border",
        expanded && "ring-1 ring-sblt-border"
      )}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          {rank !== undefined && <RankBadge rank={rank} />}
          <span className="text-white font-bold">{userName}</span>
          {isCurrentUser && (
            <span className="text-xs bg-sblt-red/10 text-red-400 px-2 py-0.5 rounded-full">
              Bạn
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-sblt-red">{totalScore} điểm</span>
          {onToggle && (
            expanded ? (
              <ChevronUp className="h-4 w-4 text-sblt-muted" />
            ) : (
              <ChevronDown className="h-4 w-4 text-sblt-muted" />
            )
          )}
        </div>
      </div>

      {/* Score summary */}
      <div className="px-5 pb-3 space-y-2">
        {entries.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm">
            <span className="text-sblt-muted w-20 shrink-0">{entry.groupName}</span>
            <div className="flex items-center gap-1">
              {[entry.rank1Correct, entry.rank2Correct, entry.rank3Correct, entry.rank4Correct].map(
                (correct, i) =>
                  correct ? (
                    <CheckCircle key={i} className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle key={i} className="h-4 w-4 text-red-400/50" />
                  )
              )}
            </div>
            <span className="text-sblt-muted ml-auto">{entry.points}đ</span>
          </div>
        ))}
      </div>

      {/* Expanded detail: predicted vs actual */}
      {expanded && (
        <div className="border-t border-sblt-border px-5 py-4 space-y-4">
          <p className="text-xs text-sblt-muted uppercase tracking-wider font-medium">
            Chi tiết dự đoán
          </p>
          {entries.map((entry, idx) => (
            <div key={idx} className="bg-sblt-dark rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-white font-medium text-sm">{entry.groupName}</span>
                <span className="text-sblt-red text-sm font-bold">{entry.points}đ</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Predicted */}
                <div>
                  <p className="text-sblt-muted text-xs mb-2">Dự đoán của bạn</p>
                  <div className="space-y-1.5">
                    {entry.predictedPlayers.map((ign, i) => {
                      const correct = i === 0 ? entry.rank1Correct
                        : i === 1 ? entry.rank2Correct
                        : i === 2 ? entry.rank3Correct
                        : entry.rank4Correct;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-sblt-muted text-xs w-4">#{i + 1}</span>
                          <span className={cn(
                            "text-sm",
                            correct ? "text-green-400" : "text-sblt-muted"
                          )}>
                            {ign}
                          </span>
                          {correct ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-400 ml-auto" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-400/50 ml-auto" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actual */}
                <div>
                  <p className="text-sblt-muted text-xs mb-2">Kết quả thực tế</p>
                  <div className="space-y-1.5">
                    {entry.actualResults.map((result, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-sblt-muted text-xs w-4">
                          {result.finalRank ? `#${result.finalRank}` : `#${i + 1}`}
                        </span>
                        <span className="text-white text-sm">{result.ign}</span>
                      </div>
                    ))}
                    {entry.actualResults.length === 0 && (
                      <span className="text-sblt-muted text-xs italic">Chưa có kết quả</span>
                    )}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
