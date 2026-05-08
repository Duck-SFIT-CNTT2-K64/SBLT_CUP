"use client";

import Image from "next/image";
import { motion } from "framer-motion";
import { Crown, Star, CheckCircle, Clock } from "lucide-react";

interface GuestCardProps {
  name: string;
  role: "Host" | "Khách mời";
  confirmed: boolean;
  /** Ảnh avatar/profile của khách mời */
  image?: string | null;
  /** Ảnh PNG trong suốt của Tướng TFT — break out khỏi card */
  championImage?: string;
  rank?: string;
  /** Thứ tự để stagger animation */
  index?: number;
}

export default function GuestCard({
  name,
  role,
  confirmed,
  image,
  championImage,
  rank,
  index = 0,
}: GuestCardProps) {
  const isHost = role === "Host";

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.9, y: 16 }}
      whileInView={{ opacity: 1, scale: 1, y: 0 }}
      viewport={{ once: true, margin: "-40px" }}
      transition={{ duration: 0.4, delay: index * 0.06, ease: "easeOut" }}
      whileHover={{ y: -8, scale: 1.03 }}
      className="character-card"
    >
      {/* ── Outer container — overflow:visible cho champion break out ── */}
      <div className={`
        relative rounded-2xl group cursor-pointer
        transition-all duration-300
        ${isHost
          ? "bg-gradient-to-b from-[#1a1208] to-sblt-card border border-[#c89b3c]/30 hover:border-[#c89b3c]/70 hover:shadow-neon-gold"
          : "bg-sblt-card/80 backdrop-blur-md border border-sblt-border hover:border-[#0bc4e3]/40 hover:shadow-neon-blue"
        }
      `}>

        {/* Gradient top bar */}
        <div className={`absolute top-0 left-0 right-0 h-[2px] rounded-t-2xl transition-opacity duration-300 opacity-50 group-hover:opacity-100 ${
          isHost
            ? "bg-gradient-to-r from-[#c89b3c] via-[#f0e6d3] to-[#c89b3c]"
            : "bg-gradient-to-r from-[#0bc4e3] via-[#9b59b6] to-[#0bc4e3]"
        }`} />

        {/* Background glow on hover */}
        <div className={`absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 ${
          isHost
            ? "bg-gradient-to-b from-[#c89b3c]/8 to-transparent"
            : "bg-gradient-to-b from-[#0bc4e3]/6 to-transparent"
        }`} />

        {/* ── Champion image — breaks out of top ── */}
        {championImage && (
          <div className="absolute -top-8 -right-2 w-20 h-24 z-20 pointer-events-none">
            <Image
              src={championImage}
              alt="champion"
              fill
              className="object-contain object-bottom drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)] group-hover:scale-110 group-hover:-translate-y-1 transition-transform duration-500"
              sizes="80px"
            />
          </div>
        )}

        {/* ── Avatar section ── */}
        <div className="relative z-10 p-4">
          <div className="relative mb-3">
            {/* Avatar frame */}
            <div className={`relative mx-auto rounded-xl overflow-hidden ${
              isHost ? "w-full aspect-[3/4]" : "w-full aspect-square"
            } ${isHost ? "gold-border" : ""}`}>

              {image ? (
                <Image
                  src={image}
                  alt={name}
                  fill
                  className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                  sizes="(max-width: 640px) 50vw, 150px"
                />
              ) : (
                /* Fallback — vẫn đẹp khi không có ảnh */
                <div className={`absolute inset-0 flex items-center justify-center ${
                  isHost
                    ? "bg-gradient-to-b from-[#2a1f08] to-[#1a1208]"
                    : "bg-gradient-to-b from-[#0d1f2a] to-sblt-dark"
                }`}>
                  <span className={`text-4xl font-black sblt-heading ${
                    isHost ? "text-gradient-gold" : "text-gradient-hextech"
                  }`}>
                    {name.replace(/^\./, "").charAt(0).toUpperCase()}
                  </span>
                </div>
              )}

              {/* Gradient overlay bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-sblt-black/70 via-transparent to-transparent" />

              {/* Host crown badge */}
              {isHost && (
                <div className="absolute top-2 left-2 z-10">
                  <div className="flex items-center gap-1 bg-[#c89b3c]/20 border border-[#c89b3c]/40 rounded-full px-2 py-0.5">
                    <Crown className="h-3 w-3 text-[#c89b3c]" />
                    <span className="text-xs font-bold text-[#c89b3c] uppercase tracking-wider">Host</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Name & info */}
          <div className="text-center">
            <h4 className={`font-bold text-sm leading-tight mb-1 ${
              isHost ? "text-gradient-gold" : "text-white"
            }`}>
              {name}
            </h4>

            {rank && (
              <p className="text-xs text-sblt-muted mb-1.5">{rank}</p>
            )}

            {/* Confirmed status */}
            <div className="flex items-center justify-center gap-1">
              {confirmed ? (
                <span className="flex items-center gap-1 text-xs text-green-400">
                  <CheckCircle className="h-3 w-3" />
                  Đã xác nhận
                </span>
              ) : (
                <span className="flex items-center gap-1 text-xs text-yellow-500">
                  <Clock className="h-3 w-3" />
                  Chờ xác nhận
                </span>
              )}
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
