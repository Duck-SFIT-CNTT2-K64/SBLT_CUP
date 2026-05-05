"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trophy, Calendar, Users, Gift, ArrowRight, CheckCircle } from "lucide-react";

interface Tournament {
  id: string;
  name: string;
  season: number;
  description: string | null;
  status: string;
  regStart: string;
  regEnd: string;
  startDate: string;
  endDate: string;
  maxPlayers: number;
  prizePool: number;
  registrations: {
    id: string;
    status: string;
    player: {
      id: string;
      userId: string;
      ign: string;
      isGuest: boolean;
    };
  }[];
  stages: {
    id: string;
    name: string;
    stageOrder: number;
    date: string;
    status: string;
  }[];
  prizes: {
    id: string;
    rank: number;
    amount: number;
    description: string;
  }[];
  _count: {
    registrations: number;
  };
}

export default function TournamentDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchTournament();
  }, [params.id, session?.user?.id]);

  const fetchTournament = async () => {
    try {
      const res = await fetch(`/api/tournaments/${params.id}`);
      if (res.ok) {
        const data = await res.json();
        setTournament(data);

        if (session?.user?.id) {
          const registered = data.registrations.some(
            (r: { player: { id: string; userId: string } }) => r.player.userId === session.user.id
          );
          setIsRegistered(registered);
        }
      }
    } catch (error) {
      console.error("Failed to fetch tournament:", error);
      setError("Không thể tải thông tin giải đấu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!session) {
      window.location.href = "/auth/login";
      return;
    }

    setRegistering(true);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/register`, {
        method: "POST",
      });

      if (res.ok) {
        setIsRegistered(true);
        fetchTournament();
      } else {
        const data = await res.json();
        alert(data.error || "Đã xảy ra lỗi khi đăng ký");
      }
    } catch (error) {
      console.error("Failed to register:", error);
    } finally {
      setRegistering(false);
    }
  };

  const handleWithdraw = async () => {
    if (!confirm("Bạn có chắc muốn rút lui khỏi giải đấu này?")) return;
    try {
      const res = await fetch(`/api/tournaments/${params.id}/withdraw`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setIsRegistered(false); fetchTournament(); }
      else alert(data.error || "Đã xảy ra lỗi");
    } catch { alert("Đã xảy ra lỗi"); }
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

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-gray-400">Không tìm thấy giải đấu</div>
      </div>
    );
  }

  const approvedPlayers = tournament.registrations.filter((r) => r.status === "APPROVED");
  const guestPlayers = approvedPlayers.filter((r) => r.player.isGuest);
  const regularPlayers = approvedPlayers.filter((r) => !r.player.isGuest);

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}
      {/* Header */}
      <div className="text-center mb-12">
        <div className="flex justify-center mb-4">
          <Trophy className="h-16 w-16 text-red-600" />
        </div>
        <h1 className="text-4xl font-bold mb-2">{tournament.name}</h1>
        <p className="text-gray-400">Mùa {tournament.season}</p>
        {tournament.description && (
          <p className="text-gray-300 mt-4 max-w-2xl mx-auto">{tournament.description}</p>
        )}
      </div>

      {/* Status & Registration */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-6 mb-8">
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-6">
            <div>
              <div className="text-sm text-gray-500">Trạng thái</div>
              <div className="font-semibold text-red-500">
                {tournament.status === "REGISTRATION_OPEN"
                  ? "Đang mở đăng ký"
                  : tournament.status === "IN_PROGRESS"
                  ? "Đang diễn ra"
                  : tournament.status}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Số lượng</div>
              <div className="font-semibold">
                {tournament._count.registrations}/{tournament.maxPlayers}
              </div>
            </div>
            <div>
              <div className="text-sm text-gray-500">Giải thưởng</div>
              <div className="font-semibold text-green-400">
                {formatCurrency(tournament.prizePool)}
              </div>
            </div>
          </div>

          {tournament.status === "REGISTRATION_OPEN" && (
            <div>
              {isRegistered ? (
                <div className="flex items-center gap-3">
                  <div className="flex items-center gap-2 text-green-400 font-semibold">
                    <CheckCircle className="h-5 w-5" />
                    Đã đăng ký
                  </div>
                  {tournament.status === "REGISTRATION_OPEN" && (
                    <button
                      onClick={handleWithdraw}
                      className="text-xs text-gray-400 hover:text-red-400 border border-zinc-700 hover:border-red-600/50 px-3 py-1.5 rounded-lg transition-colors"
                    >
                      Rút lui
                    </button>
                  )}
                </div>
              ) : (
                <button
                  onClick={handleRegister}
                  disabled={registering || !session}
                  className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-bold px-6 py-3 rounded-lg transition-colors"
                >
                  {!session
                    ? "Đăng nhập để đăng ký"
                    : registering
                    ? "Đang đăng ký..."
                    : "Đăng ký tham gia"}
                </button>
              )}
            </div>
          )}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-8">
          {/* Stages */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Calendar className="h-5 w-5 text-red-600" />
              Các vòng đấu
            </h2>
            <div className="space-y-4">
              {tournament.stages.map((stage) => (
                <div key={stage.id} className="flex items-center justify-between p-4 bg-gray-800 rounded-lg">
                  <div>
                    <h3 className="font-semibold">{stage.name}</h3>
                    <p className="text-sm text-gray-400">
                      {new Date(stage.date).toLocaleDateString("vi-VN")}
                    </p>
                  </div>
                  <span
                    className={`px-3 py-1 rounded-full text-xs font-medium ${
                      stage.status === "COMPLETED"
                        ? "bg-green-500/20 text-green-400"
                        : stage.status === "IN_PROGRESS"
                        ? "bg-blue-500/20 text-blue-400"
                        : "bg-gray-500/20 text-gray-400"
                    }`}
                  >
                    {stage.status === "COMPLETED"
                      ? "Đã xong"
                      : stage.status === "IN_PROGRESS"
                      ? "Đang diễn ra"
                      : "Sắp diễn ra"}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Players */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
              <Users className="h-5 w-5 text-red-600" />
              Tuyển thủ đã đăng ký
            </h2>

            {guestPlayers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm font-medium text-gray-400 mb-3">Khách mời</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {guestPlayers.map((r) => (
                    <div
                      key={r.id}
                      className="bg-gray-800 rounded-lg px-3 py-2 text-sm flex items-center gap-2"
                    >
                      <span className="w-2 h-2 bg-red-600 rounded-full" />
                      {r.player.ign}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {regularPlayers.length > 0 && (
              <div>
                <h3 className="text-sm font-medium text-gray-400 mb-3">Tuyển thủ</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
                  {regularPlayers.map((r) => (
                    <div
                      key={r.id}
                      className="bg-gray-800 rounded-lg px-3 py-2 text-sm"
                    >
                      {r.player.ign}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approvedPlayers.length === 0 && (
              <p className="text-gray-500 text-center py-4">Chưa có tuyển thủ nào</p>
            )}
          </div>
        </div>

        {/* Sidebar */}
        <div className="space-y-6">
          {/* Quick Info */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Thông tin nhanh</h3>
            <div className="space-y-3 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-400">Ngày đăng ký</span>
                <span>
                  {new Date(tournament.regStart).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(tournament.regEnd).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Ngày thi đấu</span>
                <span>
                  {new Date(tournament.startDate).toLocaleDateString("vi-VN")} -{" "}
                  {new Date(tournament.endDate).toLocaleDateString("vi-VN")}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-400">Số lượng tối đa</span>
                <span>{tournament.maxPlayers} tuyển thủ</span>
              </div>
            </div>
          </div>

          {/* Prizes */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4 flex items-center gap-2">
              <Gift className="h-5 w-5 text-red-600" />
              Giải thưởng
            </h3>
            <div className="space-y-2">
              {tournament.prizes.map((prize) => (
                <div key={prize.id} className="flex justify-between text-sm">
                  <span className="text-gray-400">{prize.description}</span>
                  <span className="font-medium">{formatCurrency(prize.amount)}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Links */}
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6">
            <h3 className="font-semibold mb-4">Xem thêm</h3>
            <div className="space-y-2">
              <Link
                href={`/tournaments/${tournament.id}/brackets`}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm">Bảng đấu (Rounds)</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                href={`/tournaments/${tournament.id}/results`}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm">Kết quả chi tiết</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <Link
                href={`/tournaments/${tournament.id}/standings`}
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm">Bảng xếp hạng</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </Link>
              <a
                href={`/api/tournaments/${tournament.id}/calendar`}
                download
                className="flex items-center justify-between p-3 bg-zinc-800 rounded-lg hover:bg-zinc-700 transition-colors"
              >
                <span className="text-sm">📅 Thêm vào lịch (iCal)</span>
                <ArrowRight className="h-4 w-4 text-gray-400" />
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
