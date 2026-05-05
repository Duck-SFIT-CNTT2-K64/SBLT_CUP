"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, Plus, Trash2, Check, Gift } from "lucide-react";

interface Player { id: string; ign: string; }
interface Prize {
  id: string;
  rank: number;
  amount: number;
  description: string;
  playerId: string | null;
  player: Player | null;
  paid: boolean;
  paidAt: string | null;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat("vi-VN", { style: "currency", currency: "VND" }).format(n);

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
    if (regRes.ok) {
      const regs = await regRes.json();
      setApprovedPlayers(regs.filter((r: { status: string; player: Player }) => r.status === "APPROVED").map((r: { player: Player }) => r.player));
    }
    setLoading(false);
  };

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    const res = await fetch(`/api/tournaments/${params.id}/prizes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rank: parseInt(form.rank), amount: parseInt(form.amount), description: form.description }),
    });
    if (res.ok) { setShowForm(false); setForm({ rank: "", amount: "", description: "" }); fetchData(); }
    setSaving(false);
  };

  const handleUpdate = async (prizeId: string, data: Partial<Prize>) => {
    const res = await fetch(`/api/tournaments/${params.id}/prizes/${prizeId}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
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

  if (loading) return <div className="p-8 text-center text-gray-400">Đang tải...</div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-6">
        <Link href={`/admin/tournaments/${params.id}`} className="text-gray-400 hover:text-white">
          <ArrowLeft className="h-5 w-5" />
        </Link>
        <div>
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <Gift className="h-6 w-6 text-red-600" /> Quản lý Giải thưởng
          </h1>
        </div>
        <button
          onClick={() => setShowForm(!showForm)}
          className="ml-auto bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg flex items-center gap-2"
        >
          <Plus className="h-4 w-4" /> Thêm giải
        </button>
      </div>

      {/* Summary */}
      <div className="grid grid-cols-3 gap-4 mb-6">
        <div className="bg-zinc-900 border border-zinc-800 rounded-xl p-4 text-center">
          <div className="text-lg font-bold">{formatCurrency(totalPrizePool)}</div>
          <div className="text-xs text-gray-400">Tổng giải thưởng</div>
        </div>
        <div className="bg-green-500/10 border border-green-500/20 rounded-xl p-4 text-center">
          <div className="text-lg font-bold text-green-400">{formatCurrency(totalPaid)}</div>
          <div className="text-xs text-gray-400">Đã thanh toán</div>
        </div>
        <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4 text-center">
          <div className="text-lg font-bold text-red-400">{formatCurrency(totalUnpaid)}</div>
          <div className="text-xs text-gray-400">Chưa thanh toán</div>
        </div>
      </div>

      {msg && <div className="bg-green-500/10 border border-green-500/30 text-green-400 px-4 py-2 rounded-lg mb-4 text-sm">{msg}</div>}

      {/* Add form */}
      {showForm && (
        <form onSubmit={handleCreate} className="bg-zinc-900 border border-zinc-700 rounded-xl p-5 mb-6">
          <h3 className="font-semibold mb-4">Thêm giải thưởng mới</h3>
          <div className="grid grid-cols-3 gap-4 mb-4">
            <div>
              <label className="block text-xs text-gray-400 mb-1">Hạng</label>
              <input type="number" value={form.rank} onChange={(e) => setForm((p) => ({ ...p, rank: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="1" min={1} required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Số tiền (VNĐ)</label>
              <input type="number" value={form.amount} onChange={(e) => setForm((p) => ({ ...p, amount: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="5000000" min={0} required />
            </div>
            <div>
              <label className="block text-xs text-gray-400 mb-1">Mô tả</label>
              <input type="text" value={form.description} onChange={(e) => setForm((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-3 py-2 bg-zinc-800 border border-zinc-700 rounded-lg text-white text-sm focus:outline-none focus:ring-2 focus:ring-red-600"
                placeholder="Quán quân" required />
            </div>
          </div>
          <div className="flex gap-2">
            <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 text-white text-sm px-4 py-2 rounded-lg">
              {saving ? "Đang lưu..." : "Thêm"}
            </button>
            <button type="button" onClick={() => setShowForm(false)} className="text-gray-400 hover:text-white text-sm px-4 py-2">Hủy</button>
          </div>
        </form>
      )}

      {/* Prize list */}
      <div className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b border-zinc-800 bg-zinc-800/50">
              <th className="text-left py-3 px-4 text-gray-400 font-medium w-16">Hạng</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Mô tả</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Số tiền</th>
              <th className="text-left py-3 px-4 text-gray-400 font-medium">Người nhận</th>
              <th className="text-center py-3 px-4 text-gray-400 font-medium">Đã trả</th>
              <th className="text-right py-3 px-4 text-gray-400 font-medium">Thao tác</th>
            </tr>
          </thead>
          <tbody>
            {prizes.map((prize) => (
              <tr key={prize.id} className="border-b border-zinc-800 hover:bg-zinc-800/30">
                <td className="py-3 px-4">
                  <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full text-xs font-bold ${
                    prize.rank === 1 ? "bg-red-600 text-white" :
                    prize.rank === 2 ? "bg-zinc-400 text-black" :
                    prize.rank === 3 ? "bg-amber-700 text-white" : "bg-zinc-700 text-gray-300"
                  }`}>{prize.rank}</span>
                </td>
                <td className="py-3 px-4 text-gray-200">{prize.description}</td>
                <td className="py-3 px-4 font-semibold text-red-400">{formatCurrency(prize.amount)}</td>
                <td className="py-3 px-4">
                  <select
                    value={prize.playerId || ""}
                    onChange={(e) => handleAssignPlayer(prize.id, e.target.value)}
                    className="bg-zinc-800 border border-zinc-700 rounded-lg px-2 py-1 text-xs text-white focus:outline-none focus:ring-1 focus:ring-red-600 max-w-[160px]"
                  >
                    <option value="">— Chưa gán —</option>
                    {approvedPlayers.map((p) => (
                      <option key={p.id} value={p.id}>{p.ign}</option>
                    ))}
                  </select>
                </td>
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => handleMarkPaid(prize)}
                    className={`w-7 h-7 rounded-full flex items-center justify-center mx-auto transition-colors ${
                      prize.paid ? "bg-green-500/20 text-green-400 hover:bg-green-500/30" : "bg-zinc-700 text-gray-500 hover:bg-zinc-600"
                    }`}
                    title={prize.paid ? `Đã trả ${prize.paidAt ? new Date(prize.paidAt).toLocaleDateString("vi-VN") : ""}` : "Đánh dấu đã trả"}
                  >
                    <Check className="h-4 w-4" />
                  </button>
                </td>
                <td className="py-3 px-4 text-right">
                  <button onClick={() => handleDelete(prize.id)} className="text-gray-500 hover:text-red-400 p-1">
                    <Trash2 className="h-4 w-4" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        {prizes.length === 0 && (
          <div className="text-center py-12 text-gray-500">
            <Gift className="h-10 w-10 mx-auto mb-3 opacity-30" />
            <p>Chưa có giải thưởng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
