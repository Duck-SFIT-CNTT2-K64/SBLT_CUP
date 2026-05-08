"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
      const result = await signIn("credentials", { email, password, redirect: false });
      if (result?.error) setError("Email hoặc mật khẩu không đúng");
      else { router.push(callbackUrl); router.refresh(); }
    } catch {
      setError("Đã xảy ra lỗi khi đăng nhập");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-md">
      <div className="text-center mb-8">
        <div className="flex justify-center mb-6">
          <div className="animate-pulse-glow rounded-xl p-2">
            <Image src="/logo.png" alt="SBLT CUP" width={56} height={56} className="rounded-lg" />
          </div>
        </div>
        <h1 className="sblt-heading text-3xl text-[#f5f5f5] tracking-tight">Đăng nhập</h1>
        <p className="text-[#888] mt-2 text-sm">Đăng nhập để tham gia giải đấu SBLT CUP</p>
      </div>

      <Card hover={false} className="p-6">
        <form onSubmit={handleSubmit}>
          {error && <Alert variant="error" message={error} onDismiss={() => setError("")} className="mb-4" />}

          <div className="mb-5">
            <label htmlFor="email" className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="sblt-input-bordered"
              placeholder="your@email.com"
              required
            />
          </div>

          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <label htmlFor="password" className="block text-xs font-semibold text-[#888] uppercase tracking-wider">Mật khẩu</label>
              <Link href="/auth/forgot-password" className="text-xs text-[#dc2626] hover:text-red-400 transition-colors duration-300">
                Quên mật khẩu?
              </Link>
            </div>
            <div className="relative">
              <input
                id="password"
                type={showPassword ? "text" : "password"}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="sblt-input-bordered pr-10"
                placeholder="••••••••"
                required
              />
              <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#f5f5f5] transition-colors duration-300">
                {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
              </button>
            </div>
          </div>

          <Button type="submit" disabled={loading} className="w-full">
            {loading ? "Đang đăng nhập..." : "Đăng nhập"}
          </Button>

          <p className="text-center text-[#888] text-sm mt-5">
            Chưa có tài khoản?{" "}
            <Link href="/auth/register" className="text-[#dc2626] hover:text-red-400 transition-colors duration-300 font-medium">
              Đăng ký ngay
            </Link>
          </p>
        </form>
      </Card>
    </div>
  );
}

export default function LoginPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <Suspense fallback={<div className="text-[#888]">Đang tải...</div>}>
        <LoginForm />
      </Suspense>
    </div>
  );
}
