"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Trophy, Eye, EyeOff } from "lucide-react";

export default function RegisterPage() {
  const router = useRouter();

  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
    ign: "",
  });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (formData.password !== formData.confirmPassword) {
      setError("Mật khẩu xác nhận không khớp");
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: formData.name,
          email: formData.email,
          password: formData.password,
          ign: formData.ign,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Đã xảy ra lỗi khi đăng ký");
        return;
      }

      router.push("/auth/login?registered=true");
    } catch {
      setError("Đã xảy ra lỗi khi đăng ký");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4 py-8">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4">
            <Trophy className="h-12 w-12 text-red-600" />
          </div>
          <h1 className="text-2xl font-bold text-white">Đăng ký tài khoản</h1>
          <p className="text-gray-400 mt-2">Tạo tài khoản để đăng ký tham gia giải đấu</p>
        </div>

        <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          {error && (
            <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
              {error}
            </div>
          )}

          <div className="mb-4">
            <label htmlFor="name" className="block text-sm font-medium text-gray-300 mb-1">
              Họ và tên
            </label>
            <input
              id="name"
              name="name"
              type="text"
              value={formData.name}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="Nguyễn Văn A"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="ign" className="block text-sm font-medium text-gray-300 mb-1">
              Tên ingame (TFT)
            </label>
            <input
              id="ign"
              name="ign"
              type="text"
              value={formData.ign}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="Tên ingame TFT của bạn"
              required
            />
            <p className="text-xs text-gray-500 mt-1">
              Tên này sẽ được sử dụng trong suốt giải đấu
            </p>
          </div>

          <div className="mb-4">
            <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
              Email
            </label>
            <input
              id="email"
              name="email"
              type="email"
              value={formData.email}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-4">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300 mb-1">
              Mật khẩu
            </label>
            <div className="relative">
              <input
                id="password"
                name="password"
                type={showPassword ? "text" : "password"}
                value={formData.password}
                onChange={handleChange}
                className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent pr-10"
                placeholder="••••••••"
                minLength={6}
                required
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white"
              >
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <div className="mb-6">
            <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-300 mb-1">
              Xác nhận mật khẩu
            </label>
            <input
              id="confirmPassword"
              name="confirmPassword"
              type="password"
              value={formData.confirmPassword}
              onChange={handleChange}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
              placeholder="••••••••"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-2.5 rounded-lg transition-colors"
          >
            {loading ? "Đang đăng ký..." : "Đăng ký"}
          </button>

          <p className="text-center text-gray-400 text-sm mt-4">
            Đã có tài khoản?{" "}
            <Link href="/auth/login" className="text-red-500 hover:text-red-400">
              Đăng nhập
            </Link>
          </p>
        </form>
      </div>
    </div>
  );
}
