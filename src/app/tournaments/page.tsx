"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Calendar, Users, ArrowRight, Gift } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { formatCurrency } from "@/lib/utils";

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

const STATUS_CONFIG: Record<string, { label: string; variant: "red" | "green" | "yellow" | "live" | "default" }> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "default" },
  REGISTRATION_OPEN: { label: "Đang mở đăng ký", variant: "green" },
  REGISTRATION_CLOSED: { label: "Đã đóng đăng ký", variant: "yellow" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "live" },
  COMPLETED: { label: "Đã kết thúc", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "red" },
};

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
    } catch {
      setError("Không thể tải danh sách giải đấu. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" />
        <p className="text-sblt-muted mt-4">Đang tải giải đấu...</p>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeading
        title="Giải đấu SBLT CUP"
        subtitle="Theo dõi và tham gia các mùa giải đấu Đấu Trường Chân Lý"
      />

      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {tournaments.map((tournament) => {
          const statusCfg = STATUS_CONFIG[tournament.status] || STATUS_CONFIG.UPCOMING;
          return (
            <Link key={tournament.id} href={`/tournaments/${tournament.id}`}>
              <Card className="p-6 h-full group">
                <div className="flex items-center justify-between mb-4">
                  <span className="text-xs text-sblt-muted">Mùa {tournament.season}</span>
                  <Badge variant={statusCfg.variant}>{statusCfg.label}</Badge>
                </div>

                <h2 className="text-xl font-bold mb-2 group-hover:text-sblt-red transition-colors">
                  {tournament.name}
                </h2>

                {tournament.description && (
                  <p className="text-sblt-muted text-sm mb-4 line-clamp-2">
                    {tournament.description}
                  </p>
                )}

                <div className="space-y-2.5 mb-5">
                  <div className="flex items-center gap-2 text-sm text-sblt-muted">
                    <Calendar className="h-4 w-4 shrink-0" />
                    <span>
                      {new Date(tournament.startDate).toLocaleDateString("vi-VN")} —{" "}
                      {new Date(tournament.endDate).toLocaleDateString("vi-VN")}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sblt-muted">
                    <Users className="h-4 w-4 shrink-0" />
                    <span>
                      {tournament._count.registrations}/{tournament.maxPlayers} tuyển thủ
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-sm text-sblt-muted">
                    <Gift className="h-4 w-4 shrink-0" />
                    <span>{formatCurrency(tournament.prizePool)}</span>
                  </div>
                </div>

                <div className="flex items-center justify-end text-sblt-red text-sm font-medium opacity-0 group-hover:opacity-100 transition-opacity">
                  Xem chi tiết
                  <ArrowRight className="h-4 w-4 ml-1" />
                </div>
              </Card>
            </Link>
          );
        })}
      </div>

      {tournaments.length === 0 && (
        <div className="text-center py-20">
          <Trophy className="h-16 w-16 text-sblt-border mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-sblt-muted mb-2">Chưa có giải đấu nào</h2>
          <p className="text-sblt-muted text-sm">Các giải đấu sẽ được cập nhật sớm</p>
        </div>
      )}
    </div>
  );
}
