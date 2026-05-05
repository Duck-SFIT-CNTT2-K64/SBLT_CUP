"use client";

import Link from "next/link";
import { useSession, signOut } from "next-auth/react";
import { useState } from "react";
import { Menu, X, Trophy, User, LogOut, Shield } from "lucide-react";

export default function Navbar() {
  const { data: session } = useSession();
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const navLinks = [
    { href: "/", label: "Trang chủ" },
    { href: "/tournaments", label: "Giải đấu" },
    { href: "/leaderboard", label: "Xếp hạng" },
    { href: "/rules", label: "Quy định" },
    { href: "/announcements", label: "Thông báo" },
  ];

  return (
    <nav className="bg-black border-b border-red-900/50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2">
            <Trophy className="h-8 w-8 text-red-600" />
            <span className="text-xl font-bold text-white">SBLT CUP</span>
          </Link>

          {/* Desktop Nav */}
          <div className="hidden md:flex items-center gap-6">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="text-gray-300 hover:text-white transition-colors"
              >
                {link.label}
              </Link>
            ))}
          </div>

          {/* Auth Buttons */}
          <div className="hidden md:flex items-center gap-4">
            {session ? (
              <div className="flex items-center gap-4">
                <Link
                  href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  className="flex items-center gap-2 text-gray-300 hover:text-white"
                >
                  {session.user.role === "ADMIN" ? (
                    <Shield className="h-4 w-4 text-red-500" />
                  ) : (
                    <User className="h-4 w-4" />
                  )}
                  {session.user.name}
                </Link>
                <button
                  onClick={() => signOut()}
                  className="flex items-center gap-2 text-gray-400 hover:text-white"
                >
                  <LogOut className="h-4 w-4" />
                  Đăng xuất
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-3">
                <Link
                  href="/auth/login"
                  className="text-gray-300 hover:text-white transition-colors"
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg transition-colors"
                >
                  Đăng ký
                </Link>
              </div>
            )}
          </div>

          {/* Mobile menu button */}
          <button
            className="md:hidden text-gray-300 hover:text-white"
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
          >
            {mobileMenuOpen ? <X className="h-6 w-6" /> : <Menu className="h-6 w-6" />}
          </button>
        </div>
      </div>

      {/* Mobile Menu */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-black border-t border-red-900/50">
          <div className="px-4 py-3 space-y-3">
            {navLinks.map((link) => (
              <Link
                key={link.href}
                href={link.href}
                className="block text-gray-300 hover:text-white py-2"
                onClick={() => setMobileMenuOpen(false)}
              >
                {link.label}
              </Link>
            ))}
            {session ? (
              <>
                <Link
                  href={session.user.role === "ADMIN" ? "/admin" : "/dashboard"}
                  className="block text-gray-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Dashboard
                </Link>
                <button
                  onClick={() => {
                    signOut();
                    setMobileMenuOpen(false);
                  }}
                  className="block text-gray-400 hover:text-white py-2"
                >
                  Đăng xuất
                </button>
              </>
            ) : (
              <>
                <Link
                  href="/auth/login"
                  className="block text-gray-300 hover:text-white py-2"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng nhập
                </Link>
                <Link
                  href="/auth/register"
                  className="block bg-red-600 text-white font-semibold px-4 py-2 rounded-lg text-center"
                  onClick={() => setMobileMenuOpen(false)}
                >
                  Đăng ký
                </Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
}
