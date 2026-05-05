"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Trophy,
  Users,
  Bell,
  LayoutDashboard,
  Eye,
  Shield,
  AlertTriangle,
  ClipboardList,
} from "lucide-react";

const navItems = [
  {
    href: "/admin",
    label: "Dashboard",
    icon: LayoutDashboard,
    exact: true,
  },
  {
    href: "/admin/tournaments",
    label: "Giải đấu",
    icon: Trophy,
  },
  {
    href: "/admin/players",
    label: "Tuyển thủ",
    icon: Users,
  },
  {
    href: "/admin/users",
    label: "Tài khoản",
    icon: Shield,
  },
  {
    href: "/admin/announcements",
    label: "Thông báo",
    icon: Bell,
  },
  {
    href: "/admin/disputes",
    label: "Kháng nghị",
    icon: AlertTriangle,
  },
  {
    href: "/admin/audit-logs",
    label: "Nhật ký",
    icon: ClipboardList,
  },
  {
    href: "/tournaments",
    label: "Xem trước",
    icon: Eye,
  },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string, exact?: boolean) => {
    if (exact) return pathname === href;
    return pathname.startsWith(href) && href !== "/admin";
  };

  return (
    <aside className="w-56 bg-zinc-950 border-r border-red-900/40 flex flex-col shrink-0">
      {/* Header */}
      <div className="px-4 py-5 border-b border-red-900/40">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-red-600" />
          <span className="font-bold text-white text-sm">Admin Console</span>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 px-3 py-4 space-y-1">
        {navItems.map((item) => {
          const active =
            item.exact
              ? pathname === item.href
              : isActive(item.href, item.exact);
          const Icon = item.icon;

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors ${
                active
                  ? "bg-red-600/20 text-red-400 border border-red-600/30"
                  : "text-gray-400 hover:text-white hover:bg-zinc-800"
              }`}
            >
              <Icon className="h-4 w-4 shrink-0" />
              {item.label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-red-900/40">
        <p className="text-xs text-gray-600">SBLT CUP Admin</p>
      </div>
    </aside>
  );
}
