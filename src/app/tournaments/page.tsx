"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, ArrowRight } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  season: number;
  description: string | null;
  status: string;
  startDate: string;
  endDate: string;
  maxPlayers: number;
  prizePool: number;
  _count: {
    registrations: number;
  };
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
      }
    } catch (error) {
      console.error("Failed to fetch tournaments:", error);
      setError("Không thể tải danh sách giải đấu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      UPCOMING: "Sắp diễn ra",
      REGISTRATION_OPEN: "Đang mở đăng ký",
      REGISTRATION_CLOSED: "Đã đóng đăng ký",
      IN_PROGRESS: "Đang diễn ra",
      COMPLETED: "Đã kết thúc",
      CANCELLED: "Đã hủy",
    };
    return labels[status] || status;
  };

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      UPCOMING: "text-gray-400",
      REGISTRATION_OPEN: "text-green-400",
      REGISTRATION_CLOSED: "text-yellow-400",
      IN_PROGRESS: "text-blue-400",
      COMPLETED: "text-purple-400",
      CANCELLED: "text-red-400",
    };
    return colors[status] || "text-gray-400";
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("vi-VN", {
      style: "currency",
      currency: "VND",
    }).format(amount);
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Trophy className="h-16 w-16 text-red-600 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Giải đấu SBLT CUP</h1>
        <p className="text-gray-400 max-w-2xl mx-auto">
          Theo dõi và tham gia các mùa giải đấu Đấu Trường Chân Lý
        </p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {tournaments.map((tournament) => (
          <Link
            key={tournament.id}
            href={`/tournaments/${tournament.id}`}
            className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-red-600/50 transition-colors group"
          >
            <div className="p-6">
              <div className="flex items-center justify-between mb-4">
                <span className="text-sm text-gray-500">Mùa {tournament.season}</span>
                <span className={`text-sm font-medium ${getStatusColor(tournament.status)}`}>
                  {getStatusLabel(tournament.status)}
                </span>
              </div>

              <h2 className="text-xl font-bold mb-3 group-hover:text-red-500 transition-colors">
                {tournament.name}
              </h2>

              {tournament.description && (
                <p className="text-gray-400 text-sm mb-4 line-clamp-2">
                  {tournament.description}
                </p>
              )}

              <div className="space-y-3 mb-6">
                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Calendar className="h-4 w-4 text-gray-500" />
                  <span>
                    {new Date(tournament.startDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(tournament.endDate).toLocaleDateString("vi-VN")}
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Users className="h-4 w-4 text-gray-500" />
                  <span>
                    {tournament._count.registrations}/{tournament.maxPlayers} tuyển thủ
                  </span>
                </div>

                <div className="flex items-center gap-2 text-sm text-gray-300">
                  <Trophy className="h-4 w-4 text-gray-500" />
                  <span>Giải thưởng: {formatCurrency(tournament.prizePool)}</span>
                </div>
              </div>

              <div className="flex items-center justify-end text-yellow-500 text-sm font-medium">
                <span className="flex items-center gap-1 text-red-500">
                Xem chi tiết
                <ArrowRight className="h-4 w-4" />
              </span>
              </div>
            </div>
          </Link>
        ))}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-20">
          <Trophy className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Chưa có giải đấu nào</h2>
          <p className="text-gray-500">Các giải đấu sẽ được cập nhật sớm</p>
        </div>
      )}
    </div>
  );
}
