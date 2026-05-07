import Link from "next/link";
import Image from "next/image";
import { Trophy, Users, Calendar, Gift, ArrowRight, Zap, Target, Crown } from "lucide-react";
import { auth } from "@/lib/auth";
import { SCORING, PRIZES, CELEBRITY_GUESTS } from "@/lib/constants";
import { Badge } from "@/components/ui/Badge";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { SectionHeading } from "@/components/ui/SectionHeading";

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

  return (
    <div suppressHydrationWarning>
      {/* ===== HERO ===== */}
      <section className="relative overflow-hidden">
        {/* Background effects */}
        <div className="absolute inset-0 bg-gradient-to-b from-sblt-red/8 via-transparent to-transparent" />
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[800px] h-[400px] bg-sblt-red/5 rounded-full blur-[120px]" />

        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16 md:py-24 relative">
          <div className="flex flex-col items-center text-center">
            {/* Logo */}
            <div className="mb-6 animate-pulse-glow rounded-2xl p-2">
              <Image
                src="/logo.png"
                alt="SBLT CUP Logo"
                width={100}
                height={100}
                className="rounded-xl"
                priority
              />
            </div>

            {/* Title */}
            <h1 className="sblt-heading text-6xl md:text-8xl text-white mb-3">
              SBLT <span className="text-gradient-red">CUP</span>
            </h1>

            {/* Subtitle */}
            <div className="flex items-center gap-2 mb-3">
              <div className="sblt-divider w-12" />
              <p className="text-sblt-muted text-sm uppercase tracking-widest">
                Giải Đấu Đấu Trường Chân Lý
              </p>
              <div className="sblt-divider w-12" />
            </div>

            <p className="text-sblt-muted max-w-xl mx-auto mb-8 leading-relaxed">
              Sân chơi giao lưu vui vẻ cho cộng đồng TFT. Cơ hội cọ sát, rèn luyện kỹ năng
              và tâm lý thi đấu trước các giải đấu lớn.
            </p>

            {/* CTA Buttons */}
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

            {/* Quick stats row */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-12 w-full max-w-2xl">
              {[
                { label: "Tuyển thủ", value: "64+", icon: Users },
                { label: "Khách mời", value: "16", icon: Crown },
                { label: "Ngày thi đấu", value: "4", icon: Calendar },
                { label: "Tổng giải thưởng", value: "10Tr", icon: Gift },
              ].map((stat) => (
                <div key={stat.label} className="text-center">
                  <stat.icon className="h-5 w-5 text-sblt-red mx-auto mb-1" />
                  <div className="text-xl font-bold text-white">{stat.value}</div>
                  <div className="text-xs text-sblt-muted">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== TOURNAMENT FORMAT TIMELINE ===== */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Thể thức thi đấu" subtitle="4 vòng đấu từ 19/05 đến 22/05" />

          {/* Timeline connector (desktop) */}
          <div className="relative">
            <div className="hidden md:block absolute top-1/2 left-0 right-0 h-0.5 bg-sblt-border -translate-y-1/2 z-0" />
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4 relative z-10">
              {STAGE_CARDS.map((stage, i) => (
                <Card key={i} className="p-6 relative group">
                  {/* Stage number watermark */}
                  <div className="absolute top-3 right-4 text-6xl font-black text-sblt-border/50 select-none group-hover:text-sblt-red/10 transition-colors sblt-heading">
                    {i + 1}
                  </div>

                  <div className="relative">
                    <div className="text-xs text-sblt-muted mb-1">{stage.day}</div>
                    <h3 className="sblt-heading text-xl text-white mb-1">{stage.name}</h3>
                    <div className="flex items-center gap-2 mb-3">
                      <Badge variant="white">{stage.players}</Badge>
                      <Badge variant="red">{stage.advancing}</Badge>
                    </div>
                    <p className="text-sblt-muted text-sm leading-relaxed">{stage.desc}</p>
                  </div>
                </Card>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== SCORING SYSTEM ===== */}
      <section className="py-16 md:py-20 bg-sblt-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-10 items-start">
            {/* Scoring Table */}
            <div>
              <SectionHeading title="Hệ thống tính điểm" center={false} />
              <Card hover={false} className="overflow-hidden">
                <div className="grid grid-cols-2 text-center font-semibold bg-sblt-dark border-b-2 border-sblt-red">
                  <div className="py-3 border-r border-sblt-border text-sm text-sblt-muted uppercase tracking-wider">Thứ hạng</div>
                  <div className="py-3 text-sm text-sblt-muted uppercase tracking-wider">Điểm số</div>
                </div>
                {Object.entries(SCORING).map(([rank, points], i) => {
                  const isTop = Number(rank) <= 4;
                  return (
                    <div
                      key={rank}
                      className={`grid grid-cols-2 text-center ${
                        i % 2 === 0 ? "bg-sblt-card" : "bg-sblt-black"
                      } ${i < 7 ? "border-b border-sblt-border" : ""}`}
                    >
                      <div className={`py-3 border-r border-sblt-border font-medium ${isTop ? "text-white" : "text-sblt-muted"}`}>
                        {isTop && <Trophy className="inline h-3.5 w-3.5 text-sblt-red mr-1.5 -mt-0.5" />}
                        Top {rank}
                      </div>
                      <div className={`py-3 font-bold ${isTop ? "text-sblt-red text-lg" : "text-sblt-muted"}`}>
                        {points}
                      </div>
                    </div>
                  );
                })}
              </Card>
              <p className="text-xs text-sblt-muted mt-3">
                * Khi bằng điểm, xếp hạng theo thứ hạng game đấu cuối cùng.
              </p>
            </div>

            {/* Prize Pool */}
            <div>
              <SectionHeading title="Cơ cấu giải thưởng" center={false} />
              <Card hover={false} className="overflow-hidden">
                <div className="bg-gradient-to-r from-sblt-red/20 to-transparent p-6 border-b border-sblt-border">
                  <div className="text-sm text-sblt-muted mb-1">Tổng giải thưởng</div>
                  <div className="sblt-heading text-4xl text-white">10,000,000 VNĐ</div>
                </div>
                <div className="divide-y divide-sblt-border">
                  {PRIZES.filter((p) => [1, 2, 3, 4, 5].includes(p.rank)).map((prize) => (
                    <div key={prize.rank} className="flex items-center justify-between px-6 py-3.5">
                      <div className="flex items-center gap-3">
                        <span className={`w-8 h-8 rounded-lg flex items-center justify-center text-sm font-bold ${
                          prize.rank === 1 ? "bg-yellow-500/20 text-yellow-400" :
                          prize.rank === 2 ? "bg-gray-400/20 text-gray-300" :
                          prize.rank === 3 ? "bg-orange-500/20 text-orange-400" :
                          "bg-sblt-border/50 text-sblt-muted"
                        }`}>
                          {prize.rank}
                        </span>
                        <span className="text-sm text-white font-medium">{prize.description}</span>
                      </div>
                      <span className="text-sm font-bold text-sblt-red">{formatVND(prize.amount)}</span>
                    </div>
                  ))}
                </div>
              </Card>
            </div>
          </div>
        </div>
      </section>

      {/* ===== CELEBRITY GUESTS ===== */}
      <section className="py-16 md:py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Khách mời nổi tiếng" subtitle="Những tuyển thủ đặc biệt tham gia từ Vòng 2" />

          {/* Hosts — 2 người, card lớn, ảnh căn giữa đồng đều */}
          <div className="mb-10">
            <div className="flex items-center gap-2 mb-5">
              <Crown className="h-4 w-4 text-sblt-red" />
              <span className="text-xs font-semibold uppercase tracking-widest text-sblt-muted">Host & Tổ chức</span>
              <div className="flex-1 h-px bg-sblt-border ml-2" />
            </div>
            {/* Grid 2 cột, không giới hạn max-w để card đủ lớn */}
            <div className="grid grid-cols-2 gap-5 max-w-lg mx-auto">
              {CELEBRITY_GUESTS.filter((g) => g.role === "Host").map((guest) => (
                <div
                  key={guest.name}
                  className="group relative rounded-2xl overflow-hidden bg-sblt-card border border-sblt-border hover:border-sblt-red/50 transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.2)]"
                >
                  {/* Ảnh: aspect-[3/4] để cao hơn, object-center để căn giữa */}
                  <div className="aspect-[3/4] relative bg-gradient-to-br from-sblt-red/10 to-sblt-dark">
                    {guest.image ? (
                      <Image
                        src={guest.image}
                        alt={guest.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, 256px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-7xl font-black text-sblt-red/20 sblt-heading select-none">
                          {guest.name.charAt(0)}
                        </span>
                      </div>
                    )}
                    {/* Gradient overlay từ dưới lên */}
                    <div className="absolute inset-0 bg-gradient-to-t from-sblt-black via-sblt-black/20 to-transparent" />
                  </div>
                  {/* Info nổi trên ảnh */}
                  <div className="absolute bottom-0 left-0 right-0 p-4">
                    <div className="text-white font-bold text-base leading-tight mb-1.5">{guest.name}</div>
                    <span className="inline-flex items-center gap-1 text-xs bg-sblt-red/20 text-sblt-red border border-sblt-red/30 px-2 py-0.5 rounded-full font-medium">
                      <Crown className="h-2.5 w-2.5" /> {guest.role}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Guest players — grid đồng đều, ảnh căn giữa */}
          <div>
            <div className="flex items-center gap-2 mb-5">
              <Users className="h-4 w-4 text-sblt-red" />
              <span className="text-xs font-semibold uppercase tracking-widest text-sblt-muted">Tuyển thủ khách mời</span>
              <div className="flex-1 h-px bg-sblt-border ml-2" />
            </div>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-7 gap-3">
              {CELEBRITY_GUESTS.filter((g) => g.role === "Khách mời").map((guest) => (
                <div
                  key={guest.name}
                  className={`group relative rounded-xl overflow-hidden border transition-all duration-300 ${
                    guest.confirmed
                      ? "bg-sblt-card border-sblt-border hover:border-sblt-red/50 hover:shadow-[0_0_12px_rgba(220,38,38,0.15)]"
                      : "bg-sblt-dark border-sblt-border/50 opacity-60"
                  }`}
                >
                  {/* Ảnh: aspect-[3/4] đồng đều với host, object-center căn giữa */}
                  <div className="aspect-[3/4] relative bg-gradient-to-br from-sblt-border/30 to-sblt-dark">
                    {guest.image ? (
                      <Image
                        src={guest.image}
                        alt={guest.name}
                        fill
                        className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                        sizes="(max-width: 640px) 50vw, (max-width: 768px) 33vw, 160px"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center">
                        <span className="text-4xl font-black text-sblt-border sblt-heading select-none">
                          {guest.name.replace(/^\./, "").charAt(0)}
                        </span>
                      </div>
                    )}
                    <div className="absolute inset-0 bg-gradient-to-t from-sblt-black via-sblt-black/10 to-transparent" />
                    {!guest.confirmed && (
                      <div className="absolute top-1.5 right-1.5 bg-sblt-dark/90 text-sblt-muted text-[10px] px-1.5 py-0.5 rounded-full border border-sblt-border font-medium">
                        TBC
                      </div>
                    )}
                  </div>
                  {/* Tên */}
                  <div className="absolute bottom-0 left-0 right-0 px-2 pb-2.5 pt-6">
                    <div className="text-white font-semibold text-xs leading-tight text-center truncate">
                      {guest.name}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* ===== RULES PREVIEW ===== */}
      <section className="py-16 md:py-20 bg-sblt-dark/50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <SectionHeading title="Quy định nổi bật" />
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
              <Card key={i} className="p-5">
                <div className="text-sblt-red font-bold text-sm mb-2">Quy định {i + 1}</div>
                <h4 className="text-white font-semibold mb-1">{rule.title}</h4>
                <p className="text-sblt-muted text-sm leading-relaxed">{rule.desc}</p>
              </Card>
            ))}
          </div>
          <div className="text-center mt-8">
            <Link href="/rules">
              <Button variant="outline" size="sm">
                Xem toàn bộ quy định
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* ===== CTA ===== */}
      {!session && (
        <section className="py-16 md:py-20 relative overflow-hidden">
          <div className="absolute inset-0 bg-gradient-to-r from-sblt-red/10 via-sblt-red/5 to-sblt-red/10" />
          <div className="max-w-3xl mx-auto px-4 text-center relative">
            <h2 className="sblt-heading text-4xl text-white mb-4">Sẵn sàng tham gia?</h2>
            <p className="text-sblt-muted mb-8 max-w-lg mx-auto">
              Đăng ký tài khoản ngay để trở thành một phần của giải đấu SBLT CUP
            </p>
            <Link href="/auth/register">
              <Button size="lg">
                Đăng ký ngay
                <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
