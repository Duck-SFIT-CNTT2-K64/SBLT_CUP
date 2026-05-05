"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Trophy, ArrowLeft } from "lucide-react";
import Link from "next/link";

export default function NewTournamentPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formData, setFormData] = useState({
    name: "",
    season: "",
    description: "",
    regStart: "",
    regEnd: "",
    startDate: "",
    endDate: "",
    maxPlayers: "64",
    prizePool: "10000000",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Client-side date validation
    if (formData.regEnd && formData.regStart && formData.regEnd < formData.regStart) {
      setError("Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký");
      return;
    }
    if (formData.startDate < formData.regEnd) {
      setError("Ngày bắt đầu thi đấu phải sau ngày kết thúc đăng ký");
      return;
    }
    if (formData.endDate < formData.startDate) {
      setError("Ngày kết thúc thi đấu phải sau ngày bắt đầu thi đấu");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/tournaments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi khi tạo giải đấu");
        return;
      }

      router.push("/admin/tournaments");
    } catch {
      setError("Đã xảy ra lỗi khi tạo giải đấu");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="flex items-center gap-4 mb-8">
        <Link
          href="/admin/tournaments"
          className="text-gray-400 hover:text-white"
        >
          <ArrowLeft className="h-6 w-6" />
        </Link>
        <div>
          <h1 className="text-3xl font-bold">Tạo giải đấu mới</h1>
          <p className="text-gray-400 mt-1">Tạo mùa giải đấu mới</p>
        </div>
      </div>

      <form
        onSubmit={handleSubmit}
        className="bg-gray-900 border border-gray-800 rounded-xl p-6"
      >
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
            {error}
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tên giải đấu *
            </label>
            <input
              type="text"
              name="name"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="SBLT CUP Mùa 1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mùa giải *
            </label>
            <input
              type="number"
              name="season"
              value={formData.season}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="1"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Số lượng tối đa
            </label>
            <input
              type="number"
              name="maxPlayers"
              value={formData.maxPlayers}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Mô tả
            </label>
            <textarea
              name="description"
              value={formData.description}
              onChange={handleChange}
              rows={3}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              placeholder="Mô tả về giải đấu..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ngày bắt đầu đăng ký *
            </label>
            <input
              type="date"
              name="regStart"
              value={formData.regStart}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ngày kết thúc đăng ký *
            </label>
            <input
              type="date"
              name="regEnd"
              value={formData.regEnd}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ngày bắt đầu thi đấu *
            </label>
            <input
              type="date"
              name="startDate"
              value={formData.startDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Ngày kết thúc thi đấu *
            </label>
            <input
              type="date"
              name="endDate"
              value={formData.endDate}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
              required
            />
          </div>

          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-300 mb-1">
              Tổng giải thưởng (VNĐ)
            </label>
            <input
              type="number"
              name="prizePool"
              value={formData.prizePool}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
            />
          </div>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Link
            href="/admin/tournaments"
            className="px-6 py-2.5 text-gray-400 hover:text-white transition-colors"
          >
            Hủy
          </Link>
          <button
            type="submit"
            disabled={loading}
            className="bg-yellow-500 hover:bg-yellow-600 disabled:bg-yellow-500/50 text-black font-semibold px-6 py-2.5 rounded-lg transition-colors flex items-center gap-2"
          >
            <Trophy className="h-4 w-4" />
            {loading ? "Đang tạo..." : "Tạo giải đấu"}
          </button>
        </div>
      </form>
    </div>
  );
}
