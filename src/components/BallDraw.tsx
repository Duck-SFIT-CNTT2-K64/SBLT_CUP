"use client";

import { useState, useCallback, useMemo, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Shuffle, RotateCcw } from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

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

interface BallDrawProps {
  items: WheelItem[];
  groups: Group[];
  onAssignmentsComplete: (assignments: { groupId: string; playerIds: string[] }[]) => void;
  onCancel: () => void;
  addableItems?: { id: string; label: string }[];
}

// ─── Constants ────────────────────────────────────────────────────────────────

const BALL_COLORS = [
  "#dc2626", "#2563eb", "#16a34a", "#d97706",
  "#7c3aed", "#db2777", "#0891b2", "#65a30d",
  "#ea580c", "#4f46e5", "#059669", "#ca8a04",
  "#9333ea", "#e11d48", "#0284c7", "#84cc16",
];

type Phase = "SELECT_GROUP" | "READY" | "DRAWING" | "REVEALING";

// ─── Ball Positions ──────────────────────────────────────────────────────────

function generateBallPositions(count: number) {
  const positions: { x: number; y: number; rotation: number }[] = [];
  for (let i = 0; i < count; i++) {
    const row = Math.floor(i / 4);
    const col = i % 4;
    positions.push({
      x: 30 + col * 80 + (row % 2) * 40 + Math.random() * 20,
      y: 40 + row * 55 + Math.random() * 15,
      rotation: Math.random() * 30 - 15,
    });
  }
  return positions;
}

// ─── Sparkle Particles ───────────────────────────────────────────────────────

function Sparkles({ count = 15 }: { count?: number }) {
  const particles = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => ({
        id: i,
        x: (Math.random() - 0.5) * 400,
        y: (Math.random() - 0.5) * 400,
        delay: Math.random() * 0.3,
        size: 3 + Math.random() * 5,
        color: BALL_COLORS[Math.floor(Math.random() * BALL_COLORS.length)],
      })),
    [count],
  );

  return (
    <div className="absolute inset-0 pointer-events-none overflow-hidden">
      {particles.map((p) => (
        <motion.div
          key={p.id}
          className="absolute rounded-full left-1/2 top-1/2"
          style={{ width: p.size, height: p.size, backgroundColor: p.color }}
          initial={{ x: 0, y: 0, opacity: 1, scale: 0 }}
          animate={{ x: p.x, y: p.y, opacity: 0, scale: 1 }}
          transition={{ duration: 0.8, delay: p.delay, ease: "easeOut" }}
        />
      ))}
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function BallDraw({ items, groups, onAssignmentsComplete, onCancel }: BallDrawProps) {
  const [phase, setPhase] = useState<Phase>("SELECT_GROUP");
  const [selectedGroupId, setSelectedGroupId] = useState<string | null>(null);
  const [remaining, setRemaining] = useState<WheelItem[]>(items);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [drawnBall, setDrawnBall] = useState<WheelItem | null>(null);
  const [isRevealed, setIsRevealed] = useState(false);
  const [isShuffling, setIsShuffling] = useState(false);
  const [ballPositions, setBallPositions] = useState(() => generateBallPositions(items.length));

  const selectedGroup = groups.find((g) => g.id === selectedGroupId);

  // Regenerate positions when remaining count changes (after draw)
  useEffect(() => {
    setBallPositions(generateBallPositions(remaining.length));
  }, [remaining.length]);

  const handleSelectGroup = useCallback((groupId: string) => {
    setSelectedGroupId(groupId);
    setPhase("READY");
  }, []);

  const handleDrawBall = useCallback(
    (ball: WheelItem) => {
      if (phase !== "READY") return;
      setDrawnBall(ball);
      setPhase("DRAWING");
      setTimeout(() => setPhase("REVEALING"), 700);
    },
    [phase],
  );

  const handleReveal = useCallback(() => {
    if (phase !== "REVEALING" || !drawnBall || !selectedGroupId || !selectedGroup) return;
    setIsRevealed(true);

    setTimeout(() => {
      const newAssignment: Assignment = {
        playerId: drawnBall.id,
        playerName: drawnBall.label,
        groupId: selectedGroupId,
        groupName: selectedGroup.name,
      };

      const newAssignments = [...assignments, newAssignment];
      setAssignments(newAssignments);

      const newRemaining = remaining.filter((b) => b.id !== drawnBall.id);
      setRemaining(newRemaining);

      setDrawnBall(null);
      setIsRevealed(false);

      if (newRemaining.length === 0) {
        const grouped = new Map<string, string[]>();
        for (const a of newAssignments) {
          if (!grouped.has(a.groupId)) grouped.set(a.groupId, []);
          grouped.get(a.groupId)!.push(a.playerId);
        }
        onAssignmentsComplete(
          Array.from(grouped.entries()).map(([groupId, playerIds]) => ({ groupId, playerIds })),
        );
      } else {
        setPhase("READY");
      }
    }, 1800);
  }, [phase, drawnBall, selectedGroupId, selectedGroup, assignments, remaining, onAssignmentsComplete]);

  const handleShuffle = useCallback(() => {
    if (isShuffling || phase !== "READY") return;
    setIsShuffling(true);

    // Phase 1: Gather to center
    const gatherPositions = remaining.map(() => ({
      x: 194 + (Math.random() - 0.5) * 40,
      y: 154 + (Math.random() - 0.5) * 40,
      rotation: Math.random() * 60 - 30,
    }));
    setBallPositions(gatherPositions);

    // Phase 2: Burst out to random spread
    setTimeout(() => {
      const burstPositions = remaining.map(() => ({
        x: 30 + Math.random() * 360,
        y: 30 + Math.random() * 280,
        rotation: Math.random() * 40 - 20,
      }));
      setBallPositions(burstPositions);
      setTimeout(() => setIsShuffling(false), 600);
    }, 400);
  }, [isShuffling, phase, remaining]);

  return (
    <div className="min-h-screen bg-[#0a0a0a] flex">
      {/* ─── Left: Remaining Players ──────────────────────────────────────── */}
      {phase !== "SELECT_GROUP" && (
        <div className="w-56 border-r border-[#222] p-4 flex flex-col shrink-0 overflow-hidden">
          <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-3">
            Khách mời còn lại ({remaining.length})
          </h3>
          <div className="flex-1 overflow-y-auto space-y-1.5">
            {remaining.map((item) => (
              <div
                key={item.id}
                className="text-xs text-[#888] px-2 py-1.5 rounded bg-[#111] border border-[#222] truncate"
              >
                {item.label}
              </div>
            ))}
            {remaining.length === 0 && (
              <div className="text-[#333] text-xs italic">Đã bốc hết</div>
            )}
          </div>
        </div>
      )}

      {/* ─── Center: Main Draw Area ─────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Top Bar */}
        <div className="flex items-center justify-between px-6 py-4 shrink-0">
          <button
            onClick={onCancel}
            className="text-[#555] hover:text-[#f5f5f5] transition-colors flex items-center gap-2 text-sm"
          >
            <X className="h-4 w-4" /> Quay lại
          </button>

          {phase !== "SELECT_GROUP" && (
            <div className="flex items-center gap-4">
              <span className="sblt-heading text-[#dc2626] text-lg">{selectedGroup?.name}</span>
              <button
                onClick={() => {
                  setPhase("SELECT_GROUP");
                  setSelectedGroupId(null);
                }}
                className="flex items-center gap-2 bg-[#111] border border-[#333] hover:border-[#dc2626] text-[#888] hover:text-[#f5f5f5] text-sm px-4 py-2 rounded-lg transition-all"
              >
                <RotateCcw className="h-4 w-4" /> Đổi bảng
              </button>
            </div>
          )}

          <div className="text-[#888] text-sm">
            Đã bốc: <span className="text-[#f5f5f5] font-semibold">{assignments.length}</span>/{items.length}
          </div>
        </div>

        {/* Main Area */}
        <div className="flex-1 flex flex-col items-center justify-center relative overflow-hidden">
        {/* Phase: SELECT_GROUP */}
        {phase === "SELECT_GROUP" && (
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center">
            <h2 className="sblt-heading text-3xl text-[#f5f5f5] mb-2">Chọn bảng đấu</h2>
            <p className="text-[#888] text-sm mb-10">Chọn bảng để bắt đầu bốc thăm</p>
            <div className="grid grid-cols-2 gap-5 max-w-lg">
              {groups.map((group) => (
                <button
                  key={group.id}
                  onClick={() => handleSelectGroup(group.id)}
                  className="bg-[#111] border-2 border-[#222] hover:border-[#dc2626] rounded-xl p-6 text-center transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)] group"
                >
                  <div className="sblt-heading text-xl text-[#f5f5f5] group-hover:text-[#dc2626] transition-colors">
                    {group.name}
                  </div>
                  <div className="text-xs text-[#555] mt-1">{group.currentCount}/8 tuyển thủ</div>
                </button>
              ))}
            </div>
          </motion.div>
        )}

        {/* Phase: READY — Box with balls */}
        {(phase === "READY" || phase === "DRAWING") && (
          <div className="flex flex-col items-center">
            <div className="relative" style={{ width: 440, height: 360 }}>
              {/* Box body */}
              <div className="absolute inset-0 bg-[#111] border-2 border-[#222] rounded-xl overflow-hidden">
                <div className="absolute inset-0 shadow-[inset_0_10px_30px_rgba(0,0,0,0.5)]" />

                {/* Balls — animated positions */}
                {phase === "READY" &&
                  remaining.map((item, i) => {
                    const pos = ballPositions[i];
                    if (!pos) return null;
                    const color = BALL_COLORS[i % BALL_COLORS.length];
                    return (
                      <motion.div
                        key={item.id}
                        className="absolute cursor-pointer"
                        animate={{
                          left: pos.x,
                          top: pos.y,
                          rotate: pos.rotation,
                        }}
                        transition={{ type: "spring", stiffness: 300, damping: 25 }}
                        style={{ width: 52, height: 52 }}
                        onClick={() => handleDrawBall(item)}
                      >
                        <div
                          style={{
                            width: 52,
                            height: 52,
                            animation: `bob ${2 + (i % 3) * 0.5}s ease-in-out infinite`,
                            animationDelay: `${i * 0.15}s`,
                          }}
                        >
                          <div
                            className="w-full h-full rounded-full shadow-lg"
                            style={{
                              background: `radial-gradient(circle at 35% 35%, ${color}cc, ${color})`,
                              boxShadow: `0 4px 15px ${color}40`,
                            }}
                          />
                          <div className="absolute top-1 left-2 w-3 h-2 bg-white/30 rounded-full blur-[1px]" />
                        </div>
                      </motion.div>
                    );
                  })}

                {/* Ball being drawn — lift animation */}
                {phase === "DRAWING" && drawnBall && (
                  <motion.div
                    className="absolute left-1/2 z-20"
                    style={{ width: 64, height: 64, marginLeft: -32 }}
                    initial={{ top: 150, scale: 1 }}
                    animate={{ top: -80, scale: 1.4 }}
                    transition={{ duration: 0.6, ease: [0.34, 1.56, 0.64, 1] }}
                  >
                    <div
                      className="w-full h-full rounded-full shadow-2xl"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${BALL_COLORS[0]}cc, ${BALL_COLORS[0]})`,
                        boxShadow: `0 0 40px ${BALL_COLORS[0]}60`,
                      }}
                    />
                    <div className="absolute top-1.5 left-3 w-4 h-3 bg-white/30 rounded-full blur-[2px]" />
                  </motion.div>
                )}
              </div>

              {/* Hole on top */}
              <div
                className="absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2 z-10"
                style={{ width: 140, height: 50 }}
              >
                <div className="w-full h-full rounded-full bg-[#0a0a0a] border-2 border-[#333] shadow-[inset_0_5px_20px_rgba(0,0,0,0.8)]" />
                <div className="absolute inset-0 rounded-full border border-[#444] pointer-events-none" />
              </div>

              {/* Box label */}
              <div className="absolute bottom-3 left-0 right-0 text-center">
                <span className="text-[#333] text-xs uppercase tracking-widest sblt-heading">Bốc Thăm</span>
              </div>
            </div>

            {/* Remaining balls — colored dots */}
            <div className="flex items-center gap-2 mt-8">
              {remaining.map((item, i) => (
                <div
                  key={item.id}
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: BALL_COLORS[i % BALL_COLORS.length], opacity: 0.6 }}
                />
              ))}
            </div>

            {/* Instruction + Shuffle */}
            {phase === "READY" && (
              <div className="flex flex-col items-center gap-3 mt-6">
                <motion.p
                  className="text-[#555] text-sm"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ repeat: Infinity, duration: 2 }}
                >
                  Click vào một quả bóng để rút
                </motion.p>
                <button
                  onClick={handleShuffle}
                  disabled={isShuffling}
                  className="flex items-center gap-2 bg-[#111] border border-[#333] hover:border-[#dc2626] text-[#888] hover:text-[#f5f5f5] text-sm px-4 py-2 rounded-lg transition-all disabled:opacity-50"
                >
                  <Shuffle className="h-4 w-4" /> Xáo bóng
                </button>
              </div>
            )}
          </div>
        )}

        {/* Phase: REVEALING — Ball center screen */}
        <AnimatePresence>
          {phase === "REVEALING" && drawnBall && (
            <motion.div
              className="fixed inset-0 flex items-center justify-center z-30"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

              <div className="relative z-10 flex flex-col items-center">
                {!isRevealed ? (
                  <motion.div
                    className="cursor-pointer relative"
                    onClick={handleReveal}
                    animate={{ scale: [1, 1.05, 1] }}
                    transition={{ repeat: Infinity, duration: 1.5 }}
                  >
                    <motion.div
                      className="absolute -inset-4 rounded-full"
                      style={{ background: `radial-gradient(circle, ${BALL_COLORS[0]}30, transparent 70%)` }}
                      animate={{ scale: [1, 1.2, 1], opacity: [0.5, 0.8, 0.5] }}
                      transition={{ repeat: Infinity, duration: 2 }}
                    />

                    <div
                      className="w-36 h-36 rounded-full shadow-2xl flex items-center justify-center relative"
                      style={{
                        background: `radial-gradient(circle at 35% 35%, ${BALL_COLORS[0]}dd, ${BALL_COLORS[0]})`,
                        boxShadow: `0 0 60px ${BALL_COLORS[0]}40, 0 0 120px ${BALL_COLORS[0]}20`,
                      }}
                    >
                      <span className="text-white text-4xl font-bold sblt-heading drop-shadow-lg">?</span>
                      <div className="absolute top-3 left-6 w-8 h-6 bg-white/25 rounded-full blur-[3px]" />
                    </div>

                    <motion.p
                      className="text-[#888] text-sm mt-6 text-center"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ repeat: Infinity, duration: 1.5 }}
                    >
                      Click để mở bóng
                    </motion.p>
                  </motion.div>
                ) : (
                  <div className="flex flex-col items-center">
                    <Sparkles count={15} />

                    {/* Ball halves */}
                    <div className="relative w-64 h-32 mb-4">
                      <motion.div
                        className="absolute right-1/2 top-0 overflow-hidden"
                        style={{ width: 64, height: 128 }}
                        initial={{ x: 0, rotate: 0, opacity: 1 }}
                        animate={{ x: -120, rotate: -45, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <div
                          className="w-32 h-32 rounded-full"
                          style={{ background: `radial-gradient(circle at 35% 35%, ${BALL_COLORS[0]}dd, ${BALL_COLORS[0]})` }}
                        />
                      </motion.div>

                      <motion.div
                        className="absolute left-1/2 top-0 overflow-hidden"
                        style={{ width: 64, height: 128 }}
                        initial={{ x: 0, rotate: 0, opacity: 1 }}
                        animate={{ x: 120, rotate: 45, opacity: 0 }}
                        transition={{ duration: 0.6, ease: "easeOut" }}
                      >
                        <div
                          className="w-32 h-32 rounded-full -ml-16"
                          style={{ background: `radial-gradient(circle at 35% 35%, ${BALL_COLORS[0]}dd, ${BALL_COLORS[0]})` }}
                        />
                      </motion.div>
                    </div>

                    {/* Radial burst */}
                    <motion.div
                      className="absolute inset-0 pointer-events-none"
                      initial={{ opacity: 0 }}
                      animate={{ opacity: [0, 0.3, 0] }}
                      transition={{ duration: 1 }}
                    >
                      <div
                        className="absolute inset-0"
                        style={{ background: `radial-gradient(circle at center, ${BALL_COLORS[0]}20, transparent 60%)` }}
                      />
                    </motion.div>

                    {/* Player name */}
                    <motion.div
                      className="text-center"
                      initial={{ scale: 0, opacity: 0 }}
                      animate={{ scale: [0, 1.2, 1], opacity: 1 }}
                      transition={{ duration: 0.5, delay: 0.3, ease: [0.34, 1.56, 0.64, 1] }}
                    >
                      <div className="sblt-heading text-5xl text-[#f5f5f5] mb-3 drop-shadow-lg">{drawnBall.label}</div>
                      <motion.div
                        className="text-[#888] text-base"
                        initial={{ opacity: 0, y: 10 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.8 }}
                      >
                        → <span className="text-[#dc2626] font-semibold">{selectedGroup?.name}</span>
                      </motion.div>
                    </motion.div>
                  </div>
                )}
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
      </div>

      {/* ─── Right: Assignments Panel ─────────────────────────────────────── */}
      {phase !== "SELECT_GROUP" && (
        <div className="w-72 border-l border-[#222] p-4 flex flex-col shrink-0 overflow-hidden">
          <h3 className="text-xs font-semibold text-[#888] uppercase tracking-wider mb-4">
            Kết quả bốc thăm
          </h3>

          <div className="flex-1 overflow-y-auto space-y-3">
            {groups.map((group) => {
              const groupAssignments = assignments.filter((a) => a.groupId === group.id);
              const isSelected = group.id === selectedGroupId;
              return (
                <div
                  key={group.id}
                  className={`p-3 rounded-lg border transition-colors ${
                    isSelected
                      ? "bg-[#dc2626]/10 border-[#dc2626]/40"
                      : "bg-[#111] border-[#222]"
                  }`}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span
                      className={`text-sm font-semibold ${
                        isSelected ? "text-[#dc2626]" : "text-[#f5f5f5]"
                      }`}
                    >
                      {group.name}
                    </span>
                    <span className="text-[#555] text-xs">
                      {group.currentCount + groupAssignments.length}/8
                    </span>
                  </div>
                  {groupAssignments.length > 0 ? (
                    <div className="space-y-1">
                      {groupAssignments.map((a, idx) => (
                        <motion.div
                          key={a.playerId}
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          transition={{ duration: 0.3 }}
                          className={`text-xs px-2 py-1 rounded ${
                            idx === groupAssignments.length - 1
                              ? "bg-[#dc2626]/15 text-[#f5f5f5]"
                              : "text-[#888]"
                          }`}
                        >
                          {a.playerName}
                        </motion.div>
                      ))}
                    </div>
                  ) : (
                    <div className="text-[#333] text-xs italic">Chưa bốc</div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ─── CSS Animation ────────────────────────────────────────────────── */}
      <style>{`
        @keyframes bob {
          0%, 100% { transform: translateY(0); }
          50% { transform: translateY(-5px); }
        }
      `}</style>
    </div>
  );
}
