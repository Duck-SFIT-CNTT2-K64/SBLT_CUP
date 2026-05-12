"use client";

import { CheckCircle, XCircle, ChevronDown, ChevronUp, Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

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
  userAvatar?: string | null;
  totalScore: number;
  entries: EntryResult[];
  rank?: number;
  isCurrentUser?: boolean;
  expanded?: boolean;
  onToggle?: () => void;
}

function RankDisplay({ rank }: { rank: number }) {
  if (rank === 1) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-7 w-7 rounded-lg bg-yellow-500/10 border border-yellow-500/25 flex items-center justify-center">
          <Trophy className="h-4 w-4 text-yellow-400" />
        </div>
        <span className="text-yellow-400 text-sm font-bold" style={{ fontFamily: "var(--font-heading)" }}>#1</span>
      </div>
    );
  }
  if (rank === 2) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-7 w-7 rounded-lg bg-slate-300/10 border border-slate-400/25 flex items-center justify-center">
          <span className="text-slate-300 text-xs font-bold">2</span>
        </div>
      </div>
    );
  }
  if (rank === 3) {
    return (
      <div className="flex items-center gap-1.5">
        <div className="h-7 w-7 rounded-lg bg-orange-500/10 border border-orange-500/25 flex items-center justify-center">
          <span className="text-orange-400 text-xs font-bold">3</span>
        </div>
      </div>
    );
  }
  return <span className="text-[#555] text-sm font-medium w-8 text-center" style={{ fontFamily: "var(--font-heading)" }}>#{rank}</span>;
}

const RANK_BORDER: Record<number, string> = {
  1: "border-l-yellow-500",
  2: "border-l-slate-400",
  3: "border-l-orange-500",
};

export default function PredictionScoreCard({
  userName,
  userAvatar,
  totalScore,
  entries,
  rank,
  isCurrentUser = false,
  expanded = false,
  onToggle,
}: PredictionScoreCardProps) {
  const rankBorder = rank ? RANK_BORDER[rank] : undefined;

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#111] transition-all cursor-pointer border-l-[3px]",
        isCurrentUser
          ? "border-[#dc2626]/40 border-l-[#dc2626] shadow-[0_0_20px_rgba(220,38,38,0.06)]"
          : "border-[#222] border-l-[#333]",
        rankBorder,
        expanded && "border-[#333]"
      )}
      onClick={onToggle}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-5 pb-3">
        <div className="flex items-center gap-3">
          {rank !== undefined && <RankDisplay rank={rank} />}
          <Avatar name={userName} src={userAvatar ?? undefined} size="md" />
          <div>
            <span className={cn(
              "font-bold text-[15px]",
              isCurrentUser ? "text-[#dc2626]" : "text-[#f5f5f5]"
            )}>
              {userName}
            </span>
            {isCurrentUser && (
              <span className="ml-2 inline-flex items-center text-[10px] bg-[#dc2626]/10 text-red-400 border border-[#dc2626]/20 px-1.5 py-0.5 rounded font-semibold">
                Bạn
              </span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-3">
          <span
            className="text-xl font-black text-[#dc2626] tabular-nums"
            style={{ fontFamily: "var(--font-heading)" }}
          >
            {totalScore}
          </span>
          <span className="text-[#888] text-xs">điểm</span>
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
      <div className="px-5 pb-4 space-y-1.5">
        {entries.map((entry, idx) => (
          <div key={idx} className="flex items-center gap-3 text-sm">
            <span className="text-[#888] w-20 shrink-0 text-xs">{entry.groupName}</span>
            <div className="flex items-center gap-1">
              {[entry.slot1Correct, entry.slot2Correct, entry.slot3Correct, entry.slot4Correct].map(
                (correct, i) =>
                  correct ? (
                    <CheckCircle key={i} className="h-3.5 w-3.5 text-green-400" />
                  ) : (
                    <XCircle key={i} className="h-3.5 w-3.5 text-red-400/40" />
                  )
              )}
            </div>
            <span className="text-[#888] ml-auto text-xs font-medium tabular-nums">{entry.points}đ</span>
          </div>
        ))}
      </div>

      {/* Expanded detail */}
      {expanded && (
        <div className="border-t border-[#222] px-5 py-4 space-y-4">
          <p className="text-[11px] text-[#888] uppercase tracking-[0.2em] font-semibold">
            Chi tiết dự đoán
          </p>
          {entries.map((entry, idx) => (
            <div key={idx} className="rounded-xl bg-[#0d0d0d] border border-[#1a1a1a] p-4">
              <div className="flex items-center justify-between mb-3">
                <span className="text-[#f5f5f5] font-semibold text-sm">{entry.groupName}</span>
                <span
                  className="text-[#dc2626] text-sm font-bold tabular-nums"
                  style={{ fontFamily: "var(--font-heading)" }}
                >
                  {entry.points}đ
                </span>
              </div>

              <div className="grid grid-cols-2 gap-4 text-sm">
                {/* Predicted */}
                <div>
                  <p className="text-[10px] text-[#888] uppercase tracking-[0.15em] mb-2 font-medium">Dự đoán (4 người đi tiếp)</p>
                  <div className="space-y-1.5">
                    {entry.predictedPlayers.map((ign, i) => {
                      const correct = i === 0 ? entry.slot1Correct
                        : i === 1 ? entry.slot2Correct
                        : i === 2 ? entry.slot3Correct
                        : entry.slot4Correct;
                      return (
                        <div key={i} className={cn(
                          "flex items-center gap-2 px-2 py-1 rounded-lg",
                          correct ? "bg-green-500/5" : ""
                        )}>
                          <span className="text-[10px] text-[#555] w-4 text-center font-bold tabular-nums">{i + 1}</span>
                          <span className={cn(
                            "text-sm flex-1",
                            correct ? "text-green-400 font-medium" : "text-[#888]"
                          )}>
                            {ign}
                          </span>
                          {correct ? (
                            <CheckCircle className="h-3.5 w-3.5 text-green-400" />
                          ) : (
                            <XCircle className="h-3.5 w-3.5 text-red-400/40" />
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>

                {/* Actual */}
                <div>
                  <p className="text-[10px] text-[#888] uppercase tracking-[0.15em] mb-2 font-medium">Top 4 thực tế (đi tiếp)</p>
                  <div className="space-y-1.5">
                    {entry.actualResults.map((result, i) => (
                      <div key={i} className="flex items-center gap-2 px-2 py-1">
                        <span className="text-[10px] text-[#555] w-4 text-center font-bold tabular-nums">
                          {result.finalRank ?? (i + 1)}
                        </span>
                        <span className="text-[#f5f5f5] text-sm">{result.ign}</span>
                      </div>
                    ))}
                    {entry.actualResults.length === 0 && (
                      <span className="text-[#555] text-xs italic">Chưa có kết quả</span>
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
