"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trophy, Calendar, User, FileText, AlertTriangle, ArrowRight } from "lucide-react";
import { Card } from "@/components/ui/Card";

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
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white">
          Xin chào, <span className="text-sblt-red">{session?.user?.name || "bạn"}</span>!
        </h1>
        <p className="text-sblt-muted mt-2">Chào mừng bạn đến với trang quản lý cá nhân</p>
        <div className="sblt-divider w-16 mt-4" />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {DASHBOARD_LINKS.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="p-6 h-full group">
              <link.icon className="h-8 w-8 text-sblt-red mb-4" />
              <h3 className="text-lg font-semibold mb-1 group-hover:text-sblt-red transition-colors">
                {link.label}
              </h3>
              <p className="text-sblt-muted text-sm">{link.desc}</p>
              <div className="flex items-center gap-1 text-sblt-red text-sm mt-4 opacity-0 group-hover:opacity-100 transition-opacity">
                Mở <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
