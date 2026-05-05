"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Trophy, Calendar, Users, Gift, ArrowRight, CheckCircle, Swords, BarChart3, Medal, Download } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { formatCurrency } from "@/lib/utils";

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
    player: { id: string; userId: string; ign: string; isGuest: boolean };
  }[];
  stages: { id: string; name: string; stageOrder: number; date: string; status: string }[];
  prizes: { id: string; rank: number; amount: number; description: string }[];
  _count: { registrations: number };
}

const STATUS_LABELS: Record<string, { label: string; variant: "red" | "green" | "yellow" | "live" | "default" }> = {
  REGISTRATION_OPEN: { label: "Đang mở đăng ký", variant: "green" },
  REGISTRATION_CLOSED: { label: "Đã đóng đăng ký", variant: "yellow" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "live" },
  COMPLETED: { label: "Đã kết thúc", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "red" },
};

const STAGE_STATUS: Record<string, { label: string; variant: "red" | "green" | "live" | "default" }> = {
  COMPLETED: { label: "Đã xong", variant: "green" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "live" },
  UPCOMING: { label: "Sắp diễn ra", variant: "default" },
};

export default function TournamentDetailPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [tournament, setTournament] = useState<Tournament | null>(null);
  const [loading, setLoading] = useState(true);
  const [registering, setRegistering] = useState(false);
  const [isRegistered, setIsRegistered] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

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
          setIsRegistered(data.registrations.some(
            (r: { player: { userId: string } }) => r.player.userId === session.user.id
          ));
        }
      }
    } catch {
      setError("Không thể tải thông tin giải đấu.");
    } finally {
      setLoading(false);
    }
  };

  const handleRegister = async () => {
    if (!session) { window.location.href = "/auth/login"; return; }
    setRegistering(true);
    setActionError(null);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/register`, { method: "POST" });
      if (res.ok) { setIsRegistered(true); fetchTournament(); }
      else { const data = await res.json(); setActionError(data.error || "Đã xảy ra lỗi khi đăng ký"); }
    } catch { setActionError("Đã xảy ra lỗi kết nối"); } finally { setRegistering(false); }
  };

  const handleWithdraw = async () => {
    if (!confirm("Bạn có chắc muốn rút lui khỏi giải đấu này?")) return;
    setActionError(null);
    try {
      const res = await fetch(`/api/tournaments/${params.id}/withdraw`, { method: "POST" });
      const data = await res.json();
      if (res.ok) { setIsRegistered(false); fetchTournament(); }
      else setActionError(data.error || "Đã xảy ra lỗi");
    } catch { setActionError("Đã xảy ra lỗi kết nối"); }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!tournament) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center text-sblt-muted">
        Không tìm thấy giải đấu
      </div>
    );
  }

  const approvedPlayers = tournament.registrations.filter((r) => r.status === "APPROVED");
  const guestPlayers = approvedPlayers.filter((r) => r.player.isGuest);
  const regularPlayers = approvedPlayers.filter((r) => !r.player.isGuest);
  const statusCfg = STATUS_LABELS[tournament.status] || { label: tournament.status, variant: "default" as const };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}
      {actionError && <Alert variant="error" message={actionError} onDismiss={() => setActionError(null)} className="mb-6" />}

      {/* Hero Header */}
      <div className="relative overflow-hidden rounded-2xl bg-sblt-card border border-sblt-border mb-8">
        <div className="absolute inset-0 bg-gradient-to-br from-sblt-red/10 via-transparent to-transparent" />
        <div className="relative p-8 md:p-10">
          <div className="flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
            <div>
              <Badge variant={statusCfg.variant} className="mb-3">{statusCfg.label}</Badge>
              <h1 className="text-3xl md:text-4xl font-bold text-white mb-1">{tournament.name}</h1>
              <p className="text-sblt-muted">Mùa {tournament.season}</p>
              {tournament.description && (
                <p className="text-sblt-muted mt-3 max-w-xl leading-relaxed">{tournament.description}</p>
              )}
            </div>

            {tournament.status === "REGISTRATION_OPEN" && (
              <div className="shrink-0">
                {isRegistered ? (
                  <div className="flex items-center gap-3">
                    <div className="flex items-center gap-2 text-green-400 font-semibold">
                      <CheckCircle className="h-5 w-5" />
                      Đã đăng ký
                    </div>
                    <button onClick={handleWithdraw} className="text-xs text-sblt-muted hover:text-red-400 border border-sblt-border hover:border-red-800 px-3 py-1.5 rounded-lg transition-colors">
                      Rút lui
                    </button>
                  </div>
                ) : (
                  <Button onClick={handleRegister} disabled={registering || !session}>
                    {!session ? "Đăng nhập để đăng ký" : registering ? "Đang đăng ký..." : "Đăng ký tham gia"}
                  </Button>
                )}
              </div>
            )}
          </div>

          {/* Stats row */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-8 pt-6 border-t border-sblt-border">
            {[
              { icon: Users, label: "Tuyển thủ", value: `${tournament._count.registrations}/${tournament.maxPlayers}` },
              { icon: Calendar, label: "Thi đấu", value: `${new Date(tournament.startDate).toLocaleDateString("vi-VN")} — ${new Date(tournament.endDate).toLocaleDateString("vi-VN")}` },
              { icon: Gift, label: "Giải thưởng", value: formatCurrency(tournament.prizePool) },
              { icon: Calendar, label: "Đăng ký", value: `${new Date(tournament.regStart).toLocaleDateString("vi-VN")} — ${new Date(tournament.regEnd).toLocaleDateString("vi-VN")}` },
            ].map((stat) => (
              <div key={stat.label} className="flex items-start gap-3">
                <stat.icon className="h-5 w-5 text-sblt-red mt-0.5 shrink-0" />
                <div>
                  <div className="text-xs text-sblt-muted">{stat.label}</div>
                  <div className="text-sm font-semibold text-white">{stat.value}</div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Quick Links - Full width, prominent */}
      <div className="mb-8">
        <h2 className="text-2xl font-bold text-white mb-6 flex items-center gap-3">
          <Swords className="h-7 w-7 text-sblt-red" />
          Tra cứu giải đấu
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            {
              href: `/tournaments/${tournament.id}/brackets`,
              label: "Bảng đấu",
              desc: "Xem sơ đồ bảng đấu và kết quả bốc thăm",
              icon: Swords,
              color: "from-sblt-red/20 to-transparent",
              iconColor: "text-sblt-red",
            },
            {
              href: `/tournaments/${tournament.id}/results`,
              label: "Kết quả chi tiết",
              desc: "Xem kết quả từng trận đấu và điểm số",
              icon: BarChart3,
              color: "from-sky-500/20 to-transparent",
              iconColor: "text-sky-400",
            },
            {
              href: `/tournaments/${tournament.id}/standings`,
              label: "Bảng xếp hạng",
              desc: "Xem thứ hạng tổng của tất cả tuyển thủ",
              icon: Medal,
              color: "from-amber-500/20 to-transparent",
              iconColor: "text-amber-400",
            },
            {
              href: `/api/tournaments/${tournament.id}/calendar`,
              label: "Thêm vào lịch",
              desc: "Tải file iCal để theo dõi lịch thi đấu",
              icon: Download,
              color: "from-emerald-500/20 to-transparent",
              iconColor: "text-emerald-400",
              download: true,
            },
          ].map((link) => (
            <Link
              key={link.href}
              href={link.href}
              download={link.download}
              className="group relative overflow-hidden bg-sblt-card border border-sblt-border rounded-2xl p-6 hover:border-sblt-red/50 transition-all duration-300 hover:shadow-lg hover:shadow-sblt-red/10"
            >
              <div className={`absolute inset-0 bg-gradient-to-br ${link.color} opacity-0 group-hover:opacity-100 transition-opacity duration-300`} />
              <div className="relative">
                <div className={`w-14 h-14 rounded-xl bg-sblt-dark border border-sblt-border flex items-center justify-center mb-4 group-hover:scale-110 transition-transform duration-300`}>
                  <link.icon className={`h-7 w-7 ${link.iconColor}`} />
                </div>
                <h3 className="text-lg font-bold text-white mb-2 group-hover:text-sblt-red transition-colors">
                  {link.label}
                </h3>
                <p className="text-sblt-muted text-sm leading-relaxed">
                  {link.desc}
                </p>
                <div className="flex items-center gap-2 mt-4 text-sblt-muted group-hover:text-sblt-red transition-colors">
                  <span className="text-sm font-medium">Xem ngay</span>
                  <ArrowRight className="h-4 w-4 group-hover:translate-x-1 transition-transform" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Main Content */}
        <div className="lg:col-span-2 space-y-6">
          {/* Stages */}
          <Card hover={false} className="p-6">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-3">
              <Calendar className="h-6 w-6 text-sblt-red" />
              Các vòng đấu
            </h2>
            <div className="space-y-3">
              {tournament.stages.map((stage) => {
                const stageCfg = STAGE_STATUS[stage.status] || STAGE_STATUS.UPCOMING;
                return (
                  <div key={stage.id} className="flex items-center justify-between p-5 bg-sblt-dark rounded-xl border border-sblt-border">
                    <div>
                      <h3 className="font-semibold text-white text-base">{stage.name}</h3>
                      <p className="text-sblt-muted mt-1">{new Date(stage.date).toLocaleDateString("vi-VN")}</p>
                    </div>
                    <Badge variant={stageCfg.variant}>{stageCfg.label}</Badge>
                  </div>
                );
              })}
            </div>
          </Card>

          {/* Players */}
          <Card hover={false} className="p-6">
            <h2 className="text-xl font-bold mb-5 flex items-center gap-3">
              <Users className="h-6 w-6 text-sblt-red" />
              Tuyển thủ đã đăng ký
            </h2>

            {guestPlayers.length > 0 && (
              <div className="mb-6">
                <h3 className="text-sm uppercase tracking-wider text-sblt-muted mb-3 font-semibold">Khách mời</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {guestPlayers.map((r) => (
                    <div key={r.id} className="bg-sblt-dark rounded-lg px-4 py-3 flex items-center gap-3 border border-sblt-border">
                      <span className="w-2.5 h-2.5 bg-sblt-red rounded-full shrink-0" />
                      <span className="text-white truncate font-medium">{r.player.ign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {regularPlayers.length > 0 && (
              <div>
                <h3 className="text-sm uppercase tracking-wider text-sblt-muted mb-3 font-semibold">Tuyển thủ</h3>
                <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                  {regularPlayers.map((r) => (
                    <div key={r.id} className="bg-sblt-dark rounded-lg px-4 py-3 border border-sblt-border">
                      <span className="text-white truncate font-medium">{r.player.ign}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {approvedPlayers.length === 0 && (
              <p className="text-sblt-muted text-center py-6">Chưa có tuyển thủ nào</p>
            )}
          </Card>
        </div>

        {/* Sidebar - Prizes only */}
        <div className="space-y-6">
          <Card hover={false} className="p-6">
            <h3 className="text-lg font-bold mb-5 flex items-center gap-3">
              <Gift className="h-6 w-6 text-sblt-red" />
              Giải thưởng
            </h3>
            <div className="space-y-3">
              {tournament.prizes.map((prize) => (
                <div key={prize.id} className="flex justify-between">
                  <span className="text-sblt-muted">{prize.description}</span>
                  <span className="font-bold text-white">{formatCurrency(prize.amount)}</span>
                </div>
              ))}
            </div>
          </Card>
        </div>
      </div>

    </div>
  );
}
