"use client";

import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Trophy, Medal, Star, X } from "lucide-react";

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

const RANK_CONFIG = [
  { key: "rank1PlayerId" as const, label: "Top 1", points: 10, icon: Trophy, color: "text-yellow-400", bg: "bg-yellow-500/10 border-yellow-500/30" },
  { key: "rank2PlayerId" as const, label: "Top 2", points: 10, icon: Medal, color: "text-gray-300", bg: "bg-gray-400/10 border-gray-400/30" },
  { key: "rank3PlayerId" as const, label: "Top 3", points: 10, icon: Medal, color: "text-amber-600", bg: "bg-amber-600/10 border-amber-600/30" },
  { key: "rank4PlayerId" as const, label: "Top 4", points: 10, icon: Star, color: "text-blue-400", bg: "bg-blue-500/10 border-blue-500/30" },
];

export default function PredictionGroupForm({
  group,
  existingEntries,
  locked,
  onChange,
}: PredictionGroupFormProps) {
  const [selections, setSelections] = useState<RankSlots>({
    rank1PlayerId: existingEntries?.rank1PlayerId || "",
    rank2PlayerId: existingEntries?.rank2PlayerId || "",
    rank3PlayerId: existingEntries?.rank3PlayerId || "",
    rank4PlayerId: existingEntries?.rank4PlayerId || "",
  });
  const [selectingSlot, setSelectingSlot] = useState<keyof RankSlots | null>(null);

  useEffect(() => {
    if (existingEntries) {
      setSelections(existingEntries);
    }
  }, [existingEntries]);

  const selectedPlayerIds = new Set(Object.values(selections).filter(Boolean));

  const handleSlotClick = (slot: keyof RankSlots) => {
    if (locked) return;
    if (selections[slot]) {
      // Clear slot
      const next = { ...selections, [slot]: "" };
      setSelections(next);
      setSelectingSlot(null);
      onChange(group.id, next);
    } else {
      setSelectingSlot(slot);
    }
  };

  const handlePlayerClick = (playerId: string) => {
    if (locked || !selectingSlot) return;
    if (selectedPlayerIds.has(playerId)) return; // Already selected in another slot

    const next = { ...selections, [selectingSlot]: playerId };
    setSelections(next);
    setSelectingSlot(null);
    onChange(group.id, next);
  };

  const isComplete = Object.values(selections).every(Boolean);

  return (
    <div className={cn("bg-[#111] border border-[#222] rounded-xl p-5", isComplete && "border-green-800/50")}>
      <div className="flex items-center justify-between mb-4">
        <h4 className="text-[#f5f5f5] font-bold text-lg">{group.name}</h4>
        {isComplete && (
          <span className="text-xs text-green-400 bg-green-500/10 px-2 py-1 rounded-full">
            Hoàn thành
          </span>
        )}
      </div>

      {/* Rank slots */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
        {RANK_CONFIG.map(({ key, label, points, icon: Icon, color, bg }) => {
          const selectedId = selections[key];
          const selectedPlayer = group.players.find((p) => p.id === selectedId);
          const isSelecting = selectingSlot === key;

          return (
            <button
              key={key}
              type="button"
              disabled={locked}
              onClick={() => handleSlotClick(key)}
              className={cn(
                "relative flex flex-col items-center justify-center p-3 rounded-lg border-2 border-dashed transition-all min-h-[80px]",
                isSelecting
                  ? "border-[#dc2626] bg-[#dc2626]/10 animate-pulse"
                  : selectedPlayer
                    ? bg
                    : "border-[#222] hover:border-[#888]",
                locked && "opacity-60 cursor-not-allowed"
              )}
            >
              <Icon className={cn("h-5 w-5 mb-1", color)} />
              <span className="text-xs text-[#888]">{label}</span>
              <span className="text-xs text-[#888]">({points}đ)</span>
              {selectedPlayer ? (
                <div className="mt-1 flex items-center gap-1">
                  <span className="text-sm text-[#f5f5f5] font-medium truncate max-w-[80px]">
                    {selectedPlayer.ign}
                  </span>
                  {!locked && <X className="h-3 w-3 text-[#888]" />}
                </div>
              ) : isSelecting ? (
                <span className="text-xs text-[#dc2626] mt-1">Chọn bên dưới</span>
              ) : null}
            </button>
          );
        })}
      </div>

      {/* Player list */}
      <div className="space-y-1">
        <p className="text-xs text-[#888] mb-2">
          {selectingSlot ? "Nhấn vào tuyển thủ để chọn:" : "Nhấn vào ô Top 1-4 ở trên, rồi chọn tuyển thủ:"}
        </p>
        {group.players.map((player) => {
          const isSelected = selectedPlayerIds.has(player.id);
          const isSelectable = selectingSlot && !isSelected;

          return (
            <button
              key={player.id}
              type="button"
              disabled={locked || !isSelectable}
              onClick={() => handlePlayerClick(player.id)}
              className={cn(
                "w-full text-left px-3 py-2 rounded-lg text-sm transition-all flex items-center gap-2",
                isSelected
                  ? "bg-[#dc2626]/10 text-[#f5f5f5] border border-[#dc2626]/30"
                  : isSelectable
                    ? "bg-[#111] hover:bg-[#222] text-[#f5f5f5] cursor-pointer"
                    : "bg-[#111] text-[#888]",
                locked && "opacity-60"
              )}
            >
              <span className="flex-1">{player.ign}</span>
              {player.isGuest && (
                <span className="text-xs bg-[#dc2626]/10 text-red-400 px-1.5 py-0.5 rounded">
                  Khách mời
                </span>
              )}
              {isSelected && (
                <span className="text-xs text-[#dc2626]">Đã chọn</span>
              )}
            </button>
          );
        })}
      </div>
    </div>
  );
}
