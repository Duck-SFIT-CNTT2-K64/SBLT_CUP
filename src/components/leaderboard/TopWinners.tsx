"use client";

import { Trophy } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { cn } from "@/lib/utils";

interface TopWinner {
  id: string;
  name: string;
  avatar?: string | null;
  score: number;
  rank: number;
}

interface TopWinnersProps {
  winners: TopWinner[];
  scoreLabel?: string;
}

const RANK_CONFIG: Record<number, { border: string; bg: string; avatarSize: "xl" | "lg"; glow: string }> = {
  1: {
    border: "border-yellow-500/40",
    bg: "bg-yellow-500/5",
    avatarSize: "xl",
    glow: "shadow-[0_0_30px_rgba(234,179,8,0.1)]",
  },
  2: {
    border: "border-slate-400/30",
    bg: "bg-slate-400/5",
    avatarSize: "lg",
    glow: "",
  },
  3: {
    border: "border-orange-500/30",
    bg: "bg-orange-500/5",
    avatarSize: "lg",
    glow: "",
  },
  4: {
    border: "border-[#333]",
    bg: "bg-[#111]",
    avatarSize: "lg",
    glow: "",
  },
};

const RANK_BADGE_COLORS: Record<number, string> = {
  1: "bg-yellow-500/20 text-yellow-400 border-yellow-500/30",
  2: "bg-slate-400/20 text-slate-300 border-slate-400/30",
  3: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  4: "bg-[#222] text-[#888] border-[#333]",
};

export default function TopWinners({ winners, scoreLabel = "điểm" }: TopWinnersProps) {
  if (winners.length === 0) return null;

  return (
    <div className="mb-8">
      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 md:gap-4">
        {winners.map((winner) => {
          const config = RANK_CONFIG[winner.rank] || RANK_CONFIG[4];
          const badgeColor = RANK_BADGE_COLORS[winner.rank] || RANK_BADGE_COLORS[4];

          return (
            <div
              key={winner.id}
              className={cn(
                "relative flex flex-col items-center p-5 rounded-2xl border transition-all",
                config.border,
                config.bg,
                config.glow
              )}
            >
              {/* Rank badge */}
              <div className={cn(
                "absolute -top-2.5 left-1/2 -translate-x-1/2 flex items-center justify-center w-7 h-7 rounded-full border text-xs font-bold",
                badgeColor
              )}>
                {winner.rank === 1 ? (
                  <Trophy className="h-3.5 w-3.5" />
                ) : (
                  winner.rank
                )}
              </div>

              {/* Avatar */}
              <div className="mt-2 mb-3">
                <Avatar
                  name={winner.name}
                  src={winner.avatar ?? undefined}
                  size={config.avatarSize}
                />
              </div>

              {/* Name */}
              <p className={cn(
                "text-sm font-semibold text-center truncate max-w-full",
                winner.rank === 1 ? "text-yellow-400" : "text-[#f5f5f5]"
              )}>
                {winner.name}
              </p>

              {/* Score */}
              <p className={cn(
                "text-lg font-black tabular-nums mt-1",
                winner.rank === 1 ? "text-yellow-400" : "text-[#dc2626]"
              )}
                style={{ fontFamily: "var(--font-heading)" }}
              >
                {winner.score}
                <span className="text-xs font-normal text-[#888] ml-1">{scoreLabel}</span>
              </p>
            </div>
          );
        })}
      </div>
    </div>
  );
}
