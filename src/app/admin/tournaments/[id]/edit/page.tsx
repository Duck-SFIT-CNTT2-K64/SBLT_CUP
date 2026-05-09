"use client";

import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

export default function EditTournamentPage() {
  const params = useParams();
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "", season: "", description: "",
    regStart: "", regEnd: "", startDate: "", endDate: "",
    maxPlayers: "64", prizePool: "10000000",
  });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/tournaments/${params.id}`);
        if (!res.ok) { if (!cancelled) setError("Không tìm thấy giải đấu"); return; }
        const data = await res.json();
        const toDateInput = (iso: string) => iso ? new Date(iso).toISOString().split("T")[0] : "";
        if (!cancelled) {
          setFormData({
            name: data.name || "", season: String(data.season || ""), description: data.description || "",
            regStart: toDateInput(data.regStart), regEnd: toDateInput(data.regEnd),
            startDate: toDateInput(data.startDate), endDate: toDateInput(data.endDate),
            maxPlayers: String(data.maxPlayers || 64), prizePool: String(data.prizePool || 10000000),
          });
        }
      } catch { if (!cancelled) setError("Đã xảy ra lỗi khi tải thông tin giải đấu"); } finally { if (!cancelled) setFetching(false); }
    })();
    return () => { cancelled = true; };
  }, [params.id]);

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
      const res = await fetch(`/api/tournaments/${params.id}`, {
        method: "PUT", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...formData, season: parseInt(formData.season), maxPlayers: parseInt(formData.maxPlayers), prizePool: parseInt(formData.prizePool), regStart: new Date(formData.regStart).toISOString(), regEnd: new Date(formData.regEnd).toISOString(), startDate: new Date(formData.startDate).toISOString(), endDate: new Date(formData.endDate).toISOString() }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Đã xảy ra lỗi khi cập nhật giải đấu"); return; }
      router.push("/admin/tournaments");
    } catch { setError("Đã xảy ra lỗi khi cập nhật giải đấu"); } finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#0d0d0d] border border-[#222] rounded-xl text-[#f5f5f5] placeholder:text-[#222] focus:outline-none focus:ring-2 focus:ring-[#dc2626]";

  if (fetching) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="py-12 px-6 lg:px-8 max-w-[1280px] max-w-2xl">
      <RevealOnScroll>
        <div className="flex items-center gap-4 mb-8">
          <Link href="/admin/tournaments" className="text-[#888] hover:text-white"><ArrowLeft className="h-6 w-6" /></Link>
          <div>
            <h1 className="text-2xl font-bold text-[#f5f5f5] sblt-heading">Chỉnh sửa giải đấu</h1>
            <p className="text-[#888] mt-1">Cập nhật thông tin mùa giải</p>
          </div>
        </div>
      </RevealOnScroll>

      <RevealOnScroll>
        <Card hover={false} className="p-6 hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
          <form onSubmit={handleSubmit}>
            {error && <Alert variant="error" message={error} onDismiss={() => setError("")} className="mb-6" />}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#888] mb-1.5">Tên giải đấu *</label>
                <input type="text" name="name" value={formData.name} onChange={handleChange} className={inputClass} placeholder="SBLT CUP Mùa 1" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Mùa giải *</label>
                <input type="number" name="season" value={formData.season} onChange={handleChange} className={inputClass} placeholder="1" required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Số lượng tối đa</label>
                <input type="number" name="maxPlayers" value={formData.maxPlayers} onChange={handleChange} className={inputClass} />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#888] mb-1.5">Mô tả</label>
                <textarea name="description" value={formData.description} onChange={handleChange} rows={3} className={`${inputClass} resize-none`} placeholder="Mô tả về giải đấu..." />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Ngày bắt đầu đăng ký *</label>
                <input type="date" name="regStart" value={formData.regStart} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Ngày kết thúc đăng ký *</label>
                <input type="date" name="regEnd" value={formData.regEnd} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Ngày bắt đầu thi đấu *</label>
                <input type="date" name="startDate" value={formData.startDate} onChange={handleChange} className={inputClass} required />
              </div>
              <div>
                <label className="block text-sm font-medium text-[#888] mb-1.5">Ngày kết thúc thi đấu *</label>
                <input type="date" name="endDate" value={formData.endDate} onChange={handleChange} className={inputClass} required />
              </div>
              <div className="md:col-span-2">
                <label className="block text-sm font-medium text-[#888] mb-1.5">Tổng giải thưởng (VNĐ)</label>
                <input type="number" name="prizePool" value={formData.prizePool} onChange={handleChange} className={inputClass} />
              </div>
            </div>

            <div className="flex justify-end gap-3 mt-6">
              <Link href="/admin/tournaments" className="px-6 py-2.5 text-[#888] hover:text-white transition-colors">Hủy</Link>
              <Button type="submit" disabled={loading}><Trophy className="h-4 w-4" />{loading ? "Đang lưu..." : "Lưu thay đổi"}</Button>
            </div>
          </form>
        </Card>
      </RevealOnScroll>
    </div>
  );
}
