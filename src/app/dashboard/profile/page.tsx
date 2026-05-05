"use client";

import { useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { User, Save } from "lucide-react";

interface PlayerProfile {
  ign: string;
  rank: string;
  discord: string;
  phone: string;
}

export default function ProfilePage() {
  const { data: session } = useSession();
  const [profile, setProfile] = useState<PlayerProfile>({
    ign: "",
    rank: "",
    discord: "",
    phone: "",
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchProfile();
  }, []);

  const fetchProfile = async () => {
    try {
      const res = await fetch("/api/players/profile");
      if (res.ok) {
        const data = await res.json();
        setProfile({
          ign: data.ign || "",
          rank: data.rank || "",
          discord: data.discord || "",
          phone: data.phone || "",
        });
      }
    } catch (error) {
      console.error("Failed to fetch profile:", error);
      setError("Không thể tải thông tin hồ sơ.");
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSuccess(false);

    try {
      const res = await fetch("/api/players/profile", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profile),
      });

      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to update profile:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold flex items-center gap-3">
          <User className="h-8 w-8 text-yellow-500" />
          Hồ sơ cá nhân
        </h1>
        <p className="text-gray-400 mt-2">Cập nhật thông tin thi đấu của bạn</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="bg-gray-900 border border-gray-800 rounded-xl p-6">
        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Tên ingame (TFT) *
          </label>
          <input
            type="text"
            value={profile.ign}
            onChange={(e) => setProfile((prev) => ({ ...prev, ign: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            required
          />
          <p className="text-xs text-gray-500 mt-1">
            Tên này sẽ được sử dụng trong suốt giải đấu. Liên hệ BTC nếu cần đổi.
          </p>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Rank hiện tại
          </label>
          <select
            value={profile.rank}
            onChange={(e) => setProfile((prev) => ({ ...prev, rank: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
          >
            <option value="">Chọn rank</option>
            <option value="Sắt">Sắt</option>
            <option value="Đồng">Đồng</option>
            <option value="Bạc">Bạc</option>
            <option value="Vàng">Vàng</option>
            <option value="Bạch Kim">Bạch Kim</option>
            <option value="Kim Cương">Kim Cương</option>
            <option value="Cao Thủ">Cao Thủ</option>
            <option value="Đại Cao Thủ">Đại Cao Thủ</option>
            <option value="Thách Đấu">Thách Đấu</option>
          </select>
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Discord username
          </label>
          <input
            type="text"
            value={profile.discord}
            onChange={(e) => setProfile((prev) => ({ ...prev, discord: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="username#1234"
          />
        </div>

        <div className="mb-6">
          <label className="block text-sm font-medium text-gray-300 mb-2">
            Số điện thoại
          </label>
          <input
            type="tel"
            value={profile.phone}
            onChange={(e) => setProfile((prev) => ({ ...prev, phone: e.target.value }))}
            className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            placeholder="0912345678"
          />
        </div>

        <div className="flex items-center gap-4">
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {loading ? "Đang lưu..." : "Lưu thay đổi"}
          </button>

          {success && (
            <span className="text-green-400 text-sm">Cập nhật thành công!</span>
          )}
        </div>
      </form>
    </div>
  );
}
