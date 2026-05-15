import Link from "next/link";
import Image from "next/image";
import { MessageSquare, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-[#0a0a0a] border-t border-[#222] mt-auto">
      <div className="max-w-[1280px] mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="SBLT CUP" width={32} height={32} className="rounded" />
              <span className="sblt-heading text-lg text-white tracking-widest">SBLT CUP</span>
            </div>
            <p className="text-[#888] text-sm leading-relaxed">
              Giải đấu Đấu Trường Chân Lý (TFT) hàng đầu Việt Nam. Sân chơi giao lưu vui vẻ cho cộng đồng TFT.
            </p>
            <p className="text-[#555] text-sm mt-2">
              Tổ chức bởi Team 5van & Koi
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-[#f5f5f5] font-semibold mb-4 text-xs uppercase tracking-widest">Liên kết</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/tournaments", label: "Giải đấu" },
                { href: "/leaderboard", label: "Xếp hạng" },
                { href: "/rules", label: "Quy định" },
                { href: "/announcements", label: "Thông báo" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-[#888] hover:text-white text-sm transition-colors duration-300">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-[#f5f5f5] font-semibold mb-4 text-xs uppercase tracking-widest">Theo dõi chúng tôi</h3>
            <div className="flex gap-3 mb-6">
              <a
                href="https://www.youtube.com/@namvan1796"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-[#888] hover:text-[#dc2626] hover:border-[#dc2626]/40 hover:shadow-[0_0_12px_rgba(220,38,38,0.15)] transition-all duration-300"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <a
                href="https://discord.com/invite/senaempire36"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-[#111] border border-[#222] flex items-center justify-center text-[#888] hover:text-[#f5f5f5] hover:border-[#444] transition-all duration-300"
              >
                <MessageSquare className="h-5 w-5" />
              </a>
            </div>
            <div className="text-[#888] text-sm space-y-1">
              <p>Đại diện: 5van</p>
              <p>
                <a
                  href="https://www.youtube.com/@namvan1796"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors duration-300"
                >
                  YouTube: @namvan1796
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sblt-divider mt-10 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-[#555] text-sm">
          <p>&copy; {new Date().getFullYear()} SBLT CUP. All rights reserved.</p>
          <div className="flex items-center gap-4">
            <p>
              Designed for{" "}
              <span className="text-[#dc2626] font-medium">Đấu Trường Chân Lý</span>{" "}
              community
            </p>
            <span className="text-[#333]">|</span>
            <p>
              Phát triển bởi{" "}
              <a
                href="https://duckcy.me/"
                target="_blank"
                rel="noopener noreferrer"
                className="text-[#3b82f6] hover:text-white transition-colors duration-300"
              >
                Duckcy
              </a>
            </p>
          </div>
        </div>
      </div>
    </footer>
  );
}
