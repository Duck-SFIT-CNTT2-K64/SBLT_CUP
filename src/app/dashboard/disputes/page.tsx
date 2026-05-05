"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { AlertTriangle, Plus, X } from "lucide-react";

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  tournament: { name: string; season: number };
  game: { gameNumber: number; group: { name: string } } | null;
}

interface Tournament { id: string; name: string; season: number; }

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

export default function DisputesPage() {
  const { data: session } = useSession();
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tournamentId: "", reason: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  useEffect(() => {
    fetchData();
  }, []);

  const fetchData = async () => {
    const [dispRes, tourRes] = await Promise.all([
      fetch("/api/disputes"),
      fetch("/api/tournaments"),
    ]);
    // disputes endpoint returns all for admin, player sees their own
    // For now fetch all and filter client-side by player
    if (dispRes.ok) setDisputes(await dispRes.json());
    if (tourRes.ok) setTournaments(await tourRes.json());
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/disputes", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (res.ok) {
      setShowForm(false);
      setForm({ tournamentId: "", reason: "", description: "" });
      setMsg("Kháng nghị đã được gửi. Admin sẽ xem xét sớm nhất có thể.");
      fetchData();
    } else {
      setMsg(data.error || "Đã xảy ra lỗi");
    }
    setSubmitting(false);
  };

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <AlertTriangle className="h-6 w-6 text-red-600" /> Kháng nghị
          </h1>
          <p className="text-gray-400 text-sm mt-1">Gửi kháng nghị về kết quả sai, bug, hoặc tranh chấp</p>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Gửi kháng nghị
        </button>
      </div>

      {msg && (
        <div className="bg-zinc-800 border border-zinc-700 text-gray-200 px-4 py-3 rounded-lg mb-4 text-sm flex items-center justify-between">
          {msg}
          <button onClick={() => setMsg(null)}><X className="h-4 w-4" /></button>
        </div>
      )}

      {showForm && (
        <form onSubmit={handleSubmit} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Gửi kháng nghị mới</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Giải đấu *</label>
              <select value={form.tournamentId} onChange={(e) => setForm((p) => ({ ...p, tournamentId: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600" required>
                <option value="">Chọn giải đấu</option>
                {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} (Mùa {t.season})</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Lý do *</label>
              <select value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600" required>
                <option value="">Chọn lý do</option>
                <option value="wrong_placement">Kết quả sai (placement)</option>
                <option value="bug_disconnect">Bug / Disconnect</option>
                <option value="rule_violation">Vi phạm quy định</option>
                <option value="other">Khác</option>
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mô tả chi tiết *</label>
              <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600 resize-none"
                rows={4} placeholder="Mô tả chi tiết vấn đề, game nào, thời điểm nào..." required />
            </div>
          </div>
          <div className="flex gap-2 mt-4">
            <button type="submit" disabled={submitting}
              className="bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white text-sm px-4 py-2 rounded-lg">
              {submitting ? "Đang gửi..." : "Gửi kháng nghị"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2">Hủy</button>
          </div>
        </form>
      )}

      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có kháng nghị nào</p>
          </div>
        ) : (
          disputes.map((d) => (
            <div key={d.id} className="bg-zinc-900 border border-zinc-800 rounded-xl p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-sm">{d.tournament.name}</span>
                  {d.game && <span className="text-xs text-gray-400 ml-2">— {d.game.group.name}, Game {d.game.gameNumber}</span>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full font-medium ${STATUS_COLORS[d.status]}`}>
                  {STATUS_LABELS[d.status]}
                </span>
              </div>
              <p className="text-xs text-gray-400 mb-1">Lý do: {d.reason}</p>
              <p className="text-sm text-gray-300">{d.description}</p>
              {d.adminNote && (
                <div className="mt-3 bg-zinc-800 rounded-lg px-3 py-2 text-xs text-gray-300 border-l-2 border-red-600">
                  <span className="text-gray-500">Phản hồi từ BTC: </span>{d.adminNote}
                </div>
              )}
              <p className="text-xs text-gray-600 mt-2">{new Date(d.createdAt).toLocaleString("vi-VN")}</p>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
