"use client";

import { CheckCircle, XCircle } from "lucide-react";
import { cn } from "@/lib/utils";

interface EntryResult {
  groupName: string;
  rank1Correct: boolean;
  rank2Correct: boolean;
  rank3Correct: boolean;
  rank4Correct: boolean;
  points: number;
}

interface PredictionScoreCardProps {
  userName: string;
  totalScore: number;
  entries: EntryResult[];
  isCurrentUser?: boolean;
}

export default function PredictionScoreCard({
  userName,
  totalScore,
  entries,
  isCurrentUser = false,
}: PredictionScoreCardProps) {
  return (
    <div
      className={cn(
        "bg-sblt-card border rounded-xl p-5 transition-all",
        isCurrentUser ? "border-sblt-red" : "border-sblt-border"
      )}
    >
      <div className="flex items-center justify-between mb-3">
        <div className="flex items-center gap-2">
          <span className="text-white font-bold">{userName}</span>
          {isCurrentUser && (
            <span className="text-[10px] bg-sblt-red/10 text-red-400 px-2 py-0.5 rounded-full">
              Bạn
            </span>
          )}
        </div>
        <span className="text-lg font-bold text-sblt-red">{totalScore} điểm</span>
      </div>

      <div className="space-y-2">
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
    </div>
  );
}
