import Link from "next/link";
import { Trophy, Users, Calendar, Gift, ArrowRight } from "lucide-react";
import { auth } from "@/lib/auth";

export default async function Home() {
  const session = await auth();

  return (
    <div>
      {/* Hero Section */}
      <section className="relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-red-900/20 via-transparent to-red-900/10" />
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 relative">
          <div className="text-center">
            <div className="flex justify-center mb-6">
              <Trophy className="h-20 w-20 text-red-600" />
            </div>
            <h1 className="text-5xl md:text-7xl font-bold mb-4">
              <span className="text-red-600">SBLT</span> CUP
            </h1>
            <p className="text-xl md:text-2xl text-gray-300 mb-2">
              Giải Đấu Đấu Trường Chân Lý
            </p>
            <p className="text-gray-400 mb-8 max-w-2xl mx-auto">
              Sân chơi giao lưu vui vẻ cho cộng đồng TFT. Cơ hội cọ sát, rèn luyện kỹ năng
              và tâm lý thi đấu trước các giải đấu lớn.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                href="/tournaments"
                className="bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors flex items-center justify-center gap-2"
              >
                Xem giải đấu
                <ArrowRight className="h-5 w-5" />
              </Link>
              {!session && (
                <Link
                  href="/auth/register"
                  className="border border-red-600 text-red-500 hover:bg-red-600/10 font-bold px-8 py-3 rounded-lg transition-colors"
                >
                  Đăng ký tham gia
                </Link>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* Info Cards */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Users className="h-10 w-10 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">64 tuyển thủ</h3>
            <p className="text-gray-400 text-sm">
              Giải đấu quy tụ 64 tuyển thủ tranh tài cùng 16 khách mời nổi tiếng
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Calendar className="h-10 w-10 text-white mb-4" />
            <h3 className="text-lg font-semibold mb-2">4 ngày thi đấu</h3>
            <p className="text-gray-400 text-sm">
              Từ 19/05 đến 22/05, mỗi ngày từ 18h00 đến 23h00
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Gift className="h-10 w-10 text-red-600 mb-4" />
            <h3 className="text-lg font-semibold mb-2">10,000,000 VNĐ</h3>
            <p className="text-gray-400 text-sm">
              Tổng giải thưởng lên đến 10 triệu đồng cho các tuyển thủ xuất sắc
            </p>
          </div>

          <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6">
            <Trophy className="h-10 w-10 text-white mb-4" />
            <h3 className="text-lg font-semibold mb-2">Thể thức BO3</h3>
            <p className="text-gray-400 text-sm">
              Mỗi bảng đấu đánh 3 game, tính điểm tích lũy để tìm ra người chiến thắng
            </p>
          </div>
        </div>
      </section>

      {/* Tournament Format */}
      <section className="bg-zinc-900/50 py-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-3xl font-bold text-center mb-12">Thể thức thi đấu</h2>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              {
                day: "Ngày 1 - 19/05",
                name: "Vòng Loại",
                desc: "64 người chia 8 bảng, Top 2 mỗi bảng đi tiếp",
                color: "text-red-400",
              },
              {
                day: "Ngày 2 - 20/05",
                name: "Vòng 2",
                desc: "32 người (16 + 16 khách mời), Top 4 mỗi bảng đi tiếp",
                color: "text-red-300",
              },
              {
                day: "Ngày 3 - 21/05",
                name: "Vòng 3",
                desc: "16 người chia 2 bảng, Top 4 mỗi bảng vào Chung kết",
                color: "text-white",
              },
              {
                day: "Ngày 4 - 22/05",
                name: "Chung Kết",
                desc: "8 tuyển thủ xuất sắc nhất tranh ngôi vô địch",
                color: "text-red-500",
              },
            ].map((stage, i) => (
              <div key={i} className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 relative">
                <div className="text-sm text-gray-500 mb-2">{stage.day}</div>
                <h3 className={`text-xl font-bold mb-2 ${stage.color}`}>{stage.name}</h3>
                <p className="text-gray-400 text-sm">{stage.desc}</p>
                <div className="absolute top-4 right-4 text-5xl font-bold text-zinc-800">
                  {i + 1}
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Scoring System */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-16">
        <h2 className="text-3xl font-bold text-center mb-12">Hệ thống tính điểm</h2>
        <div className="max-w-lg mx-auto">
          <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
            <div className="grid grid-cols-2 text-center font-semibold bg-zinc-800">
              <div className="py-3 border-r border-zinc-700">Thứ hạng</div>
              <div className="py-3">Điểm số</div>
            </div>
            {[
              { rank: "Top 1", points: 8 },
              { rank: "Top 2", points: 7 },
              { rank: "Top 3", points: 6 },
              { rank: "Top 4", points: 5 },
              { rank: "Top 5", points: 4 },
              { rank: "Top 6", points: 3 },
              { rank: "Top 7", points: 2 },
              { rank: "Top 8", points: 1 },
            ].map((row, i) => (
              <div
                key={i}
                className={`grid grid-cols-2 text-center ${
                  i % 2 === 0 ? "bg-zinc-900" : "bg-zinc-900/50"
                } ${i < 7 ? "border-b border-zinc-800" : ""}`}
              >
                <div className="py-3 border-r border-zinc-800 font-medium">{row.rank}</div>
                <div className="py-3 font-bold text-red-500">{row.points}</div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA — chỉ hiện khi chưa đăng nhập */}
      {!session && (
        <section className="bg-gradient-to-r from-red-900/30 to-red-800/20 py-16">
          <div className="max-w-4xl mx-auto px-4 text-center">
            <h2 className="text-3xl font-bold mb-4">Sẵn sàng tham gia?</h2>
            <p className="text-gray-300 mb-8">
              Đăng ký tài khoản ngay để trở thành một phần của giải đấu SBLT CUP
            </p>
            <Link
              href="/auth/register"
              className="inline-block bg-red-600 hover:bg-red-700 text-white font-bold px-8 py-3 rounded-lg transition-colors"
            >
              Đăng ký ngay
            </Link>
          </div>
        </section>
      )}
    </div>
  );
}
