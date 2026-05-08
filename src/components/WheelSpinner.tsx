"use client";

import { useState, useRef, useCallback } from "react";
import { X, Plus } from "lucide-react";

interface WheelItem {
  id: string;
  label: string;
  type?: "advancing" | "guest";
  fromGroup?: string;
}

interface Group {
  id: string;
  name: string;
  currentCount: number;
}

interface Assignment {
  playerId: string;
  playerName: string;
  groupId: string;
  groupName: string;
}

interface WheelSpinnerProps {
  items: WheelItem[];
  groups: Group[];
  onAssignmentsComplete: (assignments: { groupId: string; playerIds: string[] }[]) => void;
  onCancel: () => void;
  onAddItem?: (label: string) => void;
  addableItems?: { id: string; label: string }[];
}

const COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#d97706",
  "#7c3aed", "#db2777", "#0891b2", "#65a30d",
  "#ea580c", "#4f46e5", "#059669", "#ca8a04",
  "#9333ea", "#e11d48", "#0284c7", "#84cc16",
];

export default function WheelSpinner({ items, groups, onAssignmentsComplete, onCancel, onAddItem, addableItems }: WheelSpinnerProps) {
  const [remaining, setRemaining] = useState<WheelItem[]>(items);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const [addSearch, setAddSearch] = useState("");
  const [showAddDropdown, setShowAddDropdown] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = remaining.length > 0 ? 360 / remaining.length : 360;

  const spin = useCallback(() => {
    if (spinning || remaining.length === 0) return;
    setSpinning(true);
    setWinner(null);
    setShowGroupPicker(false);

    const winnerIndex = Math.floor(Math.random() * remaining.length);
    const fullSpins = 5 + Math.floor(Math.random() * 3);
    const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2);
    const newRotation = rotation + fullSpins * 360 + targetAngle;

    setRotation(newRotation);

    setTimeout(() => {
      setSpinning(false);
      setWinner(remaining[winnerIndex]);
      setShowGroupPicker(true);
    }, 4000);
  }, [spinning, remaining, rotation, segmentAngle]);

  const assignToGroup = useCallback((groupId: string, groupName: string) => {
    if (!winner) return;

    const newAssignment: Assignment = {
      playerId: winner.id,
      playerName: winner.label,
      groupId,
      groupName,
    };

    const newAssignments = [...assignments, newAssignment];
    setAssignments(newAssignments);
    setRemaining((prev) => prev.filter((item) => item.id !== winner.id));
    setWinner(null);
    setShowGroupPicker(false);

    if (remaining.length === 1) {
      const grouped = new Map<string, string[]>();
      for (const a of newAssignments) {
        if (!grouped.has(a.groupId)) grouped.set(a.groupId, []);
        grouped.get(a.groupId)!.push(a.playerId);
      }
      onAssignmentsComplete(
        Array.from(grouped.entries()).map(([groupId, playerIds]) => ({ groupId, playerIds }))
      );
    }
  }, [winner, assignments, remaining.length, onAssignmentsComplete]);

  const removeItem = (id: string) => {
    setRemaining((prev) => prev.filter((item) => item.id !== id));
  };

  const handleAddFromDropdown = (item: { id: string; label: string }) => {
    if (remaining.find((r) => r.id === item.id)) return;
    setRemaining((prev) => [...prev, { id: item.id, label: item.label }]);
    setAddSearch("");
    setShowAddDropdown(false);
  };

  const getGroupCount = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    const assigned = assignments.filter((a) => a.groupId === groupId).length;
    return (group?.currentCount || 0) + assigned;
  };

  const buildGradient = () => {
    if (remaining.length === 0) return "#111111";
    const segments = remaining.map((_, i) => {
      const start = (i / remaining.length) * 360;
      const end = ((i + 1) / remaining.length) * 360;
      return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  };

  const filteredAddable = (addableItems || []).filter(
    (item) =>
      !remaining.find((r) => r.id === item.id) &&
      !assignments.find((a) => a.playerId === item.id) &&
      item.label.toLowerCase().includes(addSearch.toLowerCase())
  );

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left: Remaining items */}
      <div className="w-full lg:w-56 shrink-0">
        <h4 className="text-sm font-semibold text-white mb-3">
          Chưa quay ({remaining.length})
        </h4>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {remaining.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-sblt-dark rounded-lg text-sm group"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-sblt-white truncate flex-1">{item.label}</span>
              {item.type === "advancing" && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-green-500/20 text-green-400 shrink-0">
                  Đi tiếp{item.fromGroup ? ` ${item.fromGroup}` : ""}
                </span>
              )}
              {item.type === "guest" && (
                <span className="text-xs px-1.5 py-0.5 rounded bg-sblt-red/20 text-sblt-red shrink-0">
                  Khách
                </span>
              )}
              <button
                onClick={() => removeItem(item.id)}
                className="opacity-0 group-hover:opacity-100 text-sblt-muted hover:text-red-400 transition-all shrink-0"
                title="Xóa khỏi vòng quay"
              >
                <X className="h-3 w-3" />
              </button>
            </div>
          ))}
          {remaining.length === 0 && (
            <p className="text-xs text-sblt-muted">Đã hết</p>
          )}
        </div>

        {/* Add player input */}
        {addableItems && addableItems.length > 0 && (
          <div className="mt-3 relative">
            <div className="flex items-center gap-1">
              <Plus className="h-3 w-3 text-sblt-muted" />
              <input
                type="text"
                placeholder="Thêm tuyển thủ..."
                value={addSearch}
                onChange={(e) => { setAddSearch(e.target.value); setShowAddDropdown(true); }}
                onFocus={() => setShowAddDropdown(true)}
                onBlur={() => setTimeout(() => setShowAddDropdown(false), 200)}
                className="bg-sblt-dark border border-sblt-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sblt-red w-full"
              />
            </div>
            {showAddDropdown && addSearch.length > 0 && filteredAddable.length > 0 && (
              <div className="absolute z-10 top-full mt-1 w-full bg-sblt-dark border border-sblt-border rounded-lg shadow-lg max-h-36 overflow-y-auto">
                {filteredAddable.slice(0, 10).map((item) => (
                  <button
                    key={item.id}
                    onMouseDown={(e) => { e.preventDefault(); handleAddFromDropdown(item); }}
                    className="w-full text-left px-3 py-1.5 text-xs text-white hover:bg-sblt-border transition-colors"
                  >
                    {item.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        )}
      </div>

      {/* Center: Wheel */}
      <div className="flex-1 flex flex-col items-center">
        <div className="relative mb-6">
          {/* Pointer */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-2 z-10">
            <div className="w-0 h-0 border-l-[12px] border-r-[12px] border-t-[20px] border-l-transparent border-r-transparent border-t-sblt-red" />
          </div>

          {/* Wheel */}
          <div
            ref={wheelRef}
            className="w-80 h-80 md:w-96 md:h-96 rounded-full border-4 border-sblt-border relative overflow-hidden"
            style={{
              background: buildGradient(),
              transform: `rotate(${rotation}deg)`,
              transition: spinning ? "transform 4s cubic-bezier(0.17, 0.67, 0.12, 0.99)" : "none",
            }}
          >
            {remaining.map((item, i) => {
              const angle = i * segmentAngle + segmentAngle / 2;
              const rad = (angle * Math.PI) / 180;
              const radius = 35;
              const x = 50 + radius * Math.sin(rad);
              const y = 50 - radius * Math.cos(rad);

              return (
                <div
                  key={item.id}
                  className="absolute text-xs font-bold text-white drop-shadow-md pointer-events-none"
                  style={{
                    left: `${x}%`,
                    top: `${y}%`,
                    transform: `translate(-50%, -50%) rotate(${angle}deg)`,
                    textShadow: "1px 1px 2px rgba(0,0,0,0.8)",
                    maxWidth: "80px",
                    textAlign: "center",
                    lineHeight: 1.2,
                  }}
                >
                  {item.label}
                </div>
              );
            })}

            {/* Center circle */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-16 h-16 bg-sblt-dark border-2 border-sblt-border rounded-full z-10" />
          </div>
        </div>

        {/* Spin button */}
        <button
          onClick={spin}
          disabled={spinning || remaining.length === 0 || showGroupPicker}
          className="bg-sblt-red hover:bg-sblt-red-dark text-white font-bold text-lg px-8 py-3 rounded-xl transition-all disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-sblt-red/30"
        >
          {spinning ? "Đang quay..." : remaining.length === 0 ? "Đã hết" : "QUAY"}
        </button>

        {/* Winner popup */}
        {showGroupPicker && winner && (
          <div className="mt-4 bg-sblt-card border border-sblt-red rounded-xl p-4 text-center w-full max-w-md">
            <p className="text-sblt-muted text-sm mb-1">Trúng tuyển!</p>
            <p className="text-xl font-bold text-white mb-2">{winner.label}</p>
            {winner.type === "advancing" && (
              <p className="text-xs text-green-400 mb-2">Người đi tiếp{winner.fromGroup ? ` từ ${winner.fromGroup}` : ""}</p>
            )}
            {winner.type === "guest" && (
              <p className="text-xs text-sblt-red mb-2">Khách mời</p>
            )}
            <p className="text-xs text-sblt-muted mb-3">Chọn bảng:</p>
            <div className="grid grid-cols-2 gap-2">
              {groups.map((group) => {
                const count = getGroupCount(group.id);
                const isFull = count >= 8;
                return (
                  <button
                    key={group.id}
                    onClick={() => assignToGroup(group.id, group.name)}
                    disabled={isFull}
                    className={`px-4 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      isFull
                        ? "bg-sblt-dark text-sblt-border cursor-not-allowed"
                        : "bg-sblt-dark hover:bg-sblt-red/20 hover:border-sblt-red text-white border border-sblt-border"
                    }`}
                  >
                    {group.name}
                    <span className="text-xs text-sblt-muted ml-1">({count}/8)</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* Right: Assigned items */}
      <div className="w-full lg:w-56 shrink-0">
        <h4 className="text-sm font-semibold text-white mb-3">
          Đã phân bổ ({assignments.length})
        </h4>
        <div className="space-y-1 max-h-60 overflow-y-auto">
          {assignments.map((a) => (
            <div
              key={a.playerId}
              className="flex items-center justify-between px-3 py-1.5 bg-sblt-dark rounded-lg text-sm"
            >
              <span className="text-sblt-white truncate">{a.playerName}</span>
              <span className="text-sblt-red font-medium text-xs shrink-0 ml-2">{a.groupName}</span>
            </div>
          ))}
          {assignments.length === 0 && (
            <p className="text-xs text-sblt-muted">Chưa có ai</p>
          )}
        </div>

        {/* Group summary */}
        <div className="mt-4 pt-4 border-t border-sblt-border">
          <h4 className="text-xs text-sblt-muted mb-2">Tổng kết bảng</h4>
          {groups.map((group) => {
            const count = getGroupCount(group.id);
            return (
              <div key={group.id} className="flex items-center justify-between text-xs py-1">
                <span className="text-sblt-white">{group.name}</span>
                <span className={count >= 8 ? "text-red-400" : "text-sblt-muted"}>{count}/8</span>
              </div>
            );
          })}
        </div>

        {/* Cancel button */}
        <button
          onClick={onCancel}
          className="mt-4 w-full text-sm text-sblt-muted hover:text-white py-2 rounded-lg border border-sblt-border hover:bg-sblt-dark transition-colors"
        >
          Hủy
        </button>
      </div>
    </div>
  );
}
