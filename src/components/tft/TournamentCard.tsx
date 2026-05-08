"use client";

import Image from "next/image";
import Link from "next/link";
import { motion } from "framer-motion";
import { Trophy, Users, Calendar, Zap, ArrowRight } from "lucide-react";

interface TournamentCardProps {
  id: string;
  name: string;
  season: number;
  status: "UPCOMING" | "REGISTRATION_OPEN" | "IN_PROGRESS" | "COMPLETED" | "REGISTRATION_CLOSED" | "CANCELLED";
  startDate: string;
  endDate: string;
  /** Số đăng ký hiện tại — nhận từ _count.registrations */
  registeredCount: number;
  maxPlayers: number;
  prizePool: number;
  /** PNG trong suốt của Linh thú / Tướng TFT — sẽ "break out" khỏi card */
  mascotImage?: string;
  /** Gradient accent: "hextech" | "gold" | "red" */
  accent?: "hextech" | "gold" | "red";
}

const STATUS_CONFIG = {
  UPCOMING:             { label: "Sắp diễn ra",      dot: "bg-zinc-400",  text: "text-zinc-400" },
  REGISTRATION_OPEN:    { label: "Đang mở đăng ký",  dot: "bg-green-400", text: "text-green-400" },
  REGISTRATION_CLOSED:  { label: "Đã đóng đăng ký",  dot: "bg-yellow-400",text: "text-yellow-400" },
  IN_PROGRESS:          { label: "Đang diễn ra",      dot: "bg-red-500",   text: "text-red-400" },
  COMPLETED:            { label: "Đã kết thúc",       dot: "bg-zinc-500",  text: "text-zinc-500" },
  CANCELLED:            { label: "Đã hủy",            dot: "bg-zinc-600",  text: "text-zinc-600" },
};

const ACCENT_CONFIG = {
  hextech: {
    gradient: "from-[#0bc4e3]/20 via-transparent to-[#9b59b6]/20",
    border:   "hover:border-[#0bc4e3]/50",
    glow:     "hover:shadow-neon-blue",
    badge:    "bg-[#0bc4e3]/10 text-[#0bc4e3] border-[#0bc4e3]/30",
    text:     "text-gradient-hextech",
  },
  gold: {
    gradient: "from-[#c89b3c]/20 via-transparent to-[#f0e6d3]/10",
    border:   "hover:border-[#c89b3c]/60",
    glow:     "hover:shadow-neon-gold",
    badge:    "bg-[#c89b3c]/10 text-[#c89b3c] border-[#c89b3c]/30",
    text:     "text-gradient-gold",
  },
  red: {
    gradient: "from-red-900/20 via-transparent to-red-800/10",
    border:   "hover:border-red-600/60",
    glow:     "hover:shadow-neon-red",
    badge:    "bg-red-600/10 text-red-400 border-red-600/30",
    text:     "text-gradient-red",
  },
};

export default function TournamentCard({
  id,
  name,
  season,
  status,
  startDate,
  endDate,
  registeredCount,
  maxPlayers,
  prizePool,
  mascotImage,
  accent = "red",
}: TournamentCardProps) {
  const statusCfg = STATUS_CONFIG[status];
  const accentCfg = ACCENT_CONFIG[accent];
  const isLive = status === "IN_PROGRESS";
  const fillPct = Math.min((registeredCount / maxPlayers) * 100, 100);

  return (
    <motion.div
      initial={{ opacity: 0, y: 24 }}
      whileInView={{ opacity: 1, y: 0 }}
      viewport={{ once: true, margin: "-60px" }}
      transition={{ duration: 0.45, ease: "easeOut" }}
      whileHover={{ y: -6 }}
      className="character-card"
    >
      <Link href={`/tournaments/${id}`} className="block">
        {/* ── Outer wrapper — overflow:visible để mascot break out ── */}
        <div className={`
          relative rounded-2xl
          bg-[#111]/80 backdrop-blur-xl
          border border-[#222]
          transition-all duration-300
          ${accentCfg.border} ${accentCfg.glow}
          group
        `}>

          {/* Top gradient accent bar */}
          <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl bg-gradient-to-r ${
            accent === "hextech" ? "from-[#0bc4e3] via-[#9b59b6] to-[#0bc4e3]" :
            accent === "gold"    ? "from-[#c89b3c] via-[#f0e6d3] to-[#c89b3c]" :
                                   "from-red-700 via-red-500 to-red-700"
          } opacity-60 group-hover:opacity-100 transition-opacity duration-300`} />

          {/* Background gradient glow */}
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${accentCfg.gradient} opacity-0 group-hover:opacity-100 transition-opacity duration-500`} />

          {/* ── Mascot image — breaks out of top ── */}
          {mascotImage && (
            <div className="absolute -top-10 right-4 w-28 h-36 z-20 pointer-events-none">
              <Image
                src={mascotImage}
                alt="mascot"
                fill
                className="object-contain object-bottom drop-shadow-[0_0_16px_rgba(11,196,227,0.4)] group-hover:scale-110 transition-transform duration-500"
                sizes="112px"
              />
            </div>
          )}

          {/* ── Card content ── */}
          <div className="relative z-10 p-5">
            {/* Header row */}
            <div className="flex items-start justify-between mb-4">
              <div className="flex-1 pr-24">
                {/* Season badge */}
                <span className={`inline-block text-xs font-bold uppercase tracking-widest px-2 py-0.5 rounded-full border mb-2 ${accentCfg.badge}`}>
                  Mùa {season}
                </span>
                {/* Title */}
                <h3 className={`font-bold text-lg leading-tight text-[#f5f5f5] group-hover:${accentCfg.text} transition-all duration-300`}>
                  {name}
                </h3>
              </div>

              {/* Trophy icon */}
              <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                accent === "gold" ? "bg-[#c89b3c]/15" : "bg-red-600/10"
              }`}>
                <Trophy className={`h-5 w-5 ${accent === "gold" ? "text-[#c89b3c]" : "text-red-500"}`} />
              </div>
            </div>

            {/* Status */}
            <div className="flex items-center gap-2 mb-4">
              {isLive ? (
                <span className="flex items-center gap-1.5 text-xs font-semibold text-red-400">
                  <span className="live-dot" />
                  LIVE
                </span>
              ) : (
                <span className={`flex items-center gap-1.5 text-xs font-medium ${statusCfg.text}`}>
                  <span className={`w-1.5 h-1.5 rounded-full ${statusCfg.dot}`} />
                  {statusCfg.label}
                </span>
              )}
            </div>

            {/* Stats row */}
            <div className="grid grid-cols-2 gap-3 mb-4">
              <div className="flex items-center gap-2 text-xs text-[#888]">
                <Calendar className="h-3.5 w-3.5 shrink-0" />
                <span>{new Date(startDate).toLocaleDateString("vi-VN")} – {new Date(endDate).toLocaleDateString("vi-VN")}</span>
              </div>
              <div className="flex items-center gap-2 text-xs text-[#888]">
                <Zap className="h-3.5 w-3.5 shrink-0 text-yellow-500" />
                <span className="font-semibold text-yellow-500">
                  {new Intl.NumberFormat("vi-VN").format(prizePool)} VNĐ
                </span>
              </div>
            </div>

            {/* Registration progress */}
            <div className="mb-4">
              <div className="flex items-center justify-between text-xs mb-1.5">
                <span className="flex items-center gap-1 text-[#888]">
                  <Users className="h-3 w-3" /> Đăng ký
                </span>
                <span className="text-[#f5f5f5] font-medium">{registeredCount}/{maxPlayers}</span>
              </div>
              <div className="h-1.5 bg-[#222] rounded-full overflow-hidden">
                <motion.div
                  initial={{ width: 0 }}
                  whileInView={{ width: `${fillPct}%` }}
                  viewport={{ once: true }}
                  transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
                  className={`h-full rounded-full ${
                    fillPct >= 100 ? "bg-red-500" :
                    fillPct >= 75  ? "bg-yellow-500" :
                    accent === "hextech" ? "bg-gradient-to-r from-[#0bc4e3] to-[#9b59b6]" :
                    accent === "gold"    ? "bg-gradient-to-r from-[#c89b3c] to-[#f0e6d3]" :
                                          "bg-red-600"
                  }`}
                />
              </div>
            </div>

            {/* CTA */}
            <div className="flex items-center justify-between">
              <span className="text-xs text-[#888]">Xem chi tiết</span>
              <ArrowRight className="h-4 w-4 text-[#888] group-hover:text-[#f5f5f5] group-hover:translate-x-1 transition-all duration-200" />
            </div>
          </div>
        </div>
      </Link>
    </motion.div>
  );
}
