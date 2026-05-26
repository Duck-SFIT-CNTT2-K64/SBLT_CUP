"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle, Users } from "lucide-react";
import { Avatar } from "@/components/ui/Avatar";
import { getRatingColor, getRatingBgColor } from "@/lib/rating";

interface Player {
  id: string;
  ign: string;
  isGuest: boolean;
  rank: string | null;
  avatar: string | null;
  rating: number | null;
  totalGames: number;
  top4Rate: number | null;
}

interface RankSlots {
  rank1PlayerId: string;
  rank2PlayerId: string;
  rank3PlayerId: string;
  rank4PlayerId: string;
}

interface PredictionGroupFormProps {
  group: {
    id: string;
    name: string;
    players: Player[];
  };
  existingEntries?: RankSlots | null;
  locked: boolean;
  onChange: (groupId: string, entries: RankSlots) => void;
}

export default function PredictionGroupForm({
  group,
  existingEntries,
  locked,
  onChange,
}: PredictionGroupFormProps) {
  const toIds = (e: RankSlots | null | undefined) =>
    e
      ? [e.rank1PlayerId, e.rank2PlayerId, e.rank3PlayerId, e.rank4PlayerId].filter(Boolean)
      : [];

  const [selectedIds, setSelectedIds] = useState<string[]>(() => toIds(existingEntries));

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect -- legitimate prop-to-state sync
    setSelectedIds(toIds(existingEntries));
  }, [existingEntries]);

  const isComplete = selectedIds.length === 4;
  const progress = selectedIds.length;

  const handleToggle = (playerId: string) => {
    if (locked) return;

    let next: string[];
    if (selectedIds.includes(playerId)) {
      next = selectedIds.filter((id) => id !== playerId);
    } else if (selectedIds.length < 4) {
      next = [...selectedIds, playerId];
    } else {
      return;
    }

    setSelectedIds(next);
    onChange(group.id, {
      rank1PlayerId: next[0] || "",
      rank2PlayerId: next[1] || "",
      rank3PlayerId: next[2] || "",
      rank4PlayerId: next[3] || "",
    });
  };

  return (
    <div
      className={cn(
        "relative overflow-hidden rounded-2xl border bg-[#111] transition-all",
        isComplete
          ? "border-green-500/30 shadow-[0_0_20px_rgba(34,197,94,0.08)]"
          : "border-[#222]"
      )}
    >
      {/* Top accent bar */}
      <div
        className={cn(
          "absolute top-0 left-0 right-0 h-0.5 transition-colors",
          isComplete ? "bg-gradient-to-r from-green-500 via-emerald-400 to-green-500" : "bg-gradient-to-r from-transparent via-[#dc2626]/20 to-transparent"
        )}
      />

      {/* Header */}
      <div className="p-5 pb-4">
        <div className="flex items-center justify-between mb-3">
          <h4 className="sblt-heading text-xl text-[#f5f5f5] tracking-wider">{group.name}</h4>
          <div className="flex items-center gap-2">
            {isComplete && (
              <span className="inline-flex items-center gap-1 text-[11px] text-green-400 bg-green-500/10 border border-green-500/25 px-2 py-0.5 rounded-md font-semibold">
                <CheckCircle className="h-3 w-3" />
                Hoàn thành
              </span>
            )}
          </div>
        </div>

        {/* Progress bar */}
        <div className="flex items-center gap-3">
          <div className="flex-1 h-1.5 rounded-full bg-[#222] overflow-hidden">
            <div
              className={cn(
                "h-full rounded-full transition-all duration-500",
                isComplete
                  ? "bg-gradient-to-r from-green-500 to-emerald-400"
                  : "bg-gradient-to-r from-[#dc2626] to-red-400"
              )}
              style={{ width: `${(progress / 4) * 100}%` }}
            />
          </div>
          <span className={cn(
            "text-xs font-bold tabular-nums",
            isComplete ? "text-green-400" : "text-[#888]"
          )}>
            {progress}/4
          </span>
        </div>
      </div>

      {/* Slot preview */}
      <div className="px-5 pb-4">
        <div className="grid grid-cols-4 gap-2">
          {[0, 1, 2, 3].map((i) => {
            const playerId = selectedIds[i];
            const player = playerId ? group.players.find((p) => p.id === playerId) : null;

            return (
              <div
                key={i}
                className={cn(
                  "relative flex flex-col items-center justify-center p-3 rounded-xl border min-h-[72px] transition-all",
                  player
                    ? "border-[#dc2626]/30 bg-[#dc2626]/5 shadow-[0_0_12px_rgba(220,38,38,0.1)]"
                    : "border-dashed border-[#333] bg-[#0d0d0d]"
                )}
              >
                <span className={cn(
                  "absolute top-1.5 left-2 text-[10px] font-bold",
                  player ? "text-[#dc2626]" : "text-[#333]"
                )}>
                  {i + 1}
                </span>
                {player ? (
                  <div className="flex flex-col items-center mt-1">
                    <span className="text-xs text-[#f5f5f5] font-semibold text-center truncate max-w-full">
                      {player.ign}
                    </span>
                    {player.rating !== null && (
                      <span className={cn("text-[10px] font-bold tabular-nums", getRatingColor(player.rating))}>
                        {player.rating}
                      </span>
                    )}
                  </div>
                ) : (
                  <Users className="h-4 w-4 text-[#333]" />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Player list */}
      <div className="px-5 pb-5">
        <p className="text-[11px] uppercase tracking-[0.2em] text-[#888] mb-3 font-medium">
          {locked
            ? "Dự đoán đã bị khóa"
            : isComplete
              ? "Đã chọn đủ 4 người — nhấn để bỏ chọn"
              : "Chọn 4 người bạn nghĩ sẽ đi tiếp"}
        </p>
        <div className="space-y-1">
          {group.players.map((player, idx) => {
            const isSelected = selectedIds.includes(player.id);
            const canSelect = !locked && (isSelected || selectedIds.length < 4);

            return (
              <button
                key={player.id}
                type="button"
                disabled={locked || !canSelect}
                onClick={() => handleToggle(player.id)}
                className={cn(
                  "group w-full text-left px-3 py-2.5 rounded-xl text-sm transition-all flex items-center gap-3 relative overflow-hidden",
                  isSelected
                    ? "bg-[#dc2626]/8 text-[#f5f5f5] border border-[#dc2626]/25"
                    : canSelect
                      ? "bg-[#0d0d0d] hover:bg-[#1a1a1a] text-[#f5f5f5] cursor-pointer border border-transparent hover:border-[#333]"
                      : "bg-[#0d0d0d] text-[#555] opacity-40 cursor-not-allowed border border-transparent",
                  locked && "opacity-50 cursor-not-allowed"
                )}
              >
                {/* Left accent bar for selected */}
                {isSelected && (
                  <div className="absolute left-0 top-0 bottom-0 w-1 bg-[#dc2626] rounded-l-xl" />
                )}

                {/* Row number */}
                <span className={cn(
                  "text-[10px] font-bold w-4 text-center tabular-nums",
                  isSelected ? "text-[#dc2626]" : "text-[#444]"
                )}>
                  {idx + 1}
                </span>

                <Avatar name={player.ign} src={player.avatar ?? undefined} size="sm" />

                <div className="flex-1 min-w-0 flex items-center gap-1.5">
                  <span className="truncate text-sm">{player.ign}</span>
                  {player.rank && (
                    <span className="text-[10px] text-[#888] shrink-0 hidden sm:inline">{player.rank}</span>
                  )}
                </div>

                {player.rating !== null ? (
                  <span className={cn(
                    "text-xs font-bold tabular-nums px-1.5 py-0.5 rounded shrink-0",
                    getRatingBgColor(player.rating)
                  )}>
                    {player.rating}
                  </span>
                ) : (
                  <span className="text-[10px] bg-[#222] text-[#666] px-1.5 py-0.5 rounded shrink-0">
                    Mới
                  </span>
                )}

                {player.top4Rate !== null && (
                  <span className="text-[10px] text-[#888] tabular-nums shrink-0 hidden sm:inline">
                    {player.top4Rate}%
                  </span>
                )}

                {player.isGuest && (
                  <span className="text-[10px] bg-amber-500/10 text-amber-400 border border-amber-500/20 px-1.5 py-0.5 rounded font-medium">
                    Khách mời
                  </span>
                )}

                {isSelected && (
                  <span className="flex items-center gap-1 text-[11px] text-[#dc2626] font-semibold">
                    <CheckCircle className="h-3.5 w-3.5" />
                    Đã chọn
                  </span>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
