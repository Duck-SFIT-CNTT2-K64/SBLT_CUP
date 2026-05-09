"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { Trophy, Plus, Edit, Trash2, Settings } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

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

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tournaments");
        if (res.ok && !cancelled) { const json = await res.json(); setTournaments(json.data); }
      } catch { if (!cancelled) setError("Không thể tải danh sách giải đấu."); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa giải đấu này?")) return;
    const res = await fetch(`/api/tournaments/${id}`, { method: "DELETE" });
    if (res.ok) setTournaments((prev) => prev.filter((t) => t.id !== id));
  };

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="py-12 px-6 lg:px-8 max-w-[1280px]">
      <RevealOnScroll>
        <div className="flex justify-between items-center mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f5] sblt-heading">Quản lý Giải đấu</h1>
            <p className="text-[#888] mt-1">Tạo và quản lý các mùa giải</p>
          </div>
          <Link href="/admin/tournaments/new"><Button size="sm"><Plus className="h-4 w-4" /> Tạo giải đấu</Button></Link>
        </div>
      </RevealOnScroll>

      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}

      <RevealOnScroll>
        <Card hover={false} className="overflow-hidden hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0d0d0d] border-b-2 border-[#dc2626]">
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Tên giải đấu</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Mùa</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Ngày thi đấu</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Đăng ký</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Vòng đấu</th>
                  <th className="text-right py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {tournaments.map((t) => {
                  const cfg = STATUS_MAP[t.status] || STATUS_MAP.UPCOMING;
                  return (
                    <tr key={t.id} className="border-b border-[#222] hover:bg-[#dc2626]/3 transition-colors">
                      <td className="py-4 px-6">
                        <div className="flex items-center gap-3">
                          <Trophy className="h-5 w-5 text-[#dc2626]" />
                          <span className="font-medium text-[#f5f5f5]">{t.name}</span>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-[#f5f5f5] text-sm">Mùa {t.season}</td>
                      <td className="py-4 px-6"><Badge variant={cfg.variant}>{cfg.label}</Badge></td>
                      <td className="py-4 px-6 text-[#888] text-sm">
                        {new Date(t.startDate).toLocaleDateString("vi-VN")} — {new Date(t.endDate).toLocaleDateString("vi-VN")}
                      </td>
                      <td className="py-4 px-6 text-[#f5f5f5]">{t._count.registrations}/{t.maxPlayers}</td>
                      <td className="py-4 px-6 text-[#f5f5f5]">{t._count.stages}</td>
                      <td className="py-4 px-6">
                        <div className="flex justify-end gap-1">
                          <Link href={`/admin/tournaments/${t.id}`} className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors" title="Quản lý"><Settings className="h-4 w-4" /></Link>
                          <Link href={`/admin/tournaments/${t.id}/edit`} className="p-2 text-[#888] hover:text-white hover:bg-[#222] rounded-lg transition-colors" title="Chỉnh sửa"><Edit className="h-4 w-4" /></Link>
                          <button onClick={() => handleDelete(t.id)} className="p-2 text-[#888] hover:text-red-400 hover:bg-[#222] rounded-lg transition-colors" title="Xóa"><Trash2 className="h-4 w-4" /></button>
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
              <Trophy className="h-12 w-12 text-[#222] mx-auto mb-4" />
              <p className="text-[#888]">Chưa có giải đấu nào</p>
              <Link href="/admin/tournaments/new" className="text-[#dc2626] hover:text-red-400 mt-2 inline-block text-sm">Tạo giải đấu đầu tiên</Link>
            </div>
          )}
        </Card>
      </RevealOnScroll>
    </div>
  );
}
