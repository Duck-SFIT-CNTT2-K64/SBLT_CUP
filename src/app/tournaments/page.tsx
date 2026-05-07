"use client";

import { useState, useEffect } from "react";
import { Trophy } from "lucide-react";
import { Alert } from "@/components/ui/Alert";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { TournamentCard } from "@/components/tft";

interface Tournament {
  id: string;
  name: string;
  season: number;
  description: string | null;
  status: "UPCOMING" | "REGISTRATION_OPEN" | "IN_PROGRESS" | "COMPLETED" | "REGISTRATION_CLOSED" | "CANCELLED";
  startDate: string;
  endDate: string;
  maxPlayers: number;
  prizePool: number;
  _count: { registrations: number };
}

/** Chọn accent dựa trên trạng thái giải đấu */
function getAccent(status: string, season: number): "hextech" | "gold" | "red" {
  if (status === "IN_PROGRESS") return "red";
  if (status === "COMPLETED") return "gold";
  // Xen kẽ hextech / red cho các giải sắp tới
  return season % 2 === 0 ? "hextech" : "red";
}

export default function TournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/tournaments")
      .then((r) => r.json())
      .then((json) => setTournaments(json.data ?? []))
      .catch(() => setError("Không thể tải danh sách giải đấu. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

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

      {error && (
        <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />
      )}

      {/* Grid — pt-12 để chừa chỗ cho mascot break-out */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6 pt-12">
        {tournaments.map((t) => (
          <TournamentCard
            key={t.id}
            id={t.id}
            name={t.name}
            season={t.season}
            status={t.status}
            startDate={t.startDate}
            endDate={t.endDate}
            registeredCount={t._count.registrations}
            maxPlayers={t.maxPlayers}
            prizePool={t.prizePool}
            accent={getAccent(t.status, t.season)}
          />
        ))}
      </div>

      {tournaments.length === 0 && !error && (
        <div className="text-center py-20">
          <Trophy className="h-16 w-16 text-sblt-border mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-sblt-muted mb-2">Chưa có giải đấu nào</h2>
          <p className="text-sblt-muted text-sm">Các giải đấu sẽ được cập nhật sớm</p>
        </div>
      )}
    </div>
  );
}
