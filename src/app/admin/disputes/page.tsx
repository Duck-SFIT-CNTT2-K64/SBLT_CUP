"use client";

import { useState, useEffect } from "react";
import { AlertTriangle, Check, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface Dispute {
  id: string;
  reason: string;
  description: string;
  status: string;
  adminNote: string | null;
  createdAt: string;
  attachments?: string[] | null;
  player: { ign: string };
  tournament: { name: string; season: number };
  game: { gameNumber: number; group: { name: string } } | null;
}

const STATUS_CONFIG: Record<string, { label: string; variant: "yellow" | "blue" | "green" | "red" }> = {
  PENDING: { label: "Chờ xử lý", variant: "yellow" },
  REVIEWING: { label: "Đang xem xét", variant: "blue" },
  RESOLVED: { label: "Đã giải quyết", variant: "green" },
  REJECTED: { label: "Từ chối", variant: "red" },
};

export default function AdminDisputesPage() {
  const [disputes, setDisputes] = useState<Dispute[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editForm, setEditForm] = useState({ status: "", adminNote: "" });
  const [msg, setMsg] = useState<string | null>(null);

  const fetchDisputes = async () => {
    const res = await fetch("/api/disputes");
    if (res.ok) setDisputes(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const res = await fetch("/api/disputes");
      if (res.ok && !cancelled) setDisputes(await res.json());
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, []);

  const handleUpdate = async (disputeId: string) => {
    const res = await fetch(`/api/disputes/${disputeId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(editForm),
    });
    if (res.ok) { setEditingId(null); setMsg("Đã cập nhật kháng nghị"); fetchDisputes(); setTimeout(() => setMsg(null), 3000); }
  };

  const filtered = filter === "all" ? disputes : disputes.filter((d) => d.status === filter);

  const inputClass = "w-full px-4 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-[#f5f5f5] placeholder:text-[#222] focus:outline-none focus:ring-2 focus:ring-[#dc2626]";

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="py-12 px-6 lg:px-8 max-w-[1280px] max-w-5xl">
      <RevealOnScroll>
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f5] sblt-heading">Quản lý Kháng nghị</h1>
            <p className="text-[#888] mt-1">Xem và xử lý kháng nghị từ tuyển thủ</p>
          </div>
          <div className="flex items-center gap-2">
            <span className="text-xs text-[#888]">Lọc:</span>
            {["all", "PENDING", "REVIEWING", "RESOLVED", "REJECTED"].map((s) => (
              <button key={s} onClick={() => setFilter(s)}
                className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${filter === s ? "bg-[#dc2626] text-[#f5f5f5]" : "bg-[#0d0d0d] text-[#888] hover:text-white hover:bg-[#222]"}`}>
                {s === "all" ? "Tất cả" : STATUS_CONFIG[s]?.label}
              </button>
            ))}
          </div>
        </div>
      </RevealOnScroll>

      {msg && <Alert variant="success" message={msg} onDismiss={() => setMsg(null)} className="mb-4" />}

      <RevealOnScroll>
        <div className="space-y-4">
          {filtered.length === 0 ? (
            <div className="text-center py-12"><AlertTriangle className="h-12 w-12 text-[#222] mx-auto mb-4" /><p className="text-[#888]">Không có kháng nghị nào</p></div>
          ) : (
            filtered.map((d) => (
              <Card key={d.id} hover={false} className="p-5 hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="font-semibold text-[#f5f5f5]">{d.player.ign}</span>
                      <span className="text-[#888] text-sm">— {d.tournament.name}</span>
                      {d.game && <span className="text-xs text-[#222]">{d.game.group.name}, Game {d.game.gameNumber}</span>}
                    </div>
                    <span className="text-xs text-[#222]">{new Date(d.createdAt).toLocaleString("vi-VN")}</span>
                  </div>
                  <Badge variant={STATUS_CONFIG[d.status]?.variant || "default"}>{STATUS_CONFIG[d.status]?.label || d.status}</Badge>
                </div>

                <div className="bg-[#0d0d0d] rounded-xl p-3 mb-3">
                  <p className="text-xs text-[#888] mb-1">Lý do: <span className="text-[#f5f5f5]">{d.reason}</span></p>
                  <p className="text-sm text-[#f5f5f5]">{d.description}</p>
                </div>

                {d.attachments && d.attachments.length > 0 && (
                  <div className="flex gap-2 mb-3">
                    {d.attachments.map((url, i) => (
                      <a key={i} href={url} target="_blank" rel="noopener noreferrer" className="w-16 h-16 rounded-lg overflow-hidden border border-[#222] hover:border-[#dc2626] transition-colors">
                        <img src={url} alt={`Bằng chứng ${i + 1}`} className="w-full h-full object-cover" />
                      </a>
                    ))}
                  </div>
                )}
                {d.adminNote && (
                  <div className="bg-[#0d0d0d] rounded-xl px-3 py-2 text-xs text-[#f5f5f5] border-l-2 border-[#dc2626] mb-3">
                    <span className="text-[#888]">Phản hồi: </span>{d.adminNote}
                  </div>
                )}

                {editingId === d.id ? (
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-[#888] mb-1">Trạng thái</label>
                      <select value={editForm.status} onChange={(e) => setEditForm((p) => ({ ...p, status: e.target.value }))} className={inputClass}>
                        <option value="PENDING">Chờ xử lý</option>
                        <option value="REVIEWING">Đang xem xét</option>
                        <option value="RESOLVED">Đã giải quyết</option>
                        <option value="REJECTED">Từ chối</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-xs text-[#888] mb-1">Phản hồi cho player</label>
                      <textarea value={editForm.adminNote} onChange={(e) => setEditForm((p) => ({ ...p, adminNote: e.target.value }))}
                        className={`${inputClass} resize-none`} rows={3} placeholder="Giải thích quyết định..." />
                    </div>
                    <div className="flex gap-2">
                      <Button size="sm" onClick={() => handleUpdate(d.id)}><Check className="h-4 w-4" /> Lưu</Button>
                      <button onClick={() => setEditingId(null)} className="px-4 py-2 text-[#888] hover:text-white transition-colors text-sm">Hủy</button>
                    </div>
                  </div>
                ) : (
                  <button onClick={() => { setEditingId(d.id); setEditForm({ status: d.status, adminNote: d.adminNote || "" }); }}
                    className="text-[#dc2626] hover:text-red-400 text-sm">
                    Xử lý kháng nghị
                  </button>
                )}
              </Card>
            ))
          )}
        </div>
      </RevealOnScroll>
    </div>
  );
}
