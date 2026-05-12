"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";
import { CheckCircle } from "lucide-react";

interface Player {
  id: string;
  ign: string;
  isGuest: boolean;
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
  // Chuyển đổi từ RankSlots sang array để dễ quản lý
  const [selectedIds, setSelectedIds] = useState<string[]>(() => {
    if (!existingEntries) return [];
    return [
      existingEntries.rank1PlayerId,
      existingEntries.rank2PlayerId,
      existingEntries.rank3PlayerId,
      existingEntries.rank4PlayerId,
    ].filter(Boolean);
  });

  useEffect(() => {
    if (!existingEntries) {
      setSelectedIds([]);
      return;
    }

    setSelectedIds([
      existingEntries.rank1PlayerId,
      existingEntries.rank2PlayerId,
      existingEntries.rank3PlayerId,
      existingEntries.rank4PlayerId,
    ].filter(Boolean));
  }, [existingEntries]);

  const isComplete = selectedIds.length === 4;

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
    <div className={cn("bg-[#111] border border-[#222] rounded-xl p-5", isComplete && "border-green-800/50")}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[#f5f5f5] font-bold text-lg">{group.name}</h4>
        <div className="flex items-center gap-2">
          <span className={cn(
            "text-xs px-2 py-1 rounded-full",
            isComplete
              ? "text-green-400 bg-green-500/10"
              : "text-[#888] bg-[#222]"
          )}>
            {selectedIds.length}/4
          </span>
          {isComplete && (
            <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
              Hoàn thành
            </span>
          )}
        </div>
      </div>

      {/* Selected slots preview */}
      <div className="grid grid-cols-4 gap-2 mb-4">
        {[0, 1, 2, 3].map((i) => {
          const playerId = selectedIds[i];
          const player = playerId ? group.players.find((p) => p.id === playerId) : null;

          return (
            <div
              key={i}
              className={cn(
                "flex flex-col items-center justify-center p-2 rounded-lg border-2 border-dashed min-h-[64px] transition-all",
                player
                  ? "border-[#dc2626]/30 bg-[#dc2626]/5"
                  : "border-[#222]"
              )}
            >
              <span className={cn(
                "text-xs font-bold mb-1",
                player ? "text-[#dc2626]" : "text-[#444]"
              )}>
                {i + 1}
              </span>
              {player ? (
                <span className="text-xs text-[#f5f5f5] font-medium text-center truncate max-w-full">
                  {player.ign}
                </span>
              ) : (
                <span className="text-xs text-[#444]">Trống</span>
              )}
            </div>
          );
        })}
      </div>

      {/* Player list - click to toggle */}
      <div className="space-y-1">
        <p className="text-xs text-[#888] mb-2">
          {locked
            ? "Dự đoán đã bị khóa."
            : isComplete
              ? "Đã chọn đủ 4 người. Nhấn để bỏ chọn."
              : "Chọn 4 người bạn nghĩ sẽ đi tiếp:"}
        </p>
        {group.players.map((player) => {
          const isSelected = selectedIds.includes(player.id);
          const canSelect = !locked && (isSelected || selectedIds.length < 4);

          return (
            <button
              key={player.id}
              type="button"
              disabled={locked || !canSelect}
              onClick={() => handleToggle(player.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                isSelected
                  ? "bg-[#dc2626]/10 text-[#f5f5f5] border border-[#dc2626]/30"
                  : canSelect
                    ? "bg-[#111] hover:bg-[#222] text-[#f5f5f5] cursor-pointer"
                    : "bg-[#111] text-[#555] opacity-50 cursor-not-allowed",
                locked && "opacity-60 cursor-not-allowed"
              )}
            >
              <span className="flex-1">{player.ign}</span>
              {player.isGuest && (
                <span className="text-xs bg-[#dc2626]/10 text-red-400 px-1.5 py-0.5 rounded">
                  Khách mời
                </span>
              )}
              {isSelected && (
                <span className="flex items-center gap-1 text-xs text-[#dc2626]">
                  <CheckCircle className="h-3 w-3" />
                  Đã chọn
                </span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
