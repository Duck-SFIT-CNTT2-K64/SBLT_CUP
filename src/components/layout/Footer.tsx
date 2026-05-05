import Link from "next/link";
import { Trophy } from "lucide-react";

export default function Footer() {
  return (
    <footer className="bg-black border-t border-red-900/50 mt-auto">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {/* Brand */}
          <div>
            <div className="flex items-center gap-2 mb-4">
              <Trophy className="h-6 w-6 text-red-600" />
              <span className="text-lg font-bold text-white">SBLT CUP</span>
            </div>
            <p className="text-gray-400 text-sm">
              Giải đấu Đấu Trường Chân Lý (TFT) hàng đầu Việt Nam
            </p>
          </div>

          {/* Links */}
          <div>
            <h3 className="text-white font-semibold mb-3">Liên kết</h3>
            <ul className="space-y-2">
              <li>
                <Link href="/tournaments" className="text-gray-400 hover:text-white text-sm">
                  Giải đấu
                </Link>
              </li>
              <li>
                <Link href="/rules" className="text-gray-400 hover:text-white text-sm">
                  Quy định
                </Link>
              </li>
              <li>
                <Link href="/announcements" className="text-gray-400 hover:text-white text-sm">
                  Thông báo
                </Link>
              </li>
            </ul>
          </div>

          {/* Contact */}
          <div>
            <h3 className="text-white font-semibold mb-3">Liên hệ</h3>
            <ul className="space-y-2 text-gray-400 text-sm">
              <li>Đơn vị tổ chức: Team 5van & Koi</li>
              <li>Đại diện: 5van</li>
              <li>
                <a
                  href="https://youtube.com/@SBLT5vanII"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-white"
                >
                  YouTube: SBLT 5van II
                </a>
              </li>
            </ul>
          </div>
        </div>

        <div className="border-t border-red-900/30 mt-8 pt-6 text-center text-gray-500 text-sm">
          &copy; {new Date().getFullYear()} SBLT CUP. All rights reserved.
        </div>
      </div>
    </footer>
  );
}
