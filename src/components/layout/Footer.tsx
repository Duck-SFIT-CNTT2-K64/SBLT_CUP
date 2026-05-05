import Link from "next/link";
import Image from "next/image";
import { MessageSquare, Globe, ExternalLink } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-sblt-black border-t border-sblt-border mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-10">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-3 mb-4">
              <Image src="/logo.png" alt="SBLT CUP" width={36} height={36} className="rounded-md" />
              <span className="sblt-heading text-xl text-white tracking-wider">SBLT CUP</span>
            </div>
            <p className="text-sblt-muted text-sm leading-relaxed">
              Giải đấu Đấu Trường Chân Lý (TFT) hàng đầu Việt Nam. Sân chơi giao lưu vui vẻ cho cộng đồng TFT.
            </p>
            <p className="text-sblt-muted text-sm mt-2">
              Tổ chức bởi Team 5van & Koi
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Liên kết</h3>
            <ul className="space-y-2.5">
              {[
                { href: "/tournaments", label: "Giải đấu" },
                { href: "/leaderboard", label: "Xếp hạng" },
                { href: "/rules", label: "Quy định" },
                { href: "/announcements", label: "Thông báo" },
              ].map((link) => (
                <li key={link.href}>
                  <Link href={link.href} className="text-sblt-muted hover:text-white text-sm transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Social & Contact */}
          <div>
            <h3 className="text-white font-semibold mb-4 text-sm uppercase tracking-wider">Theo dõi chúng tôi</h3>
            <div className="flex gap-3 mb-6">
              <a
                href="https://youtube.com/@SBLT5vanII"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-sblt-card border border-sblt-border flex items-center justify-center text-sblt-muted hover:text-red-400 hover:border-red-800 transition-colors"
              >
                <ExternalLink className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-sblt-card border border-sblt-border flex items-center justify-center text-sblt-muted hover:text-indigo-400 hover:border-indigo-800 transition-colors"
              >
                <MessageSquare className="h-5 w-5" />
              </a>
              <a
                href="#"
                target="_blank"
                rel="noopener noreferrer"
                className="w-10 h-10 rounded-lg bg-sblt-card border border-sblt-border flex items-center justify-center text-sblt-muted hover:text-sky-400 hover:border-sky-800 transition-colors"
              >
                <Globe className="h-5 w-5" />
              </a>
            </div>
            <div className="text-sblt-muted text-sm space-y-1">
              <p>Đại diện: 5van</p>
              <p>
                <a
                  href="https://youtube.com/@SBLT5vanII"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white transition-colors"
                >
                  YouTube: SBLT 5van II
                </a>
              </p>
            </div>
          </div>
        </div>

        {/* Bottom bar */}
        <div className="sblt-divider mt-10 mb-6" />
        <div className="flex flex-col md:flex-row items-center justify-between gap-4 text-sblt-muted text-sm">
          <p>&copy; {new Date().getFullYear()} SBLT CUP. All rights reserved.</p>
          <p>
            Designed for{" "}
            <span className="text-sblt-red font-medium">Đấu Trường Chân Lý</span>{" "}
            community
          </p>
        </div>
      </div>
    </footer>
  );
}
