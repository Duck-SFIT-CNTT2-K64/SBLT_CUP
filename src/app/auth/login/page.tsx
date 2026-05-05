"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Trophy, Eye, EyeOff } from "lucide-react";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/";

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const result = await signIn("credentials", {
        email,
        password,
        redirect: false,
      });

      if (result?.error) {
        setError("Email hoặc mật khẩu không đúng");
      } else {
        router.push(callbackUrl);
        router.refresh();
      }
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-4">
          <Trophy className="h-12 w-12 text-red-600" />
        </div>
        <h1 className="text-2xl font-bold text-white">Đăng nhập</h1>
        <p className="text-gray-400 mt-2">Đăng nhập để tham gia giải đấu SBLT CUP</p>
      </div>

      <form onSubmit={handleSubmit} className="bg-zinc-900 rounded-xl p-6 border border-zinc-800">
        {error && (
          <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-4 text-sm">
            {error}
          </div>
        )}

        <div className="mb-4">
          <label htmlFor="email" className="block text-sm font-medium text-gray-300 mb-1">
            Email
          </label>
          <input
            id="email"
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent"
            placeholder="your@email.com"
            required
          />
        </div>

        <div className="mb-6">
          <div className="flex items-center justify-between mb-1">
            <label htmlFor="password" className="block text-sm font-medium text-gray-300">
              Mật khẩu
            </label>
            <Link href="/auth/forgot-password" className="text-xs text-red-500 hover:text-red-400">
              Quên mật khẩu?
            </Link>
          </div>
          <div className="relative">
            <input
              id="password"
              type={showPassword ? "text" : "password"}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-4 py-2.5 bg-zinc-800 border border-zinc-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-red-600 focus:border-transparent pr-10"
              placeholder="••••••••"
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

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-red-600 hover:bg-red-700 disabled:bg-red-600/50 text-white font-semibold py-2.5 rounded-lg transition-colors"
        >
          {loading ? "Đang đăng nhập..." : "Đăng nhập"}
        </button>

        <p className="text-center text-gray-400 text-sm mt-4">
          Chưa có tài khoản?{" "}
          <Link href="/auth/register" className="text-red-500 hover:text-red-400">
            Đăng ký ngay
          </Link>
        </p>
      </form>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-gray-400">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
