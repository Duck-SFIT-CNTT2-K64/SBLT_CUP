"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Plus, Edit, Trash2, Settings } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Tournament {
  id: string; name: string; season: number; status: string; startDate: string; endDate: string; maxPlayers: number;
  _count: { registrations: number; stages: number };
}

const STATUS_MAP: Record<string, { label: string; variant: "red" | "green" | "yellow" | "live" | "default" }> = {
  UPCOMING: { label: "Sắp diễn ra", variant: "default" },
  REGISTRATION_OPEN: { label: "Đang mở đăng ký", variant: "green" },
  REGISTRATION_CLOSED: { label: "Đã đóng đăng ký", variant: "yellow" },
  IN_PROGRESS: { label: "Đang diễn ra", variant: "live" },
  COMPLETED: { label: "Đã kết thúc", variant: "default" },
  CANCELLED: { label: "Đã hủy", variant: "red" },
};

export default function AdminTournamentsPage() {
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchTournaments(); }, []);

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) setTournaments(await res.json());
    } catch { setError("Không thể tải danh sách giải đấu."); } finally { setLoading(false); }
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giải đấu này?")) return;
    const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    if (res.ok) setTournaments((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Giải đấu</h1>
          <p className="text-sblt-muted mt-1">Tạo và quản lý các mùa giải</p>
        </div>
        <Link href="/admin/tournaments/new"><Button size="sm"><Plus className="h-4 w-4" /> Tạo giải đấu</Button></Link>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sblt-dark border-b-2 border-sblt-red">
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Tên giải đấu</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Mùa</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Ngày thi đấu</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Đăng ký</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Vòng đấu</th>
                <th className="text-right py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {tournaments.map((t) => {
                const cfg = STATUS_MAP[t.status] || STATUS_MAP.UPCOMING;
                return (
                  <tr key={t.id} className="border-b border-sblt-border hover:bg-sblt-red/3 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        <Trophy className="h-5 w-5 text-sblt-red" />
                        <span className="font-medium text-white">{t.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-sblt-white text-sm">Mùa {t.season}</td>
                    <td className="py-4 px-6"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                    <td className="py-4 px-6 text-sblt-muted text-sm">
                      {new Date(t.startDate).toLocaleDateString("vi-VN")} — {new Date(t.endDate).toLocaleDateString("vi-VN")}
                    </td>
                    <td className="py-4 px-6 text-sblt-white">{t._count.registrations}/{t.maxPlayers}</td>
                    <td className="py-4 px-6 text-sblt-white">{t._count.stages}</td>
                    <td className="py-4 px-6">
                      <div className="flex justify-end gap-1">
                        <Link href={`/admin/tournaments/${t.id}`} className="p-2 text-sblt-muted hover:text-white hover:bg-sblt-border rounded-lg transition-colors" title="Quản lý"><Settings className="h-4 w-4" /></Link>
                        <Link href={`/admin/tournaments/${t.id}/edit`} className="p-2 text-sblt-muted hover:text-white hover:bg-sblt-border rounded-lg transition-colors" title="Chỉnh sửa"><Edit className="h-4 w-4" /></Link>
                        <button onClick={() => handleDelete(t.id)} className="p-2 text-sblt-muted hover:text-red-400 hover:bg-sblt-border rounded-lg transition-colors" title="Xóa"><Trash2 className="h-4 w-4" /></button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
        {tournaments.length === 0 && (
          <div className="text-center py-12">
            <Trophy className="h-12 w-12 text-sblt-border mx-auto mb-4" />
            <p className="text-sblt-muted">Chưa có giải đấu nào</p>
            <Link href="/admin/tournaments/new" className="text-sblt-red hover:text-red-400 mt-2 inline-block text-sm">Tạo giải đấu đầu tiên</Link>
          </div>
        )}
      </Card>
    </div>
  );
}
