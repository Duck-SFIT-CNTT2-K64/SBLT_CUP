"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Plus } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface Dispute {
  id: string; reason: string; description: string; status: string; adminNote: string | null; createdAt: string;
  tournament: { name: string; season: number };
  game: { gameNumber: number; group: { name: string } } | null;
}
interface Tournament { id: string; name: string; season: number; }

const STATUS_MAP: Record<string, { label: string; variant: "yellow" | "red" | "green" | "default" }> = {
  PENDING: { label: "Chờ xử lý", variant: "yellow" },
  REVIEWING: { label: "Đang xem xét", variant: "red" },
  RESOLVED: { label: "Đã giải quyết", variant: "green" },
  REJECTED: { label: "Từ chối", variant: "red" },
};

export default function DisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [tournaments, setTournaments] = useState<Tournament[]>([]);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ tournamentId: "", reason: "", description: "" });
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);
  const [msgVariant, setMsgVariant] = useState<"success" | "error">("success");

  useEffect(() => { fetchData(); }, []);

  const fetchData = async () => {
    const [d, t] = await Promise.all([fetch("/api/disputes"), fetch("/api/tournaments")]);
    if (d.ok) setDisputes(await d.json());
    if (t.ok) { const json = await t.json(); setTournaments(json.data); }
    setLoading(false);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    const res = await fetch("/api/disputes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    const data = await res.json();
    if (res.ok) { setShowForm(false); setForm({ tournamentId: "", reason: "", description: "" }); setMsg("Kháng nghị đã được gửi. Admin sẽ xem xét sớm nhất có thể."); setMsgVariant("success"); fetchData(); }
    else { setMsg(data.error || "Đã xảy ra lỗi"); setMsgVariant("error"); }
    setSubmitting(false);
  };

  const inputClass = "w-full px-3 py-2 bg-[#111] border border-[#222] rounded-xl text-[#f5f5f5] text-sm placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-[#dc2626]";

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2 text-[#f5f5f5]"><AlertTriangle className="h-6 w-6 text-[#dc2626]" /> Kháng nghị</h1>
          <p className="text-[#888] text-sm mt-1">Gửi kháng nghị về kết quả sai, bug, hoặc tranh chấp</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)}><Plus className="h-4 w-4" /> Gửi kháng nghị</Button>
      </div>

      {msg && <Alert variant={msgVariant} message={msg} onDismiss={() => setMsg(null)} className="mb-4" />}

      {showForm && (
        <Card hover={false} className="p-5 mb-6">
          <form onSubmit={handleSubmit}>
            <h3 className="font-semibold mb-4 text-[#f5f5f5]">Gửi kháng nghị mới</h3>
            <div className="space-y-4">
              <div>
                <label className="block text-xs text-[#888] mb-1">Giải đấu *</label>
                <select value={form.tournamentId} onChange={(e) => setForm((p) => ({ ...p, tournamentId: e.target.value }))} className={inputClass} required>
                  <option value="">Chọn giải đấu</option>
                  {tournaments.map((t) => <option key={t.id} value={t.id}>{t.name} (Mùa {t.season})</option>)}
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#888] mb-1">Lý do *</label>
                <select value={form.reason} onChange={(e) => setForm((p) => ({ ...p, reason: e.target.value }))} className={inputClass} required>
                  <option value="">Chọn lý do</option>
                  <option value="WRONG_RESULT">Kết quả sai (placement)</option>
                  <option value="BUG">Bug</option>
                  <option value="DISCONNECT">Disconnect</option>
                  <option value="CHEATING">Vi phạm quy định</option>
                  <option value="OTHER">Khác</option>
                </select>
              </div>
              <div>
                <label className="block text-xs text-[#888] mb-1">Mô tả chi tiết *</label>
                <textarea value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={`${inputClass} resize-none`} rows={4} placeholder="Mô tả chi tiết vấn đề, game nào, thời điểm nào..." required />
              </div>
            </div>
            <div className="flex gap-2 mt-4">
              <Button type="submit" size="sm" disabled={submitting}>{submitting ? "Đang gửi..." : "Gửi kháng nghị"}</Button>
              <button type="button" onClick={() => setShowForm(false)} className="text-[#888] hover:text-[#f5f5f5] text-sm px-4 py-2">Hủy</button>
            </div>
          </form>
        </Card>
      )}

      <div className="space-y-3">
        {disputes.length === 0 ? (
          <div className="text-center py-12 text-[#888]">
            <AlertTriangle className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có kháng nghị nào</p>
          </div>
        ) : disputes.map((d) => {
          const cfg = STATUS_MAP[d.status] || STATUS_MAP.PENDING;
          return (
            <Card key={d.id} hover={false} className="p-4">
              <div className="flex items-start justify-between mb-2">
                <div>
                  <span className="font-medium text-sm text-[#f5f5f5]">{d.tournament.name}</span>
                  {d.game && <span className="text-xs text-[#888] ml-2">— {d.game.group.name}, Game {d.game.gameNumber}</span>}
                </div>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
              </div>
              <p className="text-xs text-[#888] mb-1">Lý do: {d.reason}</p>
              <p className="text-sm text-[#f5f5f5]">{d.description}</p>
              {d.adminNote && (
                <div className="mt-3 bg-[#111] rounded-xl px-3 py-2 text-xs text-[#f5f5f5] border-l-2 border-[#dc2626]">
                  <span className="text-[#888]">Phản hồi từ BTC: </span>{d.adminNote}
                </div>
              )}
              <p className="text-xs text-[#555] mt-2">{new Date(d.createdAt).toLocaleString("vi-VN")}</p>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
