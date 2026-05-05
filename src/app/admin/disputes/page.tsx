"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Check, X } from "lucide-react";

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  player: { ign: string };
  tournament: { name: string; season: number };
  game: { gameNumber: number; group: { name: string } } | null;
}

const STATUS_LABELS: Record<string, string> = {
  PENDING: "Chờ xử lý",
  REVIEWING: "Đang xem xét",
  RESOLVED: "Đã giải quyết",
  REJECTED: "Từ chối",
};

const STATUS_COLORS: Record<string, string> = {
  PENDING: "bg-yellow-500/20 text-yellow-400",
  REVIEWING: "bg-blue-500/20 text-blue-400",
  RESOLVED: "bg-green-500/20 text-green-400",
  REJECTED: "bg-red-500/20 text-red-400",
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: "", adminNote: "" });
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => { fetchDisputes(); }, []);

  const fetchDisputes = async () => {
    const res = await fetch("/api/disputes");
    if (res.ok) setDisputes(await res.json());
    setLoading(false);
  };

  const handleUpdate = async (disputeId: string) => {
    const res = await fetch(`/api/disputes/${disputeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(editForm),
    });
    if (res.ok) {
      setEditingId(null);
      setMsg("Đã cập nhật kháng nghị");
      fetchDisputes();
      setTimeout(() => setMsg(null), 3000);
    }
  };

  const filtered = filter === "all" ? disputes : disputes.filter((d) => d.status === filter);

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold flex items-center gap-2">
          <AlertTriangle className="h-6 w-6 text-red-600" /> Quản lý Kháng nghị
        </h1>
        <div className="flex items-center gap-2">
          <span className="text-xs text-gray-400">Lọc:</span>
          {["all", "PENDING", "REVIEWING", "RESOLVED", "REJECTED"].map((s) => (
            <button key={s} onClick={() => setFilter(s)}
              className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-red-600 text-white" : "bg-zinc-800 text-gray-300 hover:bg-zinc-700"}`}>
              {s === "all" ? "Tất cả" : STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>

      {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">{msg}</div>}

      <div className="space-y-3">
        {filtered.length === 0 ? (
          <div className="text-center py-12 text-gray-500">Không có kháng nghị nào</div>
        ) : (
          filtered.map((d) => (
            <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-5">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="font-semibold">{d.player.ign}</span>
                    <span className="text-gray-400 text-sm">— {d.tournament.name}</span>
                    {d.game && <span className="text-xs text-gray-500">{d.game.group.name}, Game {d.game.gameNumber}</span>}
                  </div>
                  <span className="text-xs text-gray-500">{new Date(d.createdAt).toLocaleString("vi-VN")}</span>
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                  {STATUS_LABELS[d.status]}
                </span>
              </div>

              <div className="bg-zinc-800 rounded-lg p-3 mb-3">
                <p className="text-xs text-gray-400 mb-1">Lý do: <span className="text-gray-300">{d.reason}</span></p>
                <p className="text-sm text-gray-200">{d.description}</p>
              </div>

              {d.adminNote && (
                <div className="bg-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-300 border-l-2 border-red-600 mb-3">
                  <span className="text-gray-500">Phản hồi: </span>{d.adminNote}
                </div>
              )}

              {editingId === d.id ? (
                <div className="space-y-3">
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Trạng thái</label>
                    <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600">
                      <option value="PENDING">Chờ xử lý</option>
                      <option value="REVIEWING">Đang xem xét</option>
                      <option value="RESOLVED">Đã giải quyết</option>
                      <option value="REJECTED">Từ chối</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs text-gray-400 mb-1">Phản hồi cho player</label>
                    <textarea value={editForm.adminNote} onChange={(e) => setEditForm((p) => ({ ...p, adminNote: e.target.value }))}
                      className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                      rows={3} placeholder="Giải thích quyết định..." />
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => handleUpdate(d.id)}
                      className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-1">
                      <Check className="h-4 w-4" /> Lưu
                    </button>
                    <button onClick={() => setEditingId(null)} className="text-gray-400 hover:text-white text-sm px-4 py-2">Hủy</button>
                  </div>
                </div>
              ) : (
                <button
                  onClick={() => { setEditingId(d.id); setEditForm({ status: d.status, adminNote: d.adminNote || "" }); }}
                  className="text-red-500 hover:text-red-400 text-sm"
                >
                  Xử lý kháng nghị
                </button>
              )}
            </div>
          ))
        )}
      </div>
    </div>
  );
}
