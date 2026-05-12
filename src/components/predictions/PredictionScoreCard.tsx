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
  slot1Correct: boolean;
  slot2Correct: boolean;
  slot3Correct: boolean;
  slot4Correct: boolean;
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
  return <span className="text-[#888] text-sm font-medium w-12 text-center">#{rank}</span>;
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
        "bg-[#111] border rounded-xl transition-all cursor-pointer",
        isCurrentUser ? "border-[#dc2626]" : "border-[#222]",
        expanded && "ring-1 ring-[#222]"
      )}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          {rank !== undefined && <RankBadge rank={rank} />}
          <span className="text-[#f5f5f5] font-bold">{userName}</span>
          {isCurrentUser && (
            <span className="text-xs bg-[#dc2626]/10 text-red-400 px-2 py-0.5 rounded-full">
              Bạn
            </span>
          )}
        </div>
        <div className="flex items-center gap-3">
          <span className="text-lg font-bold text-[#dc2626]">{totalScore} điểm</span>
          {onToggle && (
            expanded ? (
              <ChevronUp className="h-4 w-4 text-[#888]" />
            ) : (
              <ChevronDown className="h-4 w-4 text-[#888]" />
            )
          )}
        </div>
      </div>

      {/* Score summary */}
      <div className="px-5 pb-3 space-y-2">
        {entries.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm">
            <span className="text-[#888] w-20 shrink-0">{entry.groupName}</span>
            <div className="flex items-center gap-1">
              {[entry.slot1Correct, entry.slot2Correct, entry.slot3Correct, entry.slot4Correct].map(
                (correct, i) =>
                  correct ? (
                    <CheckCircle key={i} className="h-4 w-4 text-green-400" />
                  ) : (
                    <XCircle key={i} className="h-4 w-4 text-red-400/50" />
                  )
              )}
            </div>
            <span className="text-[#888] ml-auto">{entry.points}đ</span>
          </div>
        ))}
      </div>

      {/* Expanded detail: predicted vs actual */}
      {expanded && (
        <div className="border-t border-[#222] px-5 py-4 space-y-4">
          <p className="text-xs text-[#888] uppercase tracking-wider font-medium">
            Chi tiết dự đoán
          </p>
          {entries.map((entry, idx) => (
            <div key={idx} className="bg-[#0d0d0d] rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#f5f5f5] font-medium text-sm">{entry.groupName}</span>
                <span className="text-[#dc2626] text-sm font-bold">{entry.points}đ</span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Predicted */}
                <div>
                  <p className="text-[#888] text-xs mb-2">Dự đoán của bạn (4 người đi tiếp)</p>
                  <div className="space-y-1.5">
                    {entry.predictedPlayers.map((ign, i) => {
                      const correct = i === 0 ? entry.slot1Correct
                        : i === 1 ? entry.slot2Correct
                        : i === 2 ? entry.slot3Correct
                        : entry.slot4Correct;
                      return (
                        <div key={i} className="flex items-center gap-2">
                          <span className="text-xs text-[#666] w-4 text-center">{i + 1}</span>
                          <span className={cn(
                            "text-sm",
                            correct ? "text-green-400 font-medium" : "text-[#888]"
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
                  <p className="text-[#888] text-xs mb-2">Top 4 thực tế (đi tiếp)</p>
                  <div className="space-y-1.5">
                    {entry.actualResults.map((result, i) => (
                      <div key={i} className="flex items-center gap-2">
                        <span className="text-xs text-[#666] w-4 text-center">
                          {result.finalRank ?? (i + 1)}
                        </span>
                        <span className="text-[#f5f5f5] text-sm">{result.ign}</span>
                      </div>
                    ))}
                    {entry.actualResults.length === 0 && (
                      <span className="text-[#888] text-xs italic">Chưa có kết quả</span>
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
