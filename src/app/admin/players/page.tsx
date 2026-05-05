"use client";

import { useState, useEffect } from "react";
import { Users, CheckCircle, XCircle, Clock, Check } from "lucide-react";

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

export default function AdminPlayersPage() {
  const [registrations, setRegistrations] = useState<Registration[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [selectedTournamentId, setSelectedTournamentId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkMsg, setBulkMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchTournaments();
  }, []);

  useEffect(() => {
    if (selectedTournamentId) {
      fetchRegistrations();
    }
  }, [selectedTournamentId]);

  const fetchTournaments = async () => {
    try {
      const res = await fetch("/api/tournaments");
      if (res.ok) {
        const data = await res.json();
        setTournaments(data);
        if (data.length > 0) {
          setSelectedTournamentId(data[0].id);
        } else {
          setLoading(false);
        }
      }
    } catch (err) {
      console.error("Failed to fetch tournaments:", err);
      setError("Không thể tải dữ liệu đăng ký.");
      setLoading(false);
    }
  };

  const fetchRegistrations = async () => {
    if (!selectedTournamentId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`);
      if (res.ok) {
        const data = await res.json();
        setRegistrations(data);
      }
    } catch (err) {
      console.error("Failed to fetch registrations:", err);
      setError("Không thể tải dữ liệu đăng ký.");
    } finally {
      setLoading(false);
    }
  };

  const handleStatusChange = async (registrationId: string, newStatus: string) => {
    if (!selectedTournamentId) return;
    try {
      const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ registrationId, status: newStatus }),
      });
      if (res.ok) {
        setRegistrations((prev) => prev.map((r) => r.id === registrationId ? { ...r, status: newStatus } : r));
      }
    } catch (err) {
      console.error("Failed to update status:", err);
    }
  };

  const handleBulkAction = async (action: "bulk_approve" | "bulk_reject") => {
    if (!selectedTournamentId || selectedIds.size === 0) return;
    const res = await fetch(`/api/tournaments/${selectedTournamentId}/registrations`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action, registrationIds: Array.from(selectedIds) }),
    });
    const data = await res.json();
    if (res.ok) {
      setBulkMsg(data.message);
      setSelectedIds(new Set());
      fetchRegistrations();
      setTimeout(() => setBulkMsg(null), 3000);
    }
  };

  const toggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleSelectAll = (ids: string[]) => {
    if (ids.every((id) => selectedIds.has(id))) {
      setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.delete(id)); return next; });
    } else {
      setSelectedIds((prev) => { const next = new Set(prev); ids.forEach((id) => next.add(id)); return next; });
    }
  };

  const filteredRegistrations = registrations.filter((r) => {
    if (filter === "all") return true;
    if (filter === "guests") return r.player.isGuest;
    if (filter === "pending") return r.status === "PENDING";
    if (filter === "approved") return r.status === "APPROVED";
    if (filter === "rejected") return r.status === "REJECTED";
    return true;
  });

  const getStatusBadge = (status: string) => {
    const styles: Record<string, string> = {
      PENDING: "bg-yellow-500/20 text-yellow-400",
      APPROVED: "bg-green-500/20 text-green-400",
      REJECTED: "bg-red-500/20 text-red-400",
      WITHDRAWN: "bg-gray-500/20 text-gray-400",
    };

    const labels: Record<string, string> = {
      PENDING: "Chờ duyệt",
      APPROVED: "Đã duyệt",
      REJECTED: "Từ chối",
      WITHDRAWN: "Đã rút",
    };

    const icons: Record<string, React.ReactNode> = {
      PENDING: <Clock className="h-3 w-3" />,
      APPROVED: <CheckCircle className="h-3 w-3" />,
      REJECTED: <XCircle className="h-3 w-3" />,
    };

    return (
      <span
        className={`px-2 py-1 rounded-full text-xs font-medium flex items-center gap-1 w-fit ${
          styles[status] || styles.PENDING
        }`}
      >
        {icons[status]}
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
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Quản lý Players</h1>
        <p className="text-gray-400 mt-2">Duyệt đăng ký và quản lý tuyển thủ</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      {/* Tournament Selector */}
      {tournaments.length > 0 && (
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Chọn giải đấu
          </label>
          <select
            value={selectedTournamentId || ""}
            onChange={(e) => setSelectedTournamentId(e.target.value)}
            className="bg-zinc-800 border border-zinc-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          >
            {tournaments.map((t) => (
              <option key={t.id} value={t.id}>
                {t.name} (Mùa {t.season})
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold">{registrations.length}</div>
          <div className="text-sm text-gray-400">Tổng đăng ký</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-400">
            {registrations.filter((r) => r.status === "PENDING").length}
          </div>
          <div className="text-sm text-gray-400">Chờ duyệt</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-green-400">
            {registrations.filter((r) => r.status === "APPROVED").length}
          </div>
          <div className="text-sm text-gray-400">Đã duyệt</div>
        </div>
        <div className="bg-gray-900 border border-gray-800 rounded-xl p-4">
          <div className="text-2xl font-bold text-yellow-500">
            {registrations.filter((r) => r.player.isGuest).length}
          </div>
          <div className="text-sm text-gray-400">Khách mời</div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-2 mb-6 overflow-x-auto">
        {[
          { value: "all", label: "Tất cả" },
          { value: "pending", label: "Chờ duyệt" },
          { value: "approved", label: "Đã duyệt" },
          { value: "rejected", label: "Từ chối" },
          { value: "guests", label: "Khách mời" },
        ].map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors whitespace-nowrap ${
              filter === f.value
                ? "bg-red-600 text-white"
                : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"
            }`}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selectedIds.size > 0 && (
        <div className="flex items-center gap-3 bg-red-600/10 border border-red-600/30 rounded-xl px-4 py-3 mb-4">
          <span className="text-sm font-medium text-red-400">Đã chọn {selectedIds.size} đăng ký</span>
          <button onClick={() => handleBulkAction("bulk_approve")}
            className="bg-green-600 hover:bg-green-700 text-white text-xs px-3 py-1.5 rounded-lg flex items-center gap-1">
            <Check className="h-3.5 w-3.5" /> Duyệt tất cả
          </button>
          <button onClick={() => handleBulkAction("bulk_reject")}
            className="bg-red-600 hover:bg-red-700 text-white text-xs px-3 py-1.5 rounded-lg">
            Từ chối tất cả
          </button>
          <button onClick={() => setSelectedIds(new Set())} className="text-gray-400 hover:text-white text-xs ml-auto">Bỏ chọn</button>
        </div>
      )}

      {bulkMsg && (
        <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">{bulkMsg}</div>
      )}

      {/* Table */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-zinc-800">
                <th className="py-4 px-4 w-10">
                  <input type="checkbox"
                    className="rounded border-zinc-600 bg-zinc-800 text-red-600 focus:ring-red-600"
                    checked={filteredRegistrations.length > 0 && filteredRegistrations.every((r) => selectedIds.has(r.id))}
                    onChange={() => toggleSelectAll(filteredRegistrations.map((r) => r.id))} />
                </th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Ingame</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Rank</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Trạng thái</th>
                <th className="text-left py-4 px-4 text-gray-400 font-medium">Ngày đăng ký</th>
                <th className="text-right py-4 px-4 text-gray-400 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {filteredRegistrations.map((reg) => (
                <tr key={reg.id} className={`border-b border-zinc-800 hover:bg-zinc-800/50 ${selectedIds.has(reg.id) ? "bg-red-600/5" : ""}`}>
                  <td className="py-4 px-4">
                    <input type="checkbox"
                      className="rounded border-zinc-600 bg-zinc-800 text-red-600 focus:ring-red-600"
                      checked={selectedIds.has(reg.id)}
                      onChange={() => toggleSelect(reg.id)} />
                  </td>
                  <td className="py-4 px-4 font-medium">
                    {reg.player.ign}
                    {reg.player.isGuest && (
                      <span className="ml-2 text-xs bg-red-600/20 text-red-400 px-2 py-0.5 rounded-full">Khách mời</span>
                    )}
                  </td>
                  <td className="py-4 px-4 text-gray-300 text-sm">{reg.player.user.email}</td>
                  <td className="py-4 px-4 text-gray-300">{reg.player.rank || "-"}</td>
                  <td className="py-4 px-4">{getStatusBadge(reg.status)}</td>
                  <td className="py-4 px-4 text-gray-300 text-sm">
                    {new Date(reg.registeredAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-4 px-4">
                    <div className="flex justify-end gap-2">
                      {reg.status === "PENDING" && (
                        <>
                          <button onClick={() => handleStatusChange(reg.id, "APPROVED")}
                            className="text-green-400 hover:text-green-300 text-sm font-medium">Duyệt</button>
                          <button onClick={() => handleStatusChange(reg.id, "REJECTED")}
                            className="text-red-400 hover:text-red-300 text-sm font-medium">Từ chối</button>
                        </>
                      )}
                      {reg.status === "APPROVED" && (
                        <button onClick={() => handleStatusChange(reg.id, "REJECTED")}
                          className="text-red-400 hover:text-red-300 text-sm font-medium">Hủy duyệt</button>
                      )}
                      {reg.status === "REJECTED" && (
                        <button onClick={() => handleStatusChange(reg.id, "APPROVED")}
                          className="text-green-400 hover:text-green-300 text-sm font-medium">Duyệt lại</button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {filteredRegistrations.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Không có đăng ký nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
