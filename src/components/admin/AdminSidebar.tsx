"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Trophy, Users, User, Bell, AlertTriangle, ClipboardList, LayoutDashboard } from "lucide-react";
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/admin", label: "Tổng quan", icon: LayoutDashboard },
  { href: "/admin/tournaments", label: "Giải đấu", icon: Trophy },
  { href: "/admin/users", label: "Tài khoản", icon: Users },
  { href: "/admin/players", label: "Tuyển thủ", icon: User },
  { href: "/admin/announcements", label: "Thông báo", icon: Bell },
  { href: "/admin/disputes", label: "Kháng nghị", icon: AlertTriangle },
  { href: "/admin/audit-logs", label: "Nhật ký", icon: ClipboardList },
];

export default function AdminSidebar() {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/admin") return pathname === "/admin";
    return pathname.startsWith(href);
  };

  return (
    <aside className="w-64 bg-sblt-dark border-r border-sblt-border shrink-0 hidden lg:block">
      <div className="p-4">
        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 mb-4">
          <Trophy className="h-6 w-6 text-sblt-red" />
          <span className="sblt-heading text-lg text-white tracking-wider">ADMIN</span>
        </Link>
        <div className="sblt-divider mb-4" />
        <nav className="space-y-1">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-colors",
                isActive(item.href)
                  ? "bg-sblt-red/10 text-white border-l-2 border-sblt-red"
                  : "text-sblt-muted hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-sblt-red" : "")} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
