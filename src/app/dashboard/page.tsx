"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trophy, Calendar, User, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

const DASHBOARD_LINKS = [
  { href: "/dashboard/profile", label: "Hồ sơ cá nhân", desc: "Cập nhật thông tin ingame, Discord, số điện thoại", icon: User },
  { href: "/tournaments", label: "Giải đấu", desc: "Xem và đăng ký tham gia giải đấu", icon: Trophy },
  { href: "/dashboard/schedule", label: "Lịch thi đấu", desc: "Xem lịch thi đấu cá nhân", icon: Calendar },
  { href: "/dashboard/results", label: "Kết quả", desc: "Xem kết quả các trận đã tham gia", icon: FileText },
  { href: "/dashboard/disputes", label: "Kháng nghị", desc: "Gửi kháng nghị về kết quả sai hoặc tranh chấp", icon: AlertTriangle },
];

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <RevealOnScroll>
        <div className="mb-8">
          <h1 className="sblt-heading text-3xl text-[#f5f5f5] tracking-tight">
            Xin chào, <span className="text-[#dc2626]">{session?.user?.name || "bạn"}</span>!
          </h1>
          <p className="text-[#888] mt-2 text-sm">Chào mừng bạn đến với trang quản lý cá nhân</p>
          <div className="w-16 h-0.5 bg-[#dc2626] mt-4" />
        </div>
      </RevealOnScroll>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DASHBOARD_LINKS.map((link, i) => (
          <RevealOnScroll key={link.href} delay={i * 0.08}>
            <Link href={link.href}>
              <Card className="p-6 h-full group">
                <link.icon className="h-7 w-7 text-[#dc2626] mb-4" />
                <h3 className="text-lg font-semibold mb-1 group-hover:text-[#dc2626] transition-colors duration-300 text-[#f5f5f5]">
                  {link.label}
                </h3>
                <p className="text-[#888] text-sm">{link.desc}</p>
                <div className="flex items-center gap-1 text-[#dc2626] text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  Mở <ArrowRight className="h-3.5 w-3.5" />
                </div>
              </Card>
            </Link>
          </RevealOnScroll>
        ))}
      </div>
    </div>
  );
}
