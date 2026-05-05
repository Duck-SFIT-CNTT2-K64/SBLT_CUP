"use client";

import Link from "next/link";
import Image from "next/image";
import { usePathname } from "next/navigation";
import { useSession, signOut } from "next-auth/react";
import { useState, useEffect } from "react";
import { Menu, X, User, LogOut, Shield, ChevronDown, Bell } from "lucide-react";
import { cn } from "@/lib/utils";

const navLinks = [
  { href: "/", label: "Trang chủ" },
  { href: "/tournaments", label: "Giải đấu" },
  { href: "/leaderboard", label: "Xếp hạng" },
  { href: "/rules", label: "Quy định" },
  { href: "/announcements", label: "Thông báo" },
];

const DISMISSED_KEY = "sblt_dismissed_announcements";

export default function Navbar() {
  const { data: session } = useSession();
  const pathname = usePathname();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [userMenuOpen, setUserMenuOpen] = useState(false);
  const [unseenCount, setUnseenCount] = useState(0);

  useEffect(() => {
    if (!session) return;
    const checkUnseen = async () => {
      try {
        const res = await fetch("/api/announcements");
        if (!res.ok) return;
        const all: { id: string }[] = await res.json();
        const raw = localStorage.getItem(DISMISSED_KEY);
        const dismissed: string[] = raw ? JSON.parse(raw) : [];
        const count = all.filter((a) => !dismissed.includes(a.id)).length;
        setUnseenCount(count);
      } catch { /* ignore */ }
    };
    checkUnseen();
    const interval = setInterval(checkUnseen, 60000); // check every minute
    return () => clearInterval(interval);
  }, [session]);

  const openPopup = () => {
    const fn = (window as unknown as Record<string, unknown>).__openAnnouncementPopup;
    if (typeof fn === "function") fn();
  };

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname.startsWith(href);
  };

  return (
    <nav className="bg-sblt-black/95 backdrop-blur-md border-b border-sblt-border sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-3 shrink-0">
            <Image
              src="/logo.png"
              alt="SBLT CUP"
              width={40}
              height={40}
              className="rounded-md"
            />
            <span className="sblt-heading text-2xl text-white tracking-wider">
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
                  "relative px-4 py-2 text-sm font-medium transition-colors rounded-lg",
                  isActive(link.href)
                    ? "text-white"
                    : "text-sblt-muted hover:text-white"
                )}
              >
                {link.label}
                {isActive(link.href) && (
                  <span className="absolute bottom-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-sblt-red rounded-full" />
                )}
              </Link>
            ))}
          </div>

          {/* Auth Section */}
          <div className="hidden md:flex items-center gap-3">
            {session ? (
              <>
                {/* Notification Bell */}
                <button
                  onClick={openPopup}
                  className="relative p-2 text-sblt-muted hover:text-white hover:bg-white/5 rounded-lg transition-colors"
                  title="Thông báo"
                >
                  <Bell className="h-5 w-5" />
                  {unseenCount > 0 && (
                    <span className="absolute -top-0.5 -right-0.5 w-4.5 h-4.5 bg-sblt-red text-white text-[10px] font-bold rounded-full flex items-center justify-center min-w-[18px] h-[18px]">
                      {unseenCount > 9 ? "9+" : unseenCount}
                    </span>
                  )}
                </button>
              <div className="relative">
                <button
                  onClick={() => setUserMenuOpen(!userMenuOpen)}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-white/5 transition-colors"
                >
                  {session.user.role === "ADMIN" ? (
                    <Shield className="h-4 w-4 text-sblt-red" />
                  ) : (
                    <User className="h-4 w-4 text-sblt-muted" />
                  )}
                  <span className="text-sm text-white">{session.user.name}</span>
                  <ChevronDown className={cn("h-4 w-4 text-sblt-muted transition-transform", userMenuOpen && "rotate-180")} />
                </button>

                {userMenuOpen && (
                  <>
                    <div className="fixed inset-0 z-40" onClick={() => setUserMenuOpen(false)} />
                    <div className="absolute right-0 mt-2 w-48 sblt-card-static rounded-xl shadow-xl z-50 py-2 border border-sblt-border">
                      <Link
                        href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-sblt-muted hover:text-white hover:bg-white/5 transition-colors"
                        onClick={() => setUserMenuOpen(false)}
                      >
                        {session.user.role === "ADMIN" ? (
                          <Shield className="h-4 w-4" />
                        ) : (
                          <User className="h-4 w-4" />
                        )}
                        {session.user.role === "ADMIN" ? "Admin Panel" : "Dashboard"}
                      </Link>
                      <div className="border-t border-sblt-border my-1" />
                      <button
                        onClick={() => {
                          signOut();
                          setUserMenuOpen(false);
                        }}
                        className="flex items-center gap-2 px-4 py-2 text-sm text-sblt-muted hover:text-red-400 hover:bg-red-500/5 transition-colors w-full"
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
                  className="px-4 py-2 text-sm text-sblt-muted hover:text-white transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="px-4 py-2 text-sm font-semibold bg-sblt-red hover:bg-sblt-red-dark text-white rounded-lg transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden p-2 text-sblt-muted hover:text-white rounded-lg hover:bg-white/5 transition-colors"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-sblt-dark border-t border-sblt-border">
          <div className="px-4 py-3 space-y-1">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "block px-3 py-2.5 rounded-lg text-sm font-medium transition-colors",
                  isActive(link.href)
                    ? "text-white bg-sblt-red/10 border-l-2 border-sblt-red"
                    : "text-sblt-muted hover:text-white hover:bg-white/5"
                )}
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            <div className="border-t border-sblt-border pt-3 mt-3 space-y-1">
              {session && (
                <button
                  onClick={() => { openPopup(); setMobileMenuOpen(false); }}
                  className="flex items-center justify-between w-full px-3 py-2.5 text-sm text-sblt-muted hover:text-white rounded-lg hover:bg-white/5"
                >
                  <span className="flex items-center gap-2">
                    <Bell className="h-4 w-4" />
                    Thông báo
                  </span>
                  {unseenCount > 0 && (
                    <span className="bg-sblt-red text-white text-[10px] font-bold rounded-full px-1.5 py-0.5 min-w-[20px] text-center">
                      {unseenCount}
                    </span>
                  )}
                </button>
              )}
              {session ? (
                <>
                  <Link
                    href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-sblt-muted hover:text-white rounded-lg hover:bg-white/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    {session.user.role === "ADMIN" ? (
                      <Shield className="h-4 w-4 text-sblt-red" />
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
                    className="flex items-center gap-2 px-3 py-2.5 text-sm text-sblt-muted hover:text-red-400 rounded-lg hover:bg-red-500/5 w-full"
                  >
                    <LogOut className="h-4 w-4" />
                    Đăng xuất
                  </button>
                </>
              ) : (
                <>
                  <Link
                    href="/auth/login"
                    className="block px-3 py-2.5 text-sm text-sblt-muted hover:text-white rounded-lg hover:bg-white/5"
                    onClick={() => setMobileMenuOpen(false)}
                  >
                    Đăng nhập
                  </Link>
                  <Link
                    href="/auth/register"
                    className="block px-3 py-2.5 text-sm font-semibold bg-sblt-red text-white rounded-lg text-center"
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
