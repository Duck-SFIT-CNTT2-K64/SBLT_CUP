"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, Clock, Check } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface Registration {
  id: string;
  status: string;
  registeredAt: string;
  checkedIn: boolean;
  player: {
    id: string;
    ign: string;
    rank: string | null;
    isGuest: boolean;
    user: { email: string };
  };
}

interface Tournament { id: string; name: string; season: number; }

const STATUS_CONFIG: Record<string, { label: string; variant: "yellow" | "green" | "red" | "default" }> = {
  PENDING: { label: "Chờ duyệt", variant: "yellow" },
  APPROVED: { label: "Đã duyệt", variant: "green" },
  REJECTED: { label: "Từ chối", variant: "red" },
  WITHDRAWN: { label: "Đã rút", variant: "default" },
};

export default function AdminPlayersPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  const fetchRegistrations = async () => {
    if (!selectedTournamentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`);
      if (res.ok) setRegistrations(await res.json());
    } catch { setError("Không thể tải dữ liệu đăng ký."); } finally { setLoading(false); }
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/tournaments");
        if (res.ok) {
          const json = await res.json();
          if (!cancelled) {
            setTournaments(json.data);
            if (json.data.length > 0) setSelectedTournamentId(json.data[0].id);
            else setLoading(false);
          }
        }
      } catch { if (!cancelled) { setError("Không thể tải dữ liệu đăng ký."); setLoading(false); } }
    })();
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (!selectedTournamentId) return;
    let cancelled = false;
    (async () => {
      setLoading(true);
      try {
        const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`);
        if (res.ok && !cancelled) setRegistrations(await res.json());
      } catch { if (!cancelled) setError("Không thể tải dữ liệu đăng ký."); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, [selectedTournamentId]);

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    if (!selectedTournamentId) return;
    const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ registrationId, status: newStatus }),
    });
    if (res.ok) setRegistrations((prev) => prev.map((r) => r.id === registrationId ? { ...r, status: newStatus } : r));
  };

  const handleBulkAction = async (action: "bulk_approve" | "bulk_reject") => {
    if (!selectedTournamentId || selectedIds.size === 0) return;
    const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action, registrationIds: Array.from(selectedIds) }),
    });
    const data = await res.json();
    if (res.ok) { setBulkMsg(data.message); setSelectedIds(new Set()); fetchRegistrations(); setTimeout(() => setBulkMsg(null), 3000); }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const toggleSelectAll = (ids: string[]) => {
    if (ids.every((id) => selectedIds.has(id))) setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.delete(id)); return next; });
    else setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return next; });
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (filter === "all") return true;
    if (filter === "guests") return r.player.isGuest;
    return r.status === filter.toUpperCase();
  });

  const inputClass = "w-full px-4 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-[#f5f5f5] placeholder:text-[#222] focus:outline-none focus:ring-2 focus:ring-[#dc2626]";

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="py-12 px-6 lg:px-8 max-w-[1280px]">
      <RevealOnScroll>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#f5f5f5] sblt-heading">Quản lý Players</h1>
          <p className="text-[#888] mt-1">Duyệt đăng ký và quản lý tuyển thủ</p>
        </div>
      </RevealOnScroll>

      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}

      {/* Tournament Selector */}
      {tournaments.length > 0 && (
        <RevealOnScroll>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#888] mb-1.5">Chọn giải đấu</label>
            <select value={selectedTournamentId || ""} onChange={(e) => setSelectedTournamentId(e.target.value)}
              className="bg-[#0d0d0d] border border-[#222] rounded-xl px-4 py-2.5 text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#dc2626]">
              {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} (Mùa {t.season})</option>)}
            </select>
          </div>
        </RevealOnScroll>
      )}

      {/* Stats */}
      <RevealOnScroll>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
          {[
            { label: "Tổng đăng ký", value: registrations.length, color: "text-[#f5f5f5]" },
            { label: "Chờ duyệt", value: registrations.filter((r) => r.status === "PENDING").length, color: "text-yellow-400" },
            { label: "Đã duyệt", value: registrations.filter((r) => r.status === "APPROVED").length, color: "text-green-400" },
            { label: "Khách mời", value: registrations.filter((r) => r.player.isGuest).length, color: "text-[#dc2626]" },
          ].map((s) => (
            <Card key={s.label} hover={false} className="p-4 text-center">
              <div className={`text-2xl font-bold ${s.color}`}>{s.value}</div>
              <div className="text-xs text-[#888] mt-1">{s.label}</div>
            </Card>
          ))}
        </div>
      </RevealOnScroll>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { value: "all", label: "Tất cả" },
          { value: "PENDING", label: "Chờ duyệt" },
          { value: "APPROVED", label: "Đã duyệt" },
          { value: "REJECTED", label: "Từ chối" },
          { value: "guests", label: "Khách mời" },
        ].map((f) => (
          <button key={f.value} onClick={() => setFilter(f.value)}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${filter === f.value ? "bg-[#dc2626] text-[#f5f5f5]" : "bg-[#0d0d0d] text-[#888] hover:text-white hover:bg-[#222]"}`}>
            {f.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-[#dc2626]/10 border border-[#dc2626]/30 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm font-medium text-[#dc2626]">Đã chọn {selectedIds.size} đăng ký</span>
          <Button size="sm" onClick={() => handleBulkAction("bulk_approve")}><Check className="h-3.5 w-3.5" /> Duyệt tất cả</Button>
          <button onClick={() => handleBulkAction("bulk_reject")} className="bg-red-900/50 border border-red-800 text-red-400 hover:bg-red-900/80 text-xs px-3 py-1.5 rounded-lg">Từ chối tất cả</button>
          <button onClick={() => setSelectedIds(new Set())} className="text-[#888] hover:text-white text-xs ml-auto">Bỏ chọn</button>
        </div>
      )}

      {bulkMsg && <Alert variant="success" message={bulkMsg} onDismiss={() => setBulkMsg(null)} className="mb-4" />}

      {/* Table */}
      <RevealOnScroll>
        <Card hover={false} className="overflow-hidden hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0d0d0d] border-b-2 border-[#dc2626]">
                  <th className="py-3 px-4 w-10">
                    <input type="checkbox" className="rounded border-[#222] bg-[#0d0d0d] text-[#dc2626] focus:ring-[#dc2626]"
                      checked={filteredRegistrations.length > 0 && filteredRegistrations.every((r) => selectedIds.has(r.id))}
                      onChange={() => toggleSelectAll(filteredRegistrations.map((r) => r.id))} />
                  </th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Ingame</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Rank</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Trạng thái</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Ngày đăng ký</th>
                  <th className="text-right py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {filteredRegistrations.map((reg) => (
                  <tr key={reg.id} className={`border-b border-[#222] hover:bg-[#dc2626]/3 transition-colors ${selectedIds.has(reg.id) ? "bg-[#dc2626]/5" : ""}`}>
                    <td className="py-4 px-4">
                      <input type="checkbox" className="rounded border-[#222] bg-[#0d0d0d] text-[#dc2626] focus:ring-[#dc2626]"
                        checked={selectedIds.has(reg.id)} onChange={() => toggleSelect(reg.id)} />
                    </td>
                    <td className="py-4 px-4">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-[#f5f5f5]">{reg.player.ign}</span>
                        {reg.player.isGuest && <Badge variant="red">Khách mời</Badge>}
                      </div>
                    </td>
                    <td className="py-4 px-4 text-[#f5f5f5] text-sm">{reg.player.user.email}</td>
                    <td className="py-4 px-4 text-[#f5f5f5]">{reg.player.rank || "-"}</td>
                    <td className="py-4 px-4"><Badge variant={STATUS_CONFIG[reg.status]?.variant || "default"}>{STATUS_CONFIG[reg.status]?.label || reg.status}</Badge></td>
                    <td className="py-4 px-4 text-[#888] text-sm">{new Date(reg.registeredAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-4 px-4">
                      <div className="flex justify-end gap-2">
                        {reg.status === "PENDING" && (
                          <>
                            <button onClick={() => handleStatusChange(reg.id, "APPROVED")} className="text-green-400 hover:text-green-300 text-sm font-medium">Duyệt</button>
                            <button onClick={() => handleStatusChange(reg.id, "REJECTED")} className="text-red-400 hover:text-red-300 text-sm font-medium">Từ chối</button>
                          </>
                        )}
                        {reg.status === "APPROVED" && <button onClick={() => handleStatusChange(reg.id, "REJECTED")} className="text-red-400 hover:text-red-300 text-sm font-medium">Hủy duyệt</button>}
                        {reg.status === "REJECTED" && <button onClick={() => handleStatusChange(reg.id, "APPROVED")} className="text-green-400 hover:text-green-300 text-sm font-medium">Duyệt lại</button>}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {filteredRegistrations.length === 0 && (
            <div className="text-center py-12"><Users className="h-12 w-12 text-[#222] mx-auto mb-4" /><p className="text-[#888]">Không có đăng ký nào</p></div>
          )}
        </Card>
      </RevealOnScroll>
    </div>
  );
}
