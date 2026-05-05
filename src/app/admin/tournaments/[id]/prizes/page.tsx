"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, Gift } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

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

  useEffect(() => { fetchData(); }, [params.id]);

  const fetchData = async () => {
    const [prizesRes, regRes] = await Promise.all([
      fetch(`/api/tournaments/${params.id}/prizes`),
      fetch(`/api/tournaments/${params.id}/registrations`),
    ]);
    if (prizesRes.ok) setPrizes(await prizesRes.json());
    if (regRes.ok) { const regs = await regRes.json(); setApprovedPlayers(regs.filter((r: { status: string }) => r.status === "APPROVED").map((r: { player: Player }) => r.player)); }
    setLoading(false);
  };

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
    await handleUpdate(prize.id, { paid: !prize.paid, paidAt: !prize.paid ? new Date().toISOString() : null });
  };

  const handleAssignPlayer = async (prizeId: string, playerId: string) => {
    await handleUpdate(prizeId, { playerId: playerId || null });
  };

  const totalPrizePool = prizes.reduce((sum, p) => sum + p.amount, 0);
  const totalPaid = prizes.filter((p) => p.paid).reduce((sum, p) => sum + p.amount, 0);
  const totalUnpaid = totalPrizePool - totalPaid;

  const inputClass = "w-full px-3 py-2 bg-sblt-dark border border-sblt-border rounded-xl text-white text-sm placeholder:text-sblt-border focus:outline-none focus:ring-2 focus:ring-sblt-red";

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-4xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href={`/admin/tournaments/${params.id}`} className="text-sblt-muted hover:text-white"><ArrowLeft className="h-5 w-5" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Giải thưởng</h1>
          <p className="text-sblt-muted mt-1">Quản lý giải thưởng cho giải đấu</p>
        </div>
        <Button size="sm" onClick={() => setShowForm(!showForm)} className="ml-auto"><Plus className="h-4 w-4" /> Thêm giải</Button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <Card hover={false} className="p-4 text-center">
          <div className="text-lg font-bold text-white">{formatCurrency(totalPrizePool)}</div>
          <div className="text-xs text-sblt-muted">Tổng giải thưởng</div>
        </Card>
        <Card hover={false} className="p-4 text-center border-green-500/30">
          <div className="text-lg font-bold text-green-400">{formatCurrency(totalPaid)}</div>
          <div className="text-xs text-sblt-muted">Đã thanh toán</div>
        </Card>
        <Card hover={false} className="p-4 text-center border-sblt-red/30">
          <div className="text-lg font-bold text-sblt-red">{formatCurrency(totalUnpaid)}</div>
          <div className="text-xs text-sblt-muted">Chưa thanh toán</div>
        </Card>
      </div>

      {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-xl mb-4 text-sm">{msg}</div>}

      {/* Add form */}
      {showForm && (
        <Card hover={false} className="p-5 mb-6">
          <form onSubmit={handleCreate}>
            <h3 className="font-semibold text-white mb-4">Thêm giải thưởng mới</h3>
            <div className="grid grid-cols-3 gap-4 mb-4">
              <div>
                <label className="block text-xs text-sblt-muted mb-1">Hạng</label>
                <input type="number" value={form.rank} onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))} className={inputClass} placeholder="1" min={1} required />
              </div>
              <div>
                <label className="block text-xs text-sblt-muted mb-1">Số tiền (VNĐ)</label>
                <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))} className={inputClass} placeholder="5000000" min={0} required />
              </div>
              <div>
                <label className="block text-xs text-sblt-muted mb-1">Mô tả</label>
                <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))} className={inputClass} placeholder="Quán quân" required />
              </div>
            </div>
            <div className="flex gap-2">
              <Button type="submit" size="sm" disabled={saving}>{saving ? "Đang lưu..." : "Thêm"}</Button>
              <button type="button" onClick={() => setShowForm(false)} className="px-4 py-2 text-sblt-muted hover:text-white text-sm">Hủy</button>
            </div>
          </form>
        </Card>
      )}

      {/* Prize list */}
      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="bg-sblt-dark border-b-2 border-sblt-red">
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider w-16">Hạng</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Mô tả</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Số tiền</th>
                <th className="text-left py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Người nhận</th>
                <th className="text-center py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Đã trả</th>
                <th className="text-right py-3 px-4 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {prizes.map((prize) => (
                <tr key={prize.id} className="border-b border-sblt-border hover:bg-sblt-red/3 transition-colors">
                  <td className="py-3 px-4">
                    <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                      prize.rank === 1 ? "bg-sblt-red text-white" : prize.rank === 2 ? "bg-zinc-400 text-black" : prize.rank === 3 ? "bg-amber-700 text-white" : "bg-sblt-border text-sblt-white"
                    }`}>{prize.rank}</span>
                  </td>
                  <td className="py-3 px-4 text-sblt-white">{prize.description}</td>
                  <td className="py-3 px-4 font-semibold text-sblt-red">{formatCurrency(prize.amount)}</td>
                  <td className="py-3 px-4">
                    <select value={prize.playerId || ""} onChange={(e) => handleAssignPlayer(prize.id, e.target.value)}
                      className="bg-sblt-dark border border-sblt-border rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-sblt-red max-w-[160px]">
                      <option value="">— Chưa gán —</option>
                      {approvedPlayers.map((p) => <option key={p.id} value={p.id}>{p.ign}</option>)}
                    </select>
                  </td>
                  <td className="py-3 px-4 text-center">
                    <button onClick={() => handleMarkPaid(prize)}
                      className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${
                        prize.paid ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-sblt-border text-sblt-muted hover:bg-sblt-border/80"
                      }`} title={prize.paid ? `Đã trả ${prize.paidAt ? new Date(prize.paidAt).toLocaleDateString("vi-VN") : ""}` : "Đánh dấu đã trả"}>
                      <Check className="h-4 w-4" />
                    </button>
                  </td>
                  <td className="py-3 px-4 text-right">
                    <button onClick={() => handleDelete(prize.id)} className="text-sblt-muted hover:text-red-400 p-1"><Trash2 className="h-4 w-4" /></button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
        {prizes.length === 0 && (
          <div className="text-center py-12"><Gift className="h-12 w-12 text-sblt-border mx-auto mb-4" /><p className="text-sblt-muted">Chưa có giải thưởng nào</p></div>
        )}
      </Card>
    </div>
  );
}
