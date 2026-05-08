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
    <aside className="w-60 bg-[#0d0d0d] border-r border-[#222] shrink-0 hidden lg:block">
      <div className="p-4">
        <Link href="/admin" className="flex items-center gap-2 px-3 py-2 mb-4">
          <Trophy className="h-5 w-5 text-[#dc2626]" />
          <span className="sblt-heading text-base text-white tracking-widest">ADMIN</span>
        </Link>
        <div className="sblt-divider mb-4" />
        <nav className="space-y-0.5">
          {NAV_ITEMS.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 px-3 py-2.5 rounded text-sm font-medium transition-colors duration-300",
                isActive(item.href)
                  ? "bg-[#dc2626]/10 text-white border-l-2 border-[#dc2626]"
                  : "text-[#888] hover:text-white hover:bg-white/5"
              )}
            >
              <item.icon className={cn("h-4 w-4", isActive(item.href) ? "text-[#dc2626]" : "")} />
              {item.label}
            </Link>
          ))}
        </nav>
      </div>
    </aside>
  );
}
