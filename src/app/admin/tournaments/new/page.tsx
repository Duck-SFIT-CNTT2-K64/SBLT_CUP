"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function NewTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", season: "", description: "",
    regStart: "", regEnd: "", startDate: "", endDate: "",
    maxPlayers: "64", prizePool: "10000000",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.regEnd && formData.regStart && formData.regEnd < formData.regStart) { setError("Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký"); return; }
    if (formData.startDate < formData.regEnd) { setError("Ngày bắt đầu thi đấu phải sau ngày kết thúc đăng ký"); return; }
    if (formData.endDate < formData.startDate) { setError("Ngày kết thúc thi đấu phải sau ngày bắt đầu thi đấu"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/tournaments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Đã xảy ra lỗi khi tạo giải đấu"); return; }
      router.push("/admin/tournaments");
    } catch { setError("Đã xảy ra lỗi khi tạo giải đấu"); } finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-sblt-dark border border-sblt-border rounded-xl text-white placeholder:text-sblt-border focus:outline-none focus:ring-2 focus:ring-sblt-red";

  return (
    <div className="p-6 lg:p-8 max-w-2xl">
      <div className="flex items-center gap-4 mb-8">
        <Link href="/admin/tournaments" className="text-sblt-muted hover:text-white"><ArrowLeft className="h-6 w-6" /></Link>
        <div>
          <h1 className="text-2xl font-bold text-white">Tạo giải đấu mới</h1>
          <p className="text-sblt-muted mt-1">Tạo mùa giải đấu mới</p>
        </div>
      </div>

      <Card hover={false} className="p-6">
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="error" message={error} onDismiss={() => setError("")} className="mb-6" />}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Tên giải đấu *</label>
              <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="SBLT CUP Mùa 1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Mùa giải *</label>
              <input type="number" name="season" value={formData.season} onChange={handleChange} className={inputClass} placeholder="1" required />
            </div>
            <div>
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Số lượng tối đa</label>
              <input type="number" name="maxPlayers" value={formData.maxPlayers} onChange={handleChange} className={inputClass} />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Mô tả</label>
              <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Mô tả về giải đấu..." />
            </div>
            <div>
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Ngày bắt đầu đăng ký *</label>
              <input type="date" name="regStart" value={formData.regStart} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Ngày kết thúc đăng ký *</label>
              <input type="date" name="regEnd" value={formData.regEnd} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Ngày bắt đầu thi đấu *</label>
              <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} required />
            </div>
            <div>
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Ngày kết thúc thi đấu *</label>
              <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} required />
            </div>
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-sblt-muted mb-1.5">Tổng giải thưởng (VNĐ)</label>
              <input type="number" name="prizePool" value={formData.prizePool} onChange={handleChange} className={inputClass} />
            </div>
          </div>

          <div className="flex justify-end gap-3 mt-6">
            <Link href="/admin/tournaments" className="px-6 py-2.5 text-sblt-muted hover:text-white transition-colors">Hủy</Link>
            <Button type="submit" disabled={loading}><Trophy className="h-4 w-4" />{loading ? "Đang tạo..." : "Tạo giải đấu"}</Button>
          </div>
        </form>
      </Card>
    </div>
  );
}
