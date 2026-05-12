import Link from "next/link";
import Image from "next/image";
import { Trophy, Users, Calendar, Gift, ArrowRight, Zap, Target, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import { SCORING, PRIZES, CELEBRITY_GUESTS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";
import { LandingIntro } from "@/components/layout/LandingIntro";

const formatVND = (amount: number) =>
  new Intl.NumberFormat("vi-VN").format(amount) + " VNĐ";

const STAGE_CARDS = [
  {
    day: "Ngày 1 — 19/05",
    name: "Vòng Loại",
    players: "64 người",
    desc: "8 bảng × 8 tuyển thủ. Top 2 mỗi bảng đi tiếp. Khách mời không tham gia vòng này.",
    icon: Users,
    advancing: "16 đi tiếp",
  },
  {
    day: "Ngày 2 — 20/05",
    name: "Vòng 2",
    players: "32 người",
    desc: "16 tuyển thủ từ Vòng Loại + 16 khách mời. 4 bảng × 8 người. Top 4 mỗi bảng đi tiếp.",
    icon: Target,
    advancing: "16 đi tiếp",
  },
  {
    day: "Ngày 3 — 21/05",
    name: "Vòng 3",
    players: "16 người",
    desc: "2 bảng × 8 người. Top 4 mỗi bảng vào Chung kết.",
    icon: Zap,
    advancing: "8 đi tiếp",
  },
  {
    day: "Ngày 4 — 22/05",
    name: "Chung Kết",
    players: "8 người",
    desc: "8 tuyển thủ xuất sắc nhất. 3 game đấu tìm nhà vô địch.",
    icon: Crown,
    advancing: "Nhà vô địch",
  },
];

export default async function Home() {
  const session = await auth();

  const getGuestObjectPosition = (image: string | null) => {
    if (!image) return "object-contain object-center brightness-110 contrast-105";
    if (image.includes("emduatft")) return "object-contain object-center brightness-110 contrast-105 scale-[1.96] -translate-x-[75px]";
    if (image.includes("ngoc6mui")) return "object-contain object-center brightness-110 contrast-105 scale-[1.96] -translate-x-[75px]";
    if (image.includes("furyy")) return "object-contain object-center brightness-110 contrast-105 scale-[0.96]";
    // Known bright unconfirmed guests (keep existing special bright styling)
    if (image.includes("duong_thieu_ngu") || image.includes("giay_co_dong")) {
      return "object-contain object-center brightness-140 contrast-110 saturate-110";
    }
    if (image.includes("stillness")) return "object-contain object-center brightness-110 contrast-105 scale-[1.1] translate-y-[5%]";
    if (image.includes("phuonggb")) return "object-contain object-center brightness-110 contrast-105";
    return "object-contain object-center brightness-110 contrast-105";
  };

  const getGuestWrapperClass = (image: string | null) => {
    if (!image) return "aspect-square relative";
    // Keep the grid consistent; only tweak the internal image positioning
    if (image.includes("stillness") || image.includes("phuonggb")) return "aspect-square relative";
    if (image.includes("emduatft") || image.includes("ngoc6mui")) return "aspect-square relative";
    return "aspect-square relative";
  };

  const isBrightUnconfirmedGuest = (image: string | null) =>
    Boolean(image && (image.includes("duong_thieu_ngu") || image.includes("giay_co_dong")));

  return (
    <div suppressHydrationWarning>
      <LandingIntro />

      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-[#dc2626]/[0.06] via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-[#dc2626]/[0.04] rounded-full blur-[120px]" />

        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-20 md:py-32 relative">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <RevealOnScroll>
              <div className="mb-8 animate-pulse-glow rounded-xl p-2">
                <Image
                  src="/logo.png"
                  alt="SBLT CUP Logo"
                  width={96}
                  height={96}
                  className="rounded-lg"
                  priority
                />
              </div>
            </RevealOnScroll>

            {/* Title */}
            <RevealOnScroll delay={0.1}>
              <h1 className="sblt-heading text-6xl md:text-[7rem] text-[#f5f5f5] leading-[0.9] tracking-tight mb-4">
                SBLT <span className="text-gradient-red">CUP</span>
              </h1>
            </RevealOnScroll>

            {/* Subtitle */}
            <RevealOnScroll delay={0.2}>
              <div className="flex items-center gap-3 mb-4">
                <div className="sblt-divider w-12" />
                <p className="text-[#888] text-xs uppercase tracking-[0.25em] font-medium">
                  Giải Đấu Đấu Trường Chân Lý
                </p>
                <div className="sblt-divider w-12" />
              </div>
            </RevealOnScroll>

            <RevealOnScroll delay={0.3}>
              <p className="text-[#888] text-sm max-w-xl mx-auto mb-10 leading-relaxed">
                Sân chơi giao lưu vui vẻ cho cộng đồng TFT. Cơ hội cọ sát, rèn luyện kỹ năng
                và tâm lý thi đấu trước các giải đấu lớn.
              </p>
            </RevealOnScroll>

            {/* CTA Buttons */}
            <RevealOnScroll delay={0.4}>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link href="/tournaments">
                  <Button size="lg">
                    Xem giải đấu
                    <ArrowRight className="h-4 w-4" />
                  </Button>
                </Link>
                {!session && (
                  <Link href="/auth/register">
                    <Button variant="outline" size="lg">
                      Đăng ký tham gia
                    </Button>
                  </Link>
                )}
              </div>
            </RevealOnScroll>

            {/* Quick stats row */}
            <RevealOnScroll delay={0.5}>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6 mt-16 w-full max-w-2xl">
                {[
                  { label: "Tuyển thủ", value: "64+", icon: Users },
                  { label: "Khách mời", value: "16", icon: Crown },
                  { label: "Ngày thi đấu", value: "4", icon: Calendar },
                  { label: "Giải thưởng", value: "10Tr", icon: Gift },
                ].map((stat) => (
                  <div key={stat.label} className="text-center">
                    <stat.icon className="h-5 w-5 text-[#dc2626] mx-auto mb-2" />
                    <div className="text-2xl font-bold text-[#f5f5f5] sblt-heading">{stat.value}</div>
                    <div className="text-xs text-[#888] mt-1">{stat.label}</div>
                  </div>
                ))}
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===== TOURNAMENT FORMAT TIMELINE ===== */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <SectionHeading title="Thể thức thi đấu" subtitle="4 vòng đấu từ 19/05 đến 22/05" />
          </RevealOnScroll>

          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-[#222] -translate-y-1/2 z-0" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
              {STAGE_CARDS.map((stage, i) => (
                <RevealOnScroll key={i} delay={i * 0.1} className="h-full">
                  <Card className="h-full p-6 relative group">
                    <div className="absolute top-3 right-4 text-6xl font-black text-[#222]/50 select-none group-hover:text-[#dc2626]/10 transition-colors duration-500 sblt-heading">
                      {i + 1}
                    </div>

                    <div className="relative">
                      <div className="text-xs text-[#555] mb-1 font-medium uppercase tracking-wider">{stage.day}</div>
                      <h3 className="sblt-heading text-xl text-[#f5f5f5] mb-2">{stage.name}</h3>
                      <div className="flex items-center gap-2 mb-3">
                        <Badge variant="white">{stage.players}</Badge>
                        <Badge variant="red">{stage.advancing}</Badge>
                      </div>
                      <p className="text-[#888] text-sm leading-relaxed">{stage.desc}</p>
                    </div>
                  </Card>
                </RevealOnScroll>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SCORING SYSTEM ===== */}
      <section className="py-20 md:py-28 bg-[#0d0d0d]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12">
            {/* Scoring Table */}
            <RevealOnScroll className="h-full">
              <div className="h-full flex flex-col">
                <SectionHeading title="Hệ thống tính điểm" center={false} />
                <Card hover={false} className="h-full overflow-hidden flex flex-col">
                  <div className="flex-1">
                    <div className="grid grid-cols-2 text-center font-semibold bg-[#0e0e0e] border-b-2 border-[#dc2626]">
                      <div className="py-3 border-r border-[#222] text-xs text-[#888] uppercase tracking-wider">Thứ hạng</div>
                      <div className="py-3 text-xs text-[#888] uppercase tracking-wider">Điểm số</div>
                    </div>
                    {Object.entries(SCORING).map(([rank, points], i) => {
                      const isTop = Number(rank) <= 4;
                      return (
                        <div
                          key={rank}
                          className={`grid grid-cols-2 text-center ${i % 2 === 0 ? "bg-[#111]" : "bg-[#0a0a0a]"
                            } ${i < 7 ? "border-b border-[#222]" : ""}`}
                        >
                          <div className={`py-3 border-r border-[#222] text-sm font-medium ${isTop ? "text-[#f5f5f5]" : "text-[#888]"}`}>
                            {isTop && <Trophy className="inline h-3.5 w-3.5 text-[#dc2626] mr-1.5 -mt-0.5" />}
                            Top {rank}
                          </div>
                          <div className={`py-3 text-sm font-bold ${isTop ? "text-[#dc2626]" : "text-[#888]"}`}>
                            {points}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                  <div className="p-3 bg-[#0a0a0a] border-t border-[#222]">
                    <p className="text-[12px] text-[#555] leading-none italic">
                      * Khi bằng điểm, xếp hạng theo thứ hạng game đấu cuối cùng.
                    </p>
                  </div>
                </Card>
              </div>
            </RevealOnScroll>

            {/* Prize Pool */}
            <RevealOnScroll delay={0.15} className="h-full">
              <div className="h-full flex flex-col">
                <SectionHeading title="Cơ cấu giải thưởng" center={false} />
                <Card hover={false} className="h-full overflow-hidden">
                  <div className="bg-gradient-to-r from-[#dc2626]/20 to-transparent p-6 border-b border-[#222]">
                    <div className="text-xs text-[#888] mb-1 uppercase tracking-wider">Tổng giải thưởng</div>
                    <div className="sblt-heading text-4xl text-[#f5f5f5]">10,000,000 VNĐ</div>
                  </div>
                  <div className="divide-y divide-[#222]">
                    {PRIZES.filter((p) => [1, 2, 3, 4, 5].includes(p.rank)).map((prize) => (
                      <div key={prize.rank} className="flex items-center justify-between px-6 py-3.5">
                        <div className="flex items-center gap-3">
                          <span className={`w-8 h-8 rounded flex items-center justify-center text-sm font-bold ${prize.rank === 1 ? "bg-yellow-500/15 text-yellow-400" :
                            prize.rank === 2 ? "bg-gray-400/15 text-gray-300" :
                              prize.rank === 3 ? "bg-orange-500/15 text-orange-400" :
                                "bg-[#222] text-[#888]"
                            }`}>
                            {prize.rank}
                          </span>
                          <span className="text-sm text-[#f5f5f5] font-medium">{prize.description}</span>
                        </div>
                        <span className="text-sm font-bold text-[#dc2626]">{formatVND(prize.amount)}</span>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </RevealOnScroll>
          </div>
        </div>
      </section>

      {/* ===== CELEBRITY GUESTS ===== */}
      <section className="py-20 md:py-28">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <SectionHeading title="Khách mời nổi tiếng" subtitle="Những tuyển thủ đặc biệt tham gia từ Vòng 2" />
          </RevealOnScroll>

          {/* Hosts */}
          <RevealOnScroll>
            <div className="mb-12">
              <div className="flex items-center gap-2 mb-5">
                <Crown className="h-4 w-4 text-[#dc2626]" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#888]">Host & Tổ chức</span>
                <div className="flex-1 h-px bg-[#222] ml-2" />
              </div>
              <div className="grid grid-cols-2 gap-5 max-w-sm mx-auto">
                {CELEBRITY_GUESTS.filter((g) => g.role === "Host").map((guest) => (
                  <div
                    key={guest.name}
                    className="group relative rounded-lg overflow-hidden bg-[#111] border border-[#222] hover:border-[#dc2626]/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.15)]"
                  >
                    <div className="aspect-[3/4] relative bg-gradient-to-br from-[#dc2626]/10 to-[#111]">
                      {guest.image ? (
                        <Image
                          src={guest.image}
                          alt={guest.name}
                          fill
                          className="object-cover object-top group-hover:scale-105 transition-transform duration-500"
                          sizes="(max-width: 640px) 50vw, 256px"
                        />
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-7xl font-black text-[#dc2626]/20 sblt-heading select-none">
                            {guest.name.charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-[#0a0a0a]/20 to-transparent" />
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 p-4">
                      <div className="text-[#f5f5f5] font-bold text-base leading-tight mb-1.5">{guest.name}</div>
                      <span className="inline-flex items-center gap-1 text-xs bg-[#dc2626]/15 text-[#dc2626] border border-[#dc2626]/25 px-2 py-0.5 rounded font-medium">
                        <Crown className="h-2.5 w-2.5" /> {guest.role}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>

          {/* Guest players */}
          <RevealOnScroll>
            <div>
              <div className="flex items-center gap-2 mb-5">
                <Users className="h-4 w-4 text-[#dc2626]" />
                <span className="text-xs font-semibold uppercase tracking-[0.15em] text-[#888]">Tuyển thủ khách mời</span>
                <div className="flex-1 h-px bg-[#222] ml-2" />
              </div>
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
                {CELEBRITY_GUESTS.filter((g) => g.role === "Khách mời").map((guest) => (
                  <div
                    key={guest.name}
                    className={`group relative rounded-lg overflow-hidden border transition-all duration-300 ${guest.confirmed || isBrightUnconfirmedGuest(guest.image)
                      ? "bg-[#111] border-[#222] hover:border-[#dc2626]/40 hover:shadow-[0_0_12px_rgba(220,38,38,0.1)]"
                      : "bg-[#0d0d0d] border-[#222]/50 opacity-50"
                      }`}
                  >
                    <div className={`${getGuestWrapperClass(guest.image)} bg-[#111]`}>
                      {guest.image ? (
                        <div className="absolute inset-0 transition-transform duration-500 group-hover:scale-110">
                          <Image
                            src={guest.image}
                            alt={guest.name}
                            fill
                            className={getGuestObjectPosition(guest.image)}
                            sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 160px"
                          />
                        </div>
                      ) : (
                        <div className="absolute inset-0 flex items-center justify-center">
                          <span className="text-4xl font-black text-[#222] sblt-heading select-none">
                            {guest.name.replace(/^\./, "").charAt(0)}
                          </span>
                        </div>
                      )}
                      <div className="absolute inset-0 bg-gradient-to-t from-[#0a0a0a] via-transparent to-transparent" />
                      {!guest.confirmed && !isBrightUnconfirmedGuest(guest.image) && (
                        <div className="absolute top-1.5 right-1.5 bg-[#111]/90 text-[#888] text-xs px-1.5 py-0.5 rounded border border-[#222] font-medium">
                          TBC
                        </div>
                      )}
                    </div>
                    <div className="absolute bottom-0 left-0 right-0 px-2 pb-2.5 pt-6">
                      <div className="text-[#f5f5f5] font-semibold text-sm leading-tight text-center truncate">
                        {guest.name}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== RULES PREVIEW ===== */}
      <section className="py-20 md:py-28 bg-[#0d0d0d]">
        <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
          <RevealOnScroll>
            <SectionHeading title="Quy định nổi bật" />
          </RevealOnScroll>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 max-w-4xl mx-auto">
            {[
              {
                title: "Tắt Streamer Mode",
                desc: "Tuyển thủ bắt buộc tắt chế độ che tên để BTC theo dõi và xác nhận kết quả.",
              },
              {
                title: "Đúng Ingame",
                desc: "Sử dụng đúng Ingame đã đăng ký trong suốt giải đấu. Muốn đổi phải liên hệ BTC.",
              },
              {
                title: "Có mặt đúng giờ",
                desc: "Điểm danh trước 15 phút khi trận đấu bắt đầu theo lịch đã chốt.",
              },
            ].map((rule, i) => (
              <RevealOnScroll key={i} delay={i * 0.1} className="h-full">
                <Card className="h-full p-5">
                  <div className="text-[#dc2626] font-bold text-xs mb-2 uppercase tracking-wider">Quy định {i + 1}</div>
                  <h4 className="text-[#f5f5f5] font-semibold mb-1">{rule.title}</h4>
                  <p className="text-[#888] text-sm leading-relaxed">{rule.desc}</p>
                </Card>
              </RevealOnScroll>
            ))}
          </div>
          <RevealOnScroll>
            <div className="text-center mt-10">
              <Link href="/rules">
                <Button variant="outline" size="sm">
                  Xem toàn bộ quy định
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </div>
          </RevealOnScroll>
        </div>
      </section>

      {/* ===== CTA ===== */}
      {!session && (
        <section className="py-20 md:py-28 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-[#dc2626]/[0.08] via-[#dc2626]/[0.04] to-[#dc2626]/[0.08]" />
          <div className="max-w-3xl mx-auto px-4 text-center relative">
            <RevealOnScroll>
              <h2 className="sblt-heading text-4xl md:text-5xl text-[#f5f5f5] mb-4 tracking-tight">Sẵn sàng tham gia?</h2>
            </RevealOnScroll>
            <RevealOnScroll delay={0.1}>
              <p className="text-[#888] text-sm mb-8 max-w-lg mx-auto">
                Đăng ký tài khoản ngay để trở thành một phần của giải đấu SBLT CUP
              </p>
            </RevealOnScroll>
            <RevealOnScroll delay={0.2}>
              <Link href="/auth/register">
                <Button size="lg">
                  Đăng ký ngay
                  <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
            </RevealOnScroll>
          </div>
        </section>
      )}
    </div>
  );
}
