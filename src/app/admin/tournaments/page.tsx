"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Plus, Edit, Trash2, Settings } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  season: number;
  status: string;
  startDate: string;
  endDate: string;
  maxPlayers: number;
  _count: {
    registrations: number;
    stages: number;
  };
}

export default function AdminTournamentsPage() {
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
      setError("Không thể tải danh sách giải đấu.");
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giải đấu này?")) return;

    try {
      const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
      if (res.ok) {
        setTournaments((prev) => prev.filter((t) => t.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete tournament:", error);
    }
  };

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      UPCOMING: "bg-gray-500/20 text-gray-400",
      REGISTRATION_OPEN: "bg-green-500/20 text-green-400",
      REGISTRATION_CLOSED: "bg-yellow-500/20 text-yellow-400",
      IN_PROGRESS: "bg-blue-500/20 text-blue-400",
      COMPLETED: "bg-purple-500/20 text-purple-400",
      CANCELLED: "bg-red-500/20 text-red-400",
    };

    const labels: Record<string, string> = {
      UPCOMING: "Sắp diễn ra",
      REGISTRATION_OPEN: "Đang mở đăng ký",
      REGISTRATION_CLOSED: "Đã đóng đăng ký",
      IN_PROGRESS: "Đang diễn ra",
      COMPLETED: "Đã kết thúc",
      CANCELLED: "Đã hủy",
    };

    return (
      <span className={`px-2 py-1 rounded-full text-xs font-medium ${styles[status] || styles.UPCOMING}`}>
        {labels[status] || status}
      </span>
    );
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Giải đấu</h1>
          <p className="text-gray-400 mt-2">Tạo và quản lý các mùa giải</p>
        </div>
        <Link
          href="/admin/tournaments/new"
          className="bg-red-600 hover:bg-red-700 text-white font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tạo giải đấu
        </Link>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Tên giải đấu</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Mùa</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Trạng thái</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Ngày thi đấu</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Đăng ký</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Vòng đấu</th>
                <th className="text-right py-4 px-6 text-gray-400 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((tournament) => (
                <tr key={tournament.id} className="border-b border-zinc-800 hover:bg-zinc-800/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      <Trophy className="h-5 w-5 text-red-600" />
                      <span className="font-medium">{tournament.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-300">Mùa {tournament.season}</td>
                  <td className="py-4 px-6">{getStatusBadge(tournament.status)}</td>
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    {new Date(tournament.startDate).toLocaleDateString("vi-VN")} -{" "}
                    {new Date(tournament.endDate).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-4 px-6 text-gray-300">
                    {tournament._count.registrations}/{tournament.maxPlayers}
                  </td>
                  <td className="py-4 px-6 text-gray-300">{tournament._count.stages}</td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end gap-2">
                      <Link
                        href={`/admin/tournaments/${tournament.id}`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Quản lý"
                      >
                        <Settings className="h-4 w-4" />
                      </Link>
                      <Link
                        href={`/admin/tournaments/${tournament.id}/edit`}
                        className="p-2 text-gray-400 hover:text-white hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Chỉnh sửa"
                      >
                        <Edit className="h-4 w-4" />
                      </Link>
                      <button
                        onClick={() => handleDelete(tournament.id)}
                        className="p-2 text-gray-400 hover:text-red-400 hover:bg-zinc-700 rounded-lg transition-colors"
                        title="Xóa"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {tournaments.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Trophy className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có giải đấu nào</p>
            <Link
              href="/admin/tournaments/new"
              className="text-red-500 hover:text-red-400 mt-2 inline-block"
            >
              Tạo giải đấu đầu tiên
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
