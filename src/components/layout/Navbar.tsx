"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut, Shield, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";
import { NotificationBell } from "@/components/notifications/NotificationBell";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/tournaments", label: "Giải đấu" },
  { href: "/leaderboard", label: "Xếp hạng" },
  { href: "/predictions/leaderboard", label: "Dự đoán" },
  { href: "/rules", label: "Quy định" },
  { href: "/announcements", label: "Thông báo" },
];

const DISMISSED_KEY = "sblt_dismissed_announcements";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  useEffect(() => {
    if (!session) return;
    const checkUnseen = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (!res.ok) return;
        await res.json();
        const raw = localStorage.getItem(DISMISSED_KEY);
        const dismissed: string[] = raw ? JSON.parse(raw) : [];
        void dismissed;
      } catch { /* ignore */ }
    };
    checkUnseen();
    const interval = setInterval(checkUnseen, 60000);
    return () => clearInterval(interval);
  }, [session]);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-[#0a0a0a]/95 backdrop-blur-md border-b border-[#222] sticky top-0 z-50" aria-label="Điều hướng chính">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.png"
              alt="SBLT CUP"
              width={36}
              height={36}
              className="rounded"
            />
            <span className="sblt-heading text-xl text-white tracking-widest">
              SBLT CUP
            </span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "relative px-4 py-2 text-sm font-medium transition-colors duration-300 rounded",
                  isActive(link.href)
                    ? "text-white"
                    : "text-[#888] hover:text-white"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-[#dc2626] rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {/* Notification Bell */}
                <NotificationBell />
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded hover:bg-white/5 transition-colors duration-300"
                >
                  {session.user.role === "ADMIN" ? (
                    <Shield className="h-4 w-4 text-[#dc2626]" />
                  ) : (
                    <User className="h-4 w-4 text-[#888]" />
                  )}
                  <span className="text-sm text-[#f5f5f5]">{session.user.name}</span>
                  <ChevronDown className={cn("h-4 w-4 text-[#888] transition-transform duration-300", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 bg-[#111] border border-[#222] rounded-lg shadow-xl z-50 py-1.5">
                      <Link
                        href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#888] hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {session.user.role === "ADMIN" ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        {session.user.role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                      </Link>
                      <div className="border-t border-[#222] my-1" />
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-[#888] hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
                      >
                        <LogOut className="h-4 w-4" />
                        Đăng xuất
                      </button>
                    </div>
                  </>
                )}
              </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <Link
                  href="/auth/login"
                  className="px-4 py-2 text-sm text-[#888] hover:text-white transition-colors duration-300"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold bg-[#dc2626] hover:bg-[#b91c1c] text-white rounded-md transition-all duration-300 hover:shadow-[0_0_20px_rgba(220,38,38,0.3)]"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-[#888] hover:text-white rounded hover:bg-white/5 transition-colors duration-300"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-[#111] border-t border-[#222]">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-3 py-2.5 rounded text-sm font-medium transition-colors duration-300",
                  isActive(link.href)
                    ? "text-white bg-[#dc2626]/10 border-l-2 border-[#dc2626]"
                    : "text-[#888] hover:text-white hover:bg-white/5"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-[#222] pt-3 mt-3 space-y-1">
              {session && (
                <Link
                  href="/dashboard/notifications"
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-[#888] hover:text-white rounded hover:bg-white/5"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Thông báo
                  </span>
                </Link>
              )}
              {session ? (
                <>
                  <Link
                    href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#888] hover:text-white rounded hover:bg-white/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {session.user.role === "ADMIN" ? (
                      <Shield className="h-4 w-4 text-[#dc2626]" />
                    ) : (
                      <User className="h-4 w-4" />
                    )}
                    {session.user.role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                  </Link>
                  <button
                    onClick={() => {
                      signOut();
                      setMobileMenuOpen(false);
                    }}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-[#888] hover:text-red-400 rounded hover:bg-red-500/5 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2.5 text-sm text-[#888] hover:text-white rounded hover:bg-white/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2.5 text-sm font-semibold bg-[#dc2626] text-white rounded text-center"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng ký
                  </Link>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </nav>
  );
}
