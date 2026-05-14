"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect, useRef } from "react";
import { User, Save, CheckCircle, Camera } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Avatar } from "@/components/ui/Avatar";

interface PlayerProfile {
  ign: string;
  rank: string;
  discord: string;
  phone: string;
  avatar?: string;
  name?: string;
}

export default function ProfilePage() {
  const { data: session, update: updateSession } = useSession();
  const [profile, setProfile] = useState<PlayerProfile>({ ign: "", rank: "", discord: "", phone: "" });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [avatarPreview, setAvatarPreview] = useState<string | null>(null);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/players/profile");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setProfile({
            ign: data.ign || "",
            rank: data.rank || "",
            discord: data.discord || "",
            phone: data.phone || "",
            avatar: data.user?.avatar || undefined,
            name: data.user?.name || session?.user?.name || "",
          });
        }
      } catch { if (!cancelled) setError("Không thể tải thông tin hồ sơ."); }
    })();
    return () => { cancelled = true; };
  }, [session?.user?.name]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/players/profile", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify(profile) });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
        // Update session with new name so navbar reflects the change
        if (profile.name) {
          await updateSession({ name: profile.name });
        }
      }
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleAvatarSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onloadend = () => setAvatarPreview(reader.result as string);
    reader.readAsDataURL(file);
  };

  const handleAvatarUpload = async () => {
    const fileInput = fileInputRef.current;
    if (!fileInput?.files?.[0]) return;

    setUploadingAvatar(true);
    try {
      const formData = new FormData();
      formData.append("file", fileInput.files[0]);

      const res = await fetch("/api/upload/avatar", { method: "POST", body: formData });
      if (res.ok) {
        const data = await res.json();
        setProfile((p) => ({ ...p, avatar: data.avatarUrl }));
        setAvatarPreview(null);
        if (fileInput) fileInput.value = "";
        // Update session to reflect new avatar
        await updateSession({ avatar: data.avatarUrl });
      } else {
        const data = await res.json();
        setError(data.error || "Không thể tải ảnh lên");
      }
    } catch {
      setError("Đã xảy ra lỗi khi tải ảnh lên");
    } finally {
      setUploadingAvatar(false);
    }
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

      {/* Avatar Section */}
      <Card hover={false} className="p-6 mb-6">
        <h2 className="text-lg font-semibold text-[#f5f5f5] mb-4">Ảnh đại diện</h2>
        <div className="flex items-center gap-6">
          <Avatar
            name={profile.name || session?.user?.name || "U"}
            src={avatarPreview || profile.avatar}
            size="lg"
          />
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/png,image/webp"
              onChange={handleAvatarSelect}
              className="hidden"
            />
            <div className="flex items-center gap-3">
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={() => fileInputRef.current?.click()}
              >
                <Camera className="h-4 w-4" />
                Chọn ảnh
              </Button>
              {avatarPreview && (
                <Button
                  type="button"
                  size="sm"
                  onClick={handleAvatarUpload}
                  disabled={uploadingAvatar}
                >
                  {uploadingAvatar ? "Đang tải lên..." : "Lưu ảnh"}
                </Button>
              )}
            </div>
            <p className="text-xs text-[#555] mt-2">JPEG, PNG hoặc WebP. Tối đa 5MB.</p>
          </div>
        </div>
      </Card>

      <Card hover={false} className="p-6">
        <form onSubmit={handleSubmit}>
          <div className="mb-5">
            <label className="block text-sm font-medium text-[#888] mb-1.5">Tên hiển thị</label>
            <input type="text" value={profile.name || ""} onChange={(e) => setProfile((p) => ({ ...p, name: e.target.value }))} className={inputClass} placeholder="Tên của bạn" />
            <p className="text-xs text-[#555] mt-1">Tên này sẽ hiển thị trên hồ sơ và bảng xếp hạng.</p>
          </div>
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
