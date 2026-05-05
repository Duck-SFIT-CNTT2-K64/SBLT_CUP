"use client";

import { useState } from "react";
import Link from "next/link";
import { Trophy, ArrowLeft } from "lucide-react";

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [sent, setSent] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error); return; }
      setSent(true);
    } catch {
      setError("Đã xảy ra lỗi. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Trophy className="h-12 w-12 text-red-600 mx-auto mb-4" />
          <h1 className="text-2xl font-bold text-white">Quên mật khẩu</h1>
          <p className="text-gray-400 mt-2">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <div className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
          {sent ? (
            <div className="text-center">
              <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                <span className="text-2xl">✓</span>
              </div>
              <h2 className="text-lg font-semibold mb-2">Đã gửi yêu cầu</h2>
              <p className="text-gray-400 text-sm mb-6">
                Nếu email <strong className="text-white">{email}</strong> tồn tại trong hệ thống,
                bạn sẽ nhận được link đặt lại mật khẩu. Kiểm tra hộp thư (kể cả spam).
              </p>
              <p className="text-xs text-gray-500 mb-4">
                Không nhận được email? Liên hệ admin qua Discord để được hỗ trợ.
              </p>
              <Link href="/auth/login" className="text-red-500 hover:text-red-400 text-sm flex items-center justify-center gap-1">
                <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && (
                <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">{error}</div>
              )}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600"
                  placeholder="your@email.com"
                  required
                />
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-2.5 rounded-lg transition-colors"
              >
                {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
              </button>
              <div className="text-center mt-4">
                <Link href="/auth/login" className="text-gray-400 hover:text-white text-sm flex items-center justify-center gap-1">
                  <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}
