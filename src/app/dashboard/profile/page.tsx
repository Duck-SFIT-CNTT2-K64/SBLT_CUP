"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Save, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

interface PlayerProfile { ign: string; rank: string; discord: string; phone: string; }

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PlayerProfile>({ ign: "", rank: "", discord: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchProfile(); }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/players/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({ ign: data.ign || "", rank: data.rank || "", discord: data.discord || "", phone: data.phone || "" });
      }
    } catch { setError("Không thể tải thông tin hồ sơ."); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/players/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (res.ok) { setSuccess(true); setTimeout(() => setSuccess(false), 3000); }
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const inputClass = "w-full px-4 py-2.5 bg-[#111] border border-[#222] rounded-xl text-[#f5f5f5] placeholder:text-[#555] focus:outline-none focus:ring-2 focus:ring-[#dc2626] focus:border-transparent transition-shadow";

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold flex items-center gap-3 text-[#f5f5f5]">
          <User className="h-7 w-7 text-[#dc2626]" /> Hồ sơ cá nhân
        </h1>
        <p className="text-[#888] mt-2">Cập nhật thông tin thi đấu của bạn</p>
        <div className="sblt-divider w-16 mt-4" />
      </div>

      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}

      <Card hover={false} className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#888] mb-1.5">Tên ingame (TFT) *</label>
            <input type="text" value={profile.ign} onChange={(e) => setProfile((p) => ({ ...p, ign: e.target.value }))} className={inputClass} required />
            <p className="text-xs text-[#555] mt-1">Tên này sẽ được sử dụng trong suốt giải đấu. Liên hệ BTC nếu cần đổi.</p>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#888] mb-1.5">Rank hiện tại</label>
            <select value={profile.rank} onChange={(e) => setProfile((p) => ({ ...p, rank: e.target.value }))} className={inputClass}>
              <option value="">Chọn rank</option>
              {["Sắt", "Đồng", "Bạc", "Vàng", "Bạch Kim", "Kim Cương", "Cao Thủ", "Đại Cao Thủ", "Thách Đấu"].map((r) => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#888] mb-1.5">Discord username</label>
            <input type="text" value={profile.discord} onChange={(e) => setProfile((p) => ({ ...p, discord: e.target.value }))} className={inputClass} placeholder="username#1234" />
          </div>
          <div className="mb-6">
            <label className="block text-sm font-medium text-[#888] mb-1.5">Số điện thoại</label>
            <input type="tel" value={profile.phone} onChange={(e) => setProfile((p) => ({ ...p, phone: e.target.value }))} className={inputClass} placeholder="0912345678" />
          </div>
          <div className="flex items-center gap-4">
            <Button type="submit" disabled={loading}><Save className="h-4 w-4" />{loading ? "Đang lưu..." : "Lưu thay đổi"}</Button>
            {success && <span className="flex items-center gap-1 text-green-400 text-sm"><CheckCircle className="h-4 w-4" /> Cập nhật thành công!</span>}
          </div>
        </form>
      </Card>
    </div>
  );
}
