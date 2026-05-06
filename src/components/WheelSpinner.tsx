"use client";

import { useState, useRef, useCallback } from "react";

interface WheelItem {
  id: string;
  label: string;
}

interface Group {
  id: string;
  name: string;
  currentCount: number;
}

interface Assignment {
  guestId: string;
  guestName: string;
  groupId: string;
  groupName: string;
}

interface WheelSpinnerProps {
  items: WheelItem[];
  groups: Group[];
  onAssignmentsComplete: (assignments: { groupId: string; guestIds: string[] }[]) => void;
  onCancel: () => void;
}

const COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#d97706",
  "#7c3aed", "#db2777", "#0891b2", "#65a30d",
  "#ea580c", "#4f46e5", "#059669", "#ca8a04",
  "#9333ea", "#e11d48", "#0284c7", "#84cc16",
];

export default function WheelSpinner({ items, groups, onAssignmentsComplete, onCancel }: WheelSpinnerProps) {
  const [remaining, setRemaining] = useState<WheelItem[]>(items);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [spinning, setSpinning] = useState(false);
  const [rotation, setRotation] = useState(0);
  const [winner, setWinner] = useState<WheelItem | null>(null);
  const [showGroupPicker, setShowGroupPicker] = useState(false);
  const wheelRef = useRef<HTMLDivElement>(null);

  const segmentAngle = remaining.length > 0 ? 360 / remaining.length : 360;

  const spin = useCallback(() => {
    if (spinning || remaining.length === 0) return;
    setSpinning(true);
    setWinner(null);
    setShowGroupPicker(false);

    // Random winner
    const winnerIndex = Math.floor(Math.random() * remaining.length);

    // Calculate rotation: multiple full spins + land on winner
    const fullSpins = 5 + Math.floor(Math.random() * 3); // 5-7 full spins
    const targetAngle = 360 - (winnerIndex * segmentAngle + segmentAngle / 2);
    const newRotation = rotation + fullSpins * 360 + targetAngle;

    setRotation(newRotation);

    // Wait for animation to complete
    setTimeout(() => {
      setSpinning(false);
      setWinner(remaining[winnerIndex]);
      setShowGroupPicker(true);
    }, 4000);
  }, [spinning, remaining, rotation, segmentAngle]);

  const assignToGroup = useCallback((groupId: string, groupName: string) => {
    if (!winner) return;

    const newAssignment: Assignment = {
      guestId: winner.id,
      guestName: winner.label,
      groupId,
      groupName,
    };

    const newAssignments = [...assignments, newAssignment];
    setAssignments(newAssignments);
    setRemaining((prev) => prev.filter((item) => item.id !== winner.id));
    setWinner(null);
    setShowGroupPicker(false);

    // If all guests assigned, call complete
    if (remaining.length === 1) {
      const grouped = new Map<string, string[]>();
      for (const a of newAssignments) {
        if (!grouped.has(a.groupId)) grouped.set(a.groupId, []);
        grouped.get(a.groupId)!.push(a.guestId);
      }
      onAssignmentsComplete(
        Array.from(grouped.entries()).map(([groupId, guestIds]) => ({ groupId, guestIds }))
      );
    }
  }, [winner, assignments, remaining.length, onAssignmentsComplete]);

  const getGroupCount = (groupId: string) => {
    const group = groups.find((g) => g.id === groupId);
    const assigned = assignments.filter((a) => a.groupId === groupId).length;
    return (group?.currentCount || 0) + assigned;
  };

  // Build conic gradient
  const buildGradient = () => {
    if (remaining.length === 0) return "#111111";
    const segments = remaining.map((_, i) => {
      const start = (i / remaining.length) * 360;
      const end = ((i + 1) / remaining.length) * 360;
      return `${COLORS[i % COLORS.length]} ${start}deg ${end}deg`;
    });
    return `conic-gradient(${segments.join(", ")})`;
  };

  return (
    <div className="flex flex-col lg:flex-row gap-6 items-start">
      {/* Left: Remaining guests */}
      <div className="w-full lg:w-48 shrink-0">
        <h4 className="text-sm font-semibold text-white mb-3">
          Chưa quay ({remaining.length})
        </h4>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {remaining.map((item, i) => (
            <div
              key={item.id}
              className="flex items-center gap-2 px-3 py-1.5 bg-sblt-dark rounded-lg text-sm"
            >
              <span
                className="w-3 h-3 rounded-full shrink-0"
                style={{ backgroundColor: COLORS[i % COLORS.length] }}
              />
              <span className="text-sblt-white truncate">{item.label}</span>
            </div>
          ))}
        </div>
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
            {/* Segment labels */}
            {remaining.map((item, i) => {
              const angle = i * segmentAngle + segmentAngle / 2;
              const rad = (angle * Math.PI) / 180;
              const radius = 35; // % from center
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
            <p className="text-xl font-bold text-white mb-4">{winner.label}</p>
            <p className="text-xs text-sblt-muted mb-3">Chọn bảng cho khách mời này:</p>
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

      {/* Right: Assigned guests */}
      <div className="w-full lg:w-56 shrink-0">
        <h4 className="text-sm font-semibold text-white mb-3">
          Đã phân bổ ({assignments.length})
        </h4>
        <div className="space-y-1 max-h-80 overflow-y-auto">
          {assignments.map((a) => (
            <div
              key={a.guestId}
              className="flex items-center justify-between px-3 py-1.5 bg-sblt-dark rounded-lg text-sm"
            >
              <span className="text-sblt-white truncate">{a.guestName}</span>
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
      </div>
    </div>
  );
}
