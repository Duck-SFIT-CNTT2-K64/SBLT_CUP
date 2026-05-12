"use client";

import Image from "next/image";
import { Target, Gift, Sparkles, Zap, Trophy } from "lucide-react";
import lanyardRewardImage from "../../../assets/day deo tft mockup 2.png";
import keychainRewardImage from "../../../assets/móc khóa.png";

const REWARD_TIERS = [
  {
    rank: 1,
    label: "Top 1",
    reward: "1 dây + 1 móc + 200k",
    accent: "yellow-500",
    borderColor: "border-yellow-500/30",
    bgColor: "bg-gradient-to-br from-yellow-500/15 via-yellow-500/5 to-transparent",
    barColor: "bg-yellow-500",
    badgeBg: "bg-yellow-500/10",
    badgeText: "text-yellow-400",
  },
  {
    rank: 2,
    label: "Top 2",
    reward: "1 dây + 1 móc + 150k",
    accent: "slate-300",
    borderColor: "border-slate-400/30",
    bgColor: "bg-gradient-to-br from-slate-400/12 via-slate-300/4 to-transparent",
    barColor: "bg-slate-400",
    badgeBg: "bg-slate-300/10",
    badgeText: "text-slate-200",
  },
  {
    rank: 3,
    label: "Top 3",
    reward: "1 dây + 100k",
    accent: "orange-500",
    borderColor: "border-orange-500/30",
    bgColor: "bg-gradient-to-br from-orange-500/12 via-orange-500/4 to-transparent",
    barColor: "bg-orange-500",
    badgeBg: "bg-orange-500/10",
    badgeText: "text-orange-400",
  },
  {
    rank: 4,
    label: "Top 4",
    reward: "50k + 1 móc",
    accent: "red-500",
    borderColor: "border-[#dc2626]/30",
    bgColor: "bg-gradient-to-br from-[#dc2626]/12 via-[#dc2626]/4 to-transparent",
    barColor: "bg-[#dc2626]",
    badgeBg: "bg-[#dc2626]/10",
    badgeText: "text-red-400",
  },
] as const;

export default function PredictionRulesAndRewardsPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-2 mb-10">
      {/* Rules Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
        {/* Atmospheric glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.1),transparent_50%)]" />
        <div className="absolute -top-20 -left-20 h-40 w-40 rounded-full bg-[#dc2626]/8 blur-3xl" />

        <div className="relative p-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dc2626]/10 text-[#dc2626] shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              <Target className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#dc2626] font-semibold">Thể lệ dự đoán</p>
              <h3 className="sblt-heading mt-1 text-2xl text-[#f5f5f5]">Dự đoán 4 người đi tiếp mỗi bảng</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#b7b7b7]">
                Dự đoán đúng mỗi tuyển thủ nằm trong top 4 của bảng = <span className="text-[#f5f5f5] font-semibold">10 điểm</span>.
                Vòng Chung Kết <span className="text-[#dc2626] font-semibold">nhân đôi điểm</span>, và thứ tự không cần khớp hoàn toàn.
              </p>
            </div>
          </div>
        </div>

        <div className="sblt-divider mx-6" />

        <div className="relative p-6 pt-5">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Mỗi người trong top 4", value: "10 điểm" },
              { label: "Thứ tự", value: "Không quan trọng" },
              { label: "Vòng Chung Kết", value: "X2 điểm" },
            ].map((item) => (
              <div
                key={item.label}
                className="rounded-xl border border-[#222] bg-[#0a0a0a] px-4 py-3 border-l-2 border-l-[#dc2626]"
              >
                <div className="text-[10px] uppercase tracking-[0.2em] text-[#888]">{item.label}</div>
                <div className="mt-1.5 text-lg font-bold text-[#f5f5f5]" style={{ fontFamily: "var(--font-heading)" }}>
                  {item.value}
                </div>
              </div>
            ))}
          </div>

          <div className="mt-5 rounded-xl border border-yellow-500/15 bg-yellow-500/5 p-4">
            <div className="flex items-center gap-2 text-[11px] uppercase tracking-[0.2em] text-yellow-400 font-semibold">
              <Sparkles className="h-4 w-4" />
              Gợi ý nhanh
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#b7b7b7]">
              Chỉ cần chọn đủ 4 tuyển thủ cho mỗi bảng là hoàn tất dự đoán. Thứ tự không cần đúng,
              giúp người xem dễ thao tác và dễ hiểu ngay khi công bố kết quả.
            </p>
          </div>
        </div>
      </div>

      {/* Rewards Card */}
      <div className="relative overflow-hidden rounded-2xl border border-[#222] bg-[#111]">
        {/* Atmospheric glow */}
        <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.08),transparent_50%),radial-gradient(circle_at_bottom_left,rgba(220,38,38,0.06),transparent_50%)]" />
        <div className="absolute -top-20 -right-20 h-40 w-40 rounded-full bg-yellow-500/5 blur-3xl" />

        <div className="relative p-6 pb-5">
          <div className="flex items-start gap-4">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-yellow-500/10 text-yellow-400 shadow-[0_0_20px_rgba(234,179,8,0.2)]">
              <Gift className="h-6 w-6" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[11px] uppercase tracking-[0.25em] text-yellow-400 font-semibold">Phần thưởng</p>
              <h3 className="sblt-heading mt-1 text-2xl text-[#f5f5f5]">Top 4 nhận quà theo thứ hạng</h3>
              <p className="mt-3 text-sm leading-relaxed text-[#b7b7b7]">
                Mỗi hạng được tách rõ, tập trung vào sản phẩm merch thật của giải đấu.
              </p>
            </div>
            <span className="shrink-0 inline-flex items-center gap-1.5 rounded-md bg-[#dc2626]/10 text-[#ef4444] border border-[#dc2626]/25 px-3 py-1.5 text-xs font-semibold">
              <Trophy className="h-3.5 w-3.5" />
              4 hạng đầu
            </span>
          </div>
        </div>

        <div className="sblt-divider mx-6" />

        <div className="relative p-6 pt-5">
          {/* Product showcase */}
          <div className="grid gap-4 sm:grid-cols-2 mb-5">
            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-[#222] bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.15),transparent_60%)]" />
              <Image
                src={lanyardRewardImage}
                alt="Dây TFT phần thưởng"
                fill
                className="object-contain p-5 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                sizes="(max-width: 640px) 100vw, 320px"
                priority
              />
              <div className="absolute left-3 top-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-[#dc2626]/10 text-[#ef4444] border border-[#dc2626]/25 px-2 py-1 text-[11px] font-semibold">
                  <Zap className="h-3 w-3" />
                  1 dây
                </span>
              </div>
            </div>

            <div className="relative min-h-[220px] overflow-hidden rounded-2xl border border-[#222] bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.12),transparent_60%)]" />
              <Image
                src={keychainRewardImage}
                alt="Móc khóa TFT phần thưởng"
                fill
                className="object-contain p-5 drop-shadow-[0_20px_40px_rgba(0,0,0,0.6)]"
                sizes="(max-width: 640px) 100vw, 320px"
              />
              <div className="absolute left-3 top-3">
                <span className="inline-flex items-center gap-1 rounded-md bg-yellow-500/10 text-yellow-400 border border-yellow-500/25 px-2 py-1 text-[11px] font-semibold">
                  <Zap className="h-3 w-3" />
                  1 móc
                </span>
              </div>
            </div>
          </div>

          {/* Reward tiers */}
          <div className="grid gap-3 sm:grid-cols-2">
            {REWARD_TIERS.map((tier) => {
              const rewardParts = tier.reward.split("+").map((p) => p.trim());
              const cashPart = rewardParts.find((p) => p.includes("k"));

              return (
                <div
                  key={tier.rank}
                  className={`relative overflow-hidden rounded-xl border ${tier.borderColor} ${tier.bgColor} p-4`}
                >
                  {/* Left accent bar */}
                  <div className={`absolute left-0 top-0 bottom-0 w-1 ${tier.barColor} rounded-l-xl`} />

                  <div className="pl-2">
                    <div className="flex items-center justify-between gap-3">
                      <span className={`inline-flex items-center rounded-md ${tier.badgeBg} ${tier.badgeText} border ${tier.borderColor} px-2 py-0.5 text-[11px] font-bold`}>
                        {tier.label}
                      </span>
                      {cashPart && (
                        <span className="text-xl font-black text-[#f5f5f5]" style={{ fontFamily: "var(--font-heading)" }}>
                          {cashPart}
                        </span>
                      )}
                    </div>

                    <div className="mt-2 text-sm font-semibold text-[#f5f5f5]">
                      {tier.reward}
                    </div>

                    <div className="mt-2.5 flex flex-wrap gap-1.5">
                      {rewardParts.map((part) => (
                        <span
                          key={part}
                          className="rounded-full border border-white/10 bg-white/5 px-2.5 py-0.5 text-[10px] font-medium text-[#d8d8d8]"
                        >
                          {part}
                        </span>
                      ))}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}
