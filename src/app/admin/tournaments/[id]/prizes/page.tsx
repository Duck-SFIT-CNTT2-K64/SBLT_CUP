"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, Gift } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface Player { id: string; ign: string; }
interface Prize {
  id: string; rank: number; amount: number; description: string;
  playerId: string | null; player: Player | null; paid: boolean; paidAt: string | null;
}

const formatCurrency = (n: number) => new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

export default function AdminPrizesPage() {
  const params = useParams();
  const [prizes, setPrizes] = useState<Prize[]>([]);
  const [approvedPlayers, setApprovedPlayers] = useState<Player[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [form, setForm] = useState({ rank: "", amount: "", description: "" });
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<string | null>(null);

  const fetchData = async () => {
    const [prizesRes, regRes] = await Promise.all([
      fetch(`/api/tournaments/${params.id}/prizes`),
      fetch(`/api/tournaments/${params.id}/registrations`),
    ]);
    if (prizesRes.ok) setPrizes(await prizesRes.json());
    if (regRes.ok) { const regs = await regRes.json(); setApprovedPlayers(regs.filter((r: { status: string }) => r.status === "APPROVED").map((r: { player: Player }) => r.player)); }
    setLoading(false);
  };

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [prizesRes, regRes] = await Promise.all([
        fetch(`/api/tournaments/${params.id}/prizes`),
        fetch(`/api/tournaments/${params.id}/registrations`),
      ]);
      if (prizesRes.ok && !cancelled) setPrizes(await prizesRes.json());
      if (regRes.ok && !cancelled) { const regs = await regRes.json(); setApprovedPlayers(regs.filter((r: { status: string }) => r.status === "APPROVED").map((r: { player: Player }) => r.player)); }
      if (!cancelled) setLoading(false);
    })();
    return () => { cancelled = true; };
  }, [params.id]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/tournaments/${params.id}/prizes`, {
      method: "POST", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank: parseInt(form.rank), amount: parseInt(form.amount), description: form.description }),
    });
    if (res.ok) { setShowForm(false); setForm({ rank: "", amount: "", description: "" }); fetchData(); }
    setSaving(false);
  };

  const handleUpdate = async (prizeId: string, data: Partial<Prize>) => {
    const res = await fetch(`/api/tournaments/${params.id}/prizes/${prizeId}`, {
      method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(data),
    });
    if (res.ok) { fetchData(); setMsg("Đã cập nhật"); setTimeout(() => setMsg(null), 2000); }
  };

  const handleDelete = async (prizeId: string) => {
    if (!confirm("Xóa giải thưởng này?")) return;
    const res = await fetch(`/api/tournaments/${params.id}/prizes/${prizeId}`, { method: "DELETE" });
    if (res.ok) fetchData();
  };

  const handleMarkPaid = async (prize: Prize) => {
    if (!prize.paid && !prize.playerId) {
      setMsg("Cần gán tuyển thủ trước khi đánh dấu đã trả");
      setTimeout(() => setMsg(null), 3000);
      return;
    }
    await handleUpdate(prize.id, { paid: !prize.paid, paidAt: !prize.paid ? new Date().toISOString() : null });
  };

  const handleAssignPlayer = async (prizeId: string, playerId: string) => {
    await handleUpdate(prizeId, { playerId: playerId || null });
  };

  const totalPrizePool = prizes.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = prizes.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = totalPrizePool - totalPaid;

  const inputClass = "w-full px-3 py-2 bg-[#0d0d0d] border border-[#222] rounded-xl text-[#f5f5f5] text-sm placeholder:text-[#222] focus:outline-none focus:ring-2 focus:ring-[#dc2626]";

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="py-12 px-6 lg:px-8 max-w-[1280px] max-w-4xl">
      <RevealOnScroll>
        <div className="flex items-center gap-4 mb-8">
          <Link href={`/admin/tournaments/${params.id}`} className="text-[#888] hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f5] sblt-heading">Quản lý Giải thưởng</h1>
            <p className="text-[#888] mt-1">Quản lý giải thưởng cho giải đấu</p>
          </div>
          <Button size="sm" onClick={() => setShowForm(!showForm)} className="ml-auto"><Plus className="h-4 w-4" /> Thêm giải</Button>
        </div>
      </RevealOnScroll>

      {/* Summary */}
      <RevealOnScroll>
        <div className="grid grid-cols-3 gap-4 mb-6">
          <Card hover={false} className="p-4 text-center">
            <div className="text-lg font-bold text-[#f5f5f5]">{formatCurrency(totalPrizePool)}</div>
            <div className="text-xs text-[#888]">Tổng giải thưởng</div>
          </Card>
          <Card hover={false} className="p-4 text-center border-green-500/30">
            <div className="text-lg font-bold text-green-400">{formatCurrency(totalPaid)}</div>
            <div className="text-xs text-[#888]">Đã thanh toán</div>
          </Card>
          <Card hover={false} className="p-4 text-center border-[#dc2626]/30">
            <div className="text-lg font-bold text-[#dc2626]">{formatCurrency(totalUnpaid)}</div>
            <div className="text-xs text-[#888]">Chưa thanh toán</div>
          </Card>
        </div>
      </RevealOnScroll>

      {msg && <Alert variant={msg.includes("Cần gán") ? "warning" : "success"} message={msg} onDismiss={() => setMsg(null)} className="mb-4" />}

      {/* Add form */}
      {showForm && (
        <RevealOnScroll>
          <Card hover={false} className="p-5 mb-6 hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
            <form onSubmit={handleCreate}>
              <h3 className="font-semibold text-[#f5f5f5] mb-4">Thêm giải thưởng mới</h3>
              <div className="grid grid-cols-3 gap-4 mb-4">
                <div>
                  <label className="block text-xs text-[#888] mb-1">Hạng</label>
                  <input type="number" value={form.rank} onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))} className={inputClass} placeholder="1" min={1} required />
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1">Số tiền (VNĐ)</label>
                  <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className={inputClass} placeholder="5000000" min={0} required />
                </div>
                <div>
                  <label className="block text-xs text-[#888] mb-1">Mô tả</label>
                  <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Quán quân" required />
                </div>
              </div>
              <div className="flex gap-2">
                <Button type="submit" size="sm" disabled={saving}>{saving ? "Đang lưu..." : "Thêm"}</Button>
                <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-[#888] hover:text-white text-sm">Hủy</button>
              </div>
            </form>
          </Card>
        </RevealOnScroll>
      )}

      {/* Prize list */}
      <RevealOnScroll>
        <Card hover={false} className="overflow-hidden hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="bg-[#0d0d0d] border-b-2 border-[#dc2626]">
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider w-16">Hạng</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Mô tả</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Số tiền</th>
                  <th className="text-left py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Người nhận</th>
                  <th className="text-center py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Đã trả</th>
                  <th className="text-right py-3 px-4 text-[#888] font-semibold text-xs uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {prizes.map((prize) => (
                  <tr key={prize.id} className="border-b border-[#222] hover:bg-[#dc2626]/3 transition-colors">
                    <td className="py-3 px-4">
                      <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                        prize.rank === 1 ? "bg-[#dc2626] text-[#f5f5f5]" : prize.rank === 2 ? "bg-zinc-400 text-black" : prize.rank === 3 ? "bg-amber-700 text-[#f5f5f5]" : "bg-[#222] text-[#f5f5f5]"
                      }`}>{prize.rank}</span>
                    </td>
                    <td className="py-3 px-4 text-[#f5f5f5]">{prize.description}</td>
                    <td className="py-3 px-4 font-semibold text-[#dc2626]">{formatCurrency(prize.amount)}</td>
                    <td className="py-3 px-4">
                      <select value={prize.playerId || ""} onChange={(e) => handleAssignPlayer(prize.id, e.target.value)}
                        className="bg-[#0d0d0d] border border-[#222] rounded-lg px-2 py-1 text-xs text-[#f5f5f5] focus:outline-none focus:ring-1 focus:ring-[#dc2626] max-w-[160px]">
                        <option value="">— Chưa gán —</option>
                        {approvedPlayers.map((p) => <option key={p.id} value={p.id}>{p.ign}</option>)}
                      </select>
                    </td>
                    <td className="py-3 px-4 text-center">
                      <button onClick={() => handleMarkPaid(prize)}
                        disabled={!prize.paid && !prize.playerId}
                        className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${
                          !prize.paid && !prize.playerId
                            ? "bg-[#222]/30 text-[#222] cursor-not-allowed"
                            : prize.paid ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-[#222] text-[#888] hover:bg-[#222]/80"
                        }`} title={!prize.paid && !prize.playerId ? "Cần gán tuyển thủ trước" : prize.paid ? `Đã trả ${prize.paidAt ? new Date(prize.paidAt).toLocaleDateString("vi-VN") : ""}` : "Đánh dấu đã trả"}>
                        <Check className="h-4 w-4" />
                      </button>
                    </td>
                    <td className="py-3 px-4 text-right">
                      <button onClick={() => handleDelete(prize.id)} className="text-[#888] hover:text-red-400 p-1"><Trash2 className="h-4 w-4" /></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {prizes.length === 0 && (
            <div className="text-center py-12"><Gift className="h-12 w-12 text-[#222] mx-auto mb-4" /><p className="text-[#888]">Chưa có giải thưởng nào</p></div>
          )}
        </Card>
      </RevealOnScroll>
    </div>
  );
}
