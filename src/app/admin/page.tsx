import { redirect } from "next/navigation";
import Link from "next/link";
import { Trophy, Users, User, Bell, AlertTriangle, ClipboardList, ArrowRight } from "lucide-react";
import { prisma } from "@/lib/prisma";
import { Card } from "@/components/ui/Card";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const [tournamentCount, userCount, playerCount, pendingDisputes, pendingRegistrations] = await Promise.all([
    prisma.tournament.count().catch(() => 0),
    prisma.user.count().catch(() => 0),
    prisma.player.count().catch(() => 0),
    prisma.dispute.count({ where: { status: "PENDING" } }).catch(() => 0),
    prisma.registration.count({ where: { status: "PENDING" } }).catch(() => 0),
  ]);

  const stats = [
    { label: "Giải đấu", value: tournamentCount, icon: Trophy, href: "/admin/tournaments" },
    { label: "Tài khoản", value: userCount, icon: Users, href: "/admin/users" },
    { label: "Tuyển thủ", value: playerCount, icon: User, href: "/admin/players" },
    { label: "Kháng nghị chờ", value: pendingDisputes, icon: AlertTriangle, href: "/admin/disputes", highlight: pendingDisputes > 0 },
    { label: "Đăng ký chờ", value: pendingRegistrations, icon: Bell, href: "/admin/tournaments", highlight: pendingRegistrations > 0 },
  ];

  const quickLinks = [
    { label: "Quản lý giải đấu", desc: "Tạo, chỉnh sửa, quản lý giải đấu", icon: Trophy, href: "/admin/tournaments" },
    { label: "Quản lý tài khoản", desc: "Xem và quản lý tài khoản người dùng", icon: Users, href: "/admin/users" },
    { label: "Quản lý tuyển thủ", desc: "Xem hồ sơ và thông tin tuyển thủ", icon: User, href: "/admin/players" },
    { label: "Quản lý thông báo", desc: "Đăng và quản lý thông báo", icon: Bell, href: "/admin/announcements" },
    { label: "Kháng nghị", desc: "Xem và xử lý kháng nghị từ tuyển thủ", icon: AlertTriangle, href: "/admin/disputes" },
    { label: "Nhật ký hoạt động", desc: "Xem lịch sử thay đổi của admin", icon: ClipboardList, href: "/admin/audit-logs" },
  ];

  return (
    <div className="p-6 lg:p-8 max-w-6xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Admin Dashboard</h1>
        <p className="text-sblt-muted mt-1">Quản lý giải đấu SBLT CUP</p>
        <div className="sblt-divider w-16 mt-4" />
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-4 mb-8">
        {stats.map((stat) => (
          <Link key={stat.label} href={stat.href}>
            <Card hover={false} className={`p-4 text-center ${stat.highlight ? "border-sblt-red/50" : ""}`}>
              <stat.icon className={`h-6 w-6 mx-auto mb-2 ${stat.highlight ? "text-sblt-red" : "text-sblt-muted"}`} />
              <div className={`text-2xl font-bold ${stat.highlight ? "text-sblt-red" : "text-white"}`}>{stat.value}</div>
              <div className="text-xs text-sblt-muted mt-1">{stat.label}</div>
            </Card>
          </Link>
        ))}
      </div>

      {/* Quick Links */}
      <h2 className="text-lg font-semibold text-white mb-4">Truy cập nhanh</h2>
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {quickLinks.map((link) => (
          <Link key={link.href} href={link.href}>
            <Card className="p-5 h-full group">
              <link.icon className="h-6 w-6 text-sblt-red mb-3" />
              <h3 className="font-semibold text-white mb-1 group-hover:text-sblt-red transition-colors">{link.label}</h3>
              <p className="text-sblt-muted text-sm">{link.desc}</p>
              <div className="flex items-center gap-1 text-sblt-red text-sm mt-3 opacity-0 group-hover:opacity-100 transition-opacity">
                Mở <ArrowRight className="h-3.5 w-3.5" />
              </div>
            </Card>
          </Link>
        ))}
      </div>
    </div>
  );
}
