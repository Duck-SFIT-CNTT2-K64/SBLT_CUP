"use client";

import Image from "next/image";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Target, Gift, Sparkles } from "lucide-react";
import lanyardRewardImage from "../../../assets/day deo tft mockup 2.png";
import keychainRewardImage from "../../../assets/móc khóa.png";

const REWARD_TIERS = [
  {
    rank: 1,
    label: "Top 1",
    reward: "1 dây + 1 móc + 200k",
    badgeClass: "bg-yellow-500/10 text-yellow-400 border border-yellow-500/25",
    cardClass: "border-yellow-500/25 bg-gradient-to-br from-yellow-500/15 via-yellow-500/8 to-[#111]",
  },
  {
    rank: 2,
    label: "Top 2",
    reward: "1 dây + 1 móc + 150k",
    badgeClass: "bg-slate-300/10 text-slate-200 border border-slate-300/25",
    cardClass: "border-slate-400/25 bg-gradient-to-br from-slate-400/12 via-slate-300/6 to-[#111]",
  },
  {
    rank: 3,
    label: "Top 3",
    reward: "1 dây + 100k",
    badgeClass: "bg-orange-500/10 text-orange-400 border border-orange-500/25",
    cardClass: "border-orange-500/25 bg-gradient-to-br from-orange-500/12 via-orange-500/6 to-[#111]",
  },
  {
    rank: 4,
    label: "Top 4",
    reward: "50k + 1 móc",
    badgeClass: "bg-red-500/10 text-red-400 border border-red-500/25",
    cardClass: "border-red-500/25 bg-gradient-to-br from-red-500/12 via-red-500/6 to-[#111]",
  },
] as const;

export default function PredictionRulesAndRewardsPanel() {
  return (
    <div className="grid gap-6 xl:grid-cols-[0.95fr_1.05fr] mb-8">
      <Card hover={false} className="overflow-hidden">
        <CardHeader className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_left,rgba(220,38,38,0.12),transparent_50%)]" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-[#dc2626]/20 bg-[#dc2626]/10 text-[#dc2626]">
              <Target className="h-5 w-5" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-[0.22em] text-[#888]">Thể lệ dự đoán</div>
              <CardTitle className="mt-1 text-2xl">Dự đoán 4 người đi tiếp mỗi bảng</CardTitle>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#b7b7b7]">
                Dự đoán đúng mỗi tuyển thủ nằm trong top 4 của bảng = 10 điểm. Vòng Chung Kết nhân đôi điểm,
                và thứ tự không cần khớp hoàn toàn.
              </p>
            </div>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-3">
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-[#888]">Mỗi người trong top 4</div>
              <div className="mt-1 text-base font-bold text-[#f5f5f5]">10 điểm</div>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-[#888]">Thứ tự</div>
              <div className="mt-1 text-base font-bold text-[#f5f5f5]">Không quan trọng</div>
            </div>
            <div className="rounded-xl border border-[#222] bg-[#0a0a0a] px-4 py-3">
              <div className="text-xs uppercase tracking-wider text-[#888]">Vòng Chung Kết</div>
              <div className="mt-1 text-base font-bold text-[#f5f5f5]">X2 điểm</div>
            </div>
          </div>

          <div className="mt-4 rounded-2xl border border-[#222] bg-[#0a0a0a]/90 p-4">
            <div className="flex items-center gap-2 text-xs uppercase tracking-[0.2em] text-[#888]">
              <Sparkles className="h-4 w-4 text-[#dc2626]" />
              Gợi ý nhanh
            </div>
            <p className="mt-2 text-sm leading-relaxed text-[#b7b7b7]">
              Chỉ cần chọn đủ 4 tuyển thủ cho mỗi bảng là hoàn tất dự đoán. Thứ tự không cần đúng,
              giúp người xem dễ thao tác và dễ hiểu ngay khi công bố kết quả.
            </p>
          </div>
        </CardContent>
      </Card>

      <Card hover={false} className="overflow-hidden">
        <CardHeader className="relative p-6 pb-4">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(234,179,8,0.12),transparent_46%),radial-gradient(circle_at_bottom_left,rgba(220,38,38,0.12),transparent_44%)]" />
          <div className="relative flex items-start gap-3">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl border border-yellow-500/20 bg-yellow-500/10 text-yellow-400">
              <Gift className="h-5 w-5" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="text-xs uppercase tracking-[0.22em] text-[#888]">Phần thưởng</div>
              <CardTitle className="mt-1 text-2xl">Top 4 nhận quà theo thứ hạng</CardTitle>
              <p className="mt-3 max-w-xl text-sm leading-relaxed text-[#b7b7b7]">
                Bố cục tập trung vào hai sản phẩm chính để người xem dễ nắm: một dây và một móc
                khóa. Mỗi hạng được tách rõ để tránh nhầm lẫn khi công bố kết quả.
              </p>
            </div>
            <Badge variant="red" className="shrink-0 whitespace-nowrap px-3 py-1">
              4 hạng đầu
            </Badge>
          </div>
        </CardHeader>

        <CardContent>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="relative min-h-[230px] overflow-hidden rounded-3xl border border-[#222] bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(220,38,38,0.18),transparent_58%)]" />
              <Image
                src={lanyardRewardImage}
                alt="Dây TFT phần thưởng"
                fill
                className="object-contain p-4 drop-shadow-[0_24px_35px_rgba(0,0,0,0.5)]"
                sizes="(max-width: 640px) 100vw, 320px"
                priority
              />
              <div className="absolute left-4 top-4">
                <Badge variant="red">1 dây</Badge>
              </div>
            </div>

            <div className="relative min-h-[230px] overflow-hidden rounded-3xl border border-[#222] bg-[#0a0a0a]">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top,rgba(234,179,8,0.16),transparent_58%)]" />
              <Image
                src={keychainRewardImage}
                alt="Móc khóa TFT phần thưởng"
                fill
                className="object-contain p-4 drop-shadow-[0_24px_35px_rgba(0,0,0,0.5)]"
                sizes="(max-width: 640px) 100vw, 320px"
              />
              <div className="absolute left-4 top-4">
                <Badge variant="yellow">1 móc</Badge>
              </div>
            </div>
          </div>

          <div className="mt-4 grid gap-3 sm:grid-cols-2">
            {REWARD_TIERS.map((tier) => {
              const rewardParts = tier.reward.split("+").map((part) => part.trim());

              return (
                <div key={tier.rank} className={`rounded-2xl border p-4 ${tier.cardClass}`}>
                  <div className="flex items-center justify-between gap-3">
                    <Badge
                      variant={tier.rank === 1 ? "yellow" : tier.rank === 2 ? "white" : tier.rank === 3 ? "default" : "red"}
                      className={tier.badgeClass}
                    >
                      {tier.label}
                    </Badge>
                    <span className="text-lg font-black text-[#f5f5f5]">{rewardParts[rewardParts.length - 1]}</span>
                  </div>

                  <div className="mt-3 text-sm font-semibold leading-relaxed text-[#f5f5f5]">
                    {tier.reward}
                  </div>

                  <div className="mt-3 flex flex-wrap gap-2">
                    {rewardParts.map((part) => (
                      <span
                        key={part}
                        className="rounded-full border border-white/10 bg-white/5 px-2.5 py-1 text-[11px] font-medium text-[#d8d8d8]"
                      >
                        {part}
                      </span>
                    ))}
                  </div>
                </div>
              );
            })}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
