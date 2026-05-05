"use client";

import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trophy, Calendar, User, FileText, AlertTriangle } from "lucide-react";

export default function DashboardPage() {
  const { data: session } = useSession();

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Xin chào, {session?.user?.name || "bạn"}!</h1>
        <p className="text-gray-400 mt-2">Chào mừng bạn đến với trang quản lý cá nhân</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/dashboard/profile" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-600/50 transition-colors group">
          <User className="h-10 w-10 text-red-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-red-400 transition-colors">Hồ sơ cá nhân</h3>
          <p className="text-gray-400 text-sm">Cập nhật thông tin ingame, Discord, số điện thoại</p>
        </Link>

        <Link href="/tournaments" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-600/50 transition-colors group">
          <Trophy className="h-10 w-10 text-white mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-red-400 transition-colors">Giải đấu</h3>
          <p className="text-gray-400 text-sm">Xem và đăng ký tham gia giải đấu</p>
        </Link>

        <Link href="/dashboard/schedule" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-600/50 transition-colors group">
          <Calendar className="h-10 w-10 text-white mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-red-400 transition-colors">Lịch thi đấu</h3>
          <p className="text-gray-400 text-sm">Xem lịch thi đấu cá nhân</p>
        </Link>

        <Link href="/dashboard/results" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-600/50 transition-colors group">
          <FileText className="h-10 w-10 text-white mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-red-400 transition-colors">Kết quả</h3>
          <p className="text-gray-400 text-sm">Xem kết quả các trận đã tham gia</p>
        </Link>

        <Link href="/dashboard/disputes" className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 hover:border-red-600/50 transition-colors group">
          <AlertTriangle className="h-10 w-10 text-red-600 mb-4" />
          <h3 className="text-lg font-semibold mb-2 group-hover:text-red-400 transition-colors">Kháng nghị</h3>
          <p className="text-gray-400 text-sm">Gửi kháng nghị về kết quả sai hoặc tranh chấp</p>
        </Link>
      </div>
    </div>
  );
}
