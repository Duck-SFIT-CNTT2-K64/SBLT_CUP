"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, Eye, EyeOff } from "lucide-react";

function ResetPasswordForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const token = searchParams.get("token");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState("");

  if (!token) {
    return (
      <div className="text-center">
        <p className="text-red-400 mb-4">Link không hợp lệ hoặc đã hết hạn.</p>
        <Link href="/auth/forgot-password" className="text-red-500 hover:text-red-400 text-sm">Yêu cầu link mới</Link>
      </div>
    );
  }

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (password !== confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
    if (password.length < 6) { setError("Mật khẩu phải có ít nhất 6 ký tự"); return; }

    setLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, password }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSuccess(true);
      setTimeout(() => router.push("/auth/login"), 3000);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  if (success) {
    return (
      <div className="text-center">
        <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
          <span className="text-2xl">✓</span>
        </div>
        <h2 className="text-lg font-semibold mb-2">Đặt lại thành công!</h2>
        <p className="text-gray-400 text-sm">Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
      )}
      <div className="mb-4">
        <label className="block text-sm font-medium text-gray-300 mb-1">Mật khẩu mới</label>
        <div className="relative">
          <input
            type={showPassword ? "text" : "password"}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 pr-10"
            placeholder="••••••••"
            minLength={6}
            required
          />
          <button type="button" onClick={() => setShowPassword(!showPassword)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-300 mb-1">Xác nhận mật khẩu</label>
        <input
          type="password"
          value={confirmPassword}
          onChange={(e) => setConfirmPassword(e.target.value)}
          className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
          placeholder="••••••••"
          required
        />
      </div>
      <button
        type="submit"
        disabled={loading}
        className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-2.5 rounded-lg transition-colors"
      >
        {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
      </button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Đặt lại mật khẩu</h1>
        </div>
        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          <Suspense fallback={<div className="text-gray-400 text-center">Đang tải...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </div>
      </div>
    </div>
  );
}
