"use client";

import { useState, useEffect, useRef } from "react";

interface DuckPlayer {
  id: string;
  ign: string;
  avatar?: string | null;
}

interface DuckRaceProps {
  players: DuckPlayer[];
  onWinner?: (playerId: string) => void;
  autoStart?: boolean;
}

const DUCK_EMOJIS = ["🦆", "🐥", "🐤", "🐣"];

export function DuckRace({ players, onWinner, autoStart = false }: DuckRaceProps) {
  const [phase, setPhase] = useState<"ready" | "racing" | "finished">("ready");
  const [positions, setPositions] = useState<number[]>(() => players.map(() => 0));
  const [winner, setWinner] = useState<DuckPlayer | null>(null);
  const animRef = useRef<number | null>(null);
  const speedsRef = useRef<number[]>([]);
  const finishOrderRef = useRef<number[]>([]);

  // Random speeds for each duck
  const initSpeeds = () => {
    speedsRef.current = players.map(() => 0.3 + Math.random() * 0.7);
    finishOrderRef.current = [];
  };

  const startRace = () => {
    initSpeeds();
    setPhase("racing");
    setPositions(players.map(() => 0));
    setWinner(null);
  };

  useEffect(() => {
    if (autoStart && phase === "ready") {
      const timer = setTimeout(startRace, 1000);
      return () => clearTimeout(timer);
    }
  }, [autoStart]);

  useEffect(() => {
    if (phase !== "racing") return;

    const trackWidth = 100; // percentage
    const finishLine = trackWidth - 8; // leave some space

    const animate = () => {
      setPositions((prev) => {
        const next = prev.map((pos, i) => {
          if (pos >= finishLine) return pos;
          // Add some randomness to make it exciting
          const jitter = (Math.random() - 0.5) * 0.3;
          const speed = speedsRef.current[i] + jitter;
          return Math.min(pos + speed, finishLine);
        });

        // Check for finishers
        next.forEach((pos, i) => {
          if (pos >= finishLine && !finishOrderRef.current.includes(i)) {
            finishOrderRef.current.push(i);
          }
        });

        // All finished?
        if (finishOrderRef.current.length === players.length) {
          setPhase("finished");
          const winnerIdx = finishOrderRef.current[0];
          setWinner(players[winnerIdx]);
          onWinner?.(players[winnerIdx].id);
        }

        return next;
      });

      animRef.current = requestAnimationFrame(animate);
    };

    animRef.current = requestAnimationFrame(animate);
    return () => {
      if (animRef.current) cancelAnimationFrame(animRef.current);
    };
  }, [phase]);

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="text-center mb-6">
        <h3 className="text-2xl font-bold text-[#f5f5f5] mb-1">
          🏁 Đua vịt tie-breaker 🏁
        </h3>
        <p className="text-sm text-[#888]">
          {phase === "ready" && "Sẵn sàng đua!"}
          {phase === "racing" && "Đang đua..."}
          {phase === "finished" && winner && `🏆 ${winner.ign} thắng!`}
        </p>
      </div>

      {/* Track */}
      <div className="space-y-2">
        {players.map((player, i) => {
          const isWinner = winner?.id === player.id;

          return (
            <div key={player.id} className="flex items-center gap-3">
              {/* Player name */}
              <div className="w-28 text-right">
                <span className={`text-sm font-medium truncate block ${isWinner ? "text-yellow-400" : "text-[#ccc]"}`}>
                  {player.ign}
                </span>
              </div>

              {/* Track lane */}
              <div className="flex-1 h-10 bg-[#111] rounded-full border border-[#222] relative overflow-hidden">
                {/* Finish line */}
                <div className="absolute right-[8%] top-0 bottom-0 w-px bg-[#333] border-r border-dashed border-[#444]" />

                {/* Duck */}
                <div
                  className={`absolute top-1/2 -translate-y-1/2 transition-none ${isWinner ? "scale-110" : ""}`}
                  style={{ left: `${positions[i]}%` }}
                >
                  <span className="text-2xl select-none" style={{ filter: isWinner ? "drop-shadow(0 0 8px gold)" : "none" }}>
                    {DUCK_EMOJIS[i % DUCK_EMOJIS.length]}
                  </span>
                </div>

                {/* Lane number */}
                <span className="absolute left-2 top-1/2 -translate-y-1/2 text-xs text-[#333] font-mono">
                  {i + 1}
                </span>
              </div>

              {/* Finish order */}
              <div className="w-8 text-center">
                {finishOrderRef.current.includes(i) && (
                  <span className={`text-sm font-bold ${finishOrderRef.current.indexOf(i) === 0 ? "text-yellow-400" : "text-[#666]"}`}>
                    #{finishOrderRef.current.indexOf(i) + 1}
                  </span>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Controls */}
      <div className="mt-6 text-center">
        {phase === "ready" && (
          <button
            onClick={startRace}
            className="bg-gradient-to-r from-yellow-500 to-orange-500 hover:from-yellow-400 hover:to-orange-400 text-black font-bold px-8 py-3 rounded-xl text-lg transition-all hover:scale-105 active:scale-95"
          >
            🏁 Bắt đầu đua!
          </button>
        )}
        {phase === "finished" && (
          <div className="space-y-3">
            <div className="bg-gradient-to-r from-yellow-500/10 to-orange-500/10 border border-yellow-500/20 rounded-xl p-4">
              <p className="text-yellow-400 font-bold text-lg">
                🏆 {winner?.ign} chiến thắng!
              </p>
            </div>
            <button
              onClick={startRace}
              className="text-sm text-[#888] hover:text-[#f5f5f5] transition-colors"
            >
              Đua lại
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
