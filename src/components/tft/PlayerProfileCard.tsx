"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Trophy, Star, TrendingUp, Zap, Medal } from "lucide-react";

interface PlayerProfileCardProps {
  ign: string;
  rank?: string;
  totalPoints: number;
  top1Count: number;
  top4Count: number;
  totalGames: number;
  /** Vị trí xếp hạng toàn hệ thống */
  globalRank?: number;
  avatar?: string | null;
  /** Ảnh Tướng TFT yêu thích — break out */
  favoriteChampion?: string;
  isGuest?: boolean;
}

const RANK_COLORS: Record<string, { text: string; glow: string; bg: string }> = {
  "Thách Đấu":  { text: "text-[#c89b3c]",  glow: "shadow-neon-gold",   bg: "bg-[#c89b3c]/10" },
  "Cao Thủ":    { text: "text-[#9b59b6]",  glow: "shadow-neon-purple", bg: "bg-[#9b59b6]/10" },
  "Kim Cương":  { text: "text-[#0bc4e3]",  glow: "shadow-neon-blue",   bg: "bg-[#0bc4e3]/10" },
  "Bạch Kim":   { text: "text-slate-300",  glow: "",                   bg: "bg-slate-700/20" },
  "Vàng":       { text: "text-yellow-400", glow: "",                   bg: "bg-yellow-500/10" },
};

function getRankStyle(rank?: string) {
  if (!rank) return { text: "text-sblt-muted", glow: "", bg: "bg-sblt-border/30" };
  for (const [key, val] of Object.entries(RANK_COLORS)) {
    if (rank.includes(key)) return val;
  }
  return { text: "text-sblt-muted", glow: "", bg: "bg-sblt-border/30" };
}

function getGlobalRankStyle(pos?: number) {
  if (!pos) return null;
  if (pos === 1) return { icon: "🥇", color: "text-gradient-gold",   border: "border-[#c89b3c]/50" };
  if (pos === 2) return { icon: "🥈", color: "text-zinc-300",        border: "border-zinc-400/40" };
  if (pos === 3) return { icon: "🥉", color: "text-amber-600",       border: "border-amber-700/40" };
  if (pos <= 10) return { icon: `#${pos}`, color: "text-[#0bc4e3]", border: "border-[#0bc4e3]/30" };
  return { icon: `#${pos}`, color: "text-sblt-muted", border: "border-sblt-border" };
}

export default function PlayerProfileCard({
  ign,
  rank,
  totalPoints,
  top1Count,
  top4Count,
  totalGames,
  globalRank,
  avatar,
  favoriteChampion,
  isGuest = false,
}: PlayerProfileCardProps) {
  const rankStyle = getRankStyle(rank);
  const rankBadge = getGlobalRankStyle(globalRank);
  const top4Rate = totalGames > 0 ? Math.round((top4Count / totalGames) * 100) : 0;
  const avgPoints = totalGames > 0 ? (totalPoints / totalGames).toFixed(1) : "0";

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      whileHover={{ y: -4 }}
      className="character-card"
    >
      <div className={`
        relative rounded-2xl overflow-visible
        bg-sblt-card/80 backdrop-blur-xl
        border transition-all duration-300 group
        ${globalRank === 1
          ? "border-[#c89b3c]/40 hover:border-[#c89b3c]/70 hover:shadow-neon-gold"
          : "border-sblt-border hover:border-[#0bc4e3]/40 hover:shadow-neon-blue"
        }
      `}>

        {/* Top accent bar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl opacity-60 group-hover:opacity-100 transition-opacity duration-300 ${
          globalRank === 1
            ? "bg-gradient-to-r from-[#c89b3c] via-[#f0e6d3] to-[#c89b3c]"
            : "bg-gradient-to-r from-[#0bc4e3] via-[#9b59b6] to-[#0bc4e3]"
        }`} />

        {/* Background glow */}
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          globalRank === 1
            ? "bg-gradient-to-br from-[#c89b3c]/6 to-transparent"
            : "bg-gradient-to-br from-[#0bc4e3]/5 to-transparent"
        }`} />

        {/* ── Favorite champion — breaks out of top-right ── */}
        {favoriteChampion && (
          <div className="absolute -top-10 right-3 w-24 h-28 z-20 pointer-events-none">
            <Image
              src={favoriteChampion}
              alt="champion"
              fill
              className="object-contain object-bottom drop-shadow-[0_4px_16px_rgba(0,0,0,0.9)] group-hover:scale-110 group-hover:-translate-y-2 transition-transform duration-500"
              sizes="96px"
            />
          </div>
        )}

        <div className="relative z-10 p-5">
          {/* Header: avatar + name */}
          <div className="flex items-center gap-3 mb-4">
            {/* Avatar */}
            <div className="relative shrink-0">
              <div className={`w-14 h-14 rounded-xl overflow-hidden border-2 ${
                globalRank === 1 ? "border-[#c89b3c]/60" : "border-sblt-border"
              }`}>
                {avatar ? (
                  <Image src={avatar} alt={ign} fill className="object-cover" sizes="56px" />
                ) : (
                  <div className={`w-full h-full flex items-center justify-center ${
                    globalRank === 1 ? "bg-gradient-to-b from-[#2a1f08] to-[#1a1208]" : "bg-sblt-dark"
                  }`}>
                    <span className={`text-xl font-black sblt-heading ${
                      globalRank === 1 ? "text-gradient-gold" : "text-gradient-hextech"
                    }`}>
                      {ign.charAt(0).toUpperCase()}
                    </span>
                  </div>
                )}
              </div>
              {/* Global rank badge */}
              {rankBadge && (
                <div className={`absolute -bottom-1.5 -right-1.5 min-w-[22px] h-[22px] rounded-full flex items-center justify-center text-xs font-bold border bg-sblt-black ${rankBadge.border} ${rankBadge.color}`}>
                  {rankBadge.icon}
                </div>
              )}
            </div>

            {/* Name & rank */}
            <div className="flex-1 min-w-0 pr-16">
              <div className="flex items-center gap-1.5 mb-0.5">
                <h4 className="font-bold text-white text-sm truncate">{ign}</h4>
                {isGuest && (
                  <span className="shrink-0 text-xs font-bold uppercase tracking-wider bg-[#c89b3c]/15 text-[#c89b3c] border border-[#c89b3c]/30 px-1.5 py-0.5 rounded-full">
                    Khách
                  </span>
                )}
              </div>
              {rank && (
                <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${rankStyle.bg} ${rankStyle.text}`}>
                  {rank}
                </span>
              )}
            </div>
          </div>

          {/* Divider */}
          <div className="sblt-divider mb-4 opacity-40" />

          {/* Stats grid */}
          <div className="grid grid-cols-2 gap-2 mb-3">
            {[
              { icon: Trophy,    label: "Tổng điểm",  value: totalPoints,       color: "text-red-400" },
              { icon: Star,      label: "Top 1",       value: top1Count,         color: "text-yellow-400" },
              { icon: TrendingUp,label: "Top 4%",      value: `${top4Rate}%`,    color: "text-green-400" },
              { icon: Zap,       label: "TB điểm",     value: avgPoints,         color: "text-[#0bc4e3]" },
            ].map(({ icon: Icon, label, value, color }) => (
              <div key={label} className="bg-sblt-dark/60 rounded-xl p-2.5 text-center">
                <Icon className={`h-3.5 w-3.5 mx-auto mb-1 ${color}`} />
                <div className={`text-base font-bold ${color}`}>{value}</div>
                <div className="text-xs text-sblt-muted">{label}</div>
              </div>
            ))}
          </div>

          {/* Games played */}
          <div className="flex items-center justify-between text-xs text-sblt-muted">
            <span className="flex items-center gap-1">
              <Medal className="h-3 w-3" /> {totalGames} trận
            </span>
            {globalRank && (
              <span className={`font-semibold ${rankBadge?.color || "text-sblt-muted"}`}>
                Hạng {globalRank} toàn hệ thống
              </span>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
