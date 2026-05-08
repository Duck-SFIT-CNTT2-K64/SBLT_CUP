"use client";

import { useState, Suspense } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
        <Link href="/auth/forgot-password" className="text-[#dc2626] hover:text-red-400 text-sm transition-colors duration-300">Yêu cầu link mới</Link>
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
        <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
        <h2 className="text-lg font-semibold mb-2 text-[#f5f5f5]">Đặt lại thành công!</h2>
        <p className="text-[#888] text-sm">Đang chuyển về trang đăng nhập...</p>
      </div>
    );
  }

  return (
    <form onSubmit={handleSubmit}>
      {error && <Alert variant="error" message={error} onDismiss={() => setError("")} className="mb-4" />}
      <div className="mb-5">
        <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Mật khẩu mới</label>
        <div className="relative">
          <input type={showPassword ? "text" : "password"} value={password} onChange={(e) => setPassword(e.target.value)}
            className="sblt-input-bordered pr-10"
            placeholder="••••••••" minLength={6} required />
          <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#f5f5f5] transition-colors duration-300">
            {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
          </button>
        </div>
      </div>
      <div className="mb-6">
        <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Xác nhận mật khẩu</label>
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)}
          className="sblt-input-bordered"
          placeholder="••••••••" required />
      </div>
      <Button type="submit" disabled={loading} className="w-full">
        {loading ? "Đang đặt lại..." : "Đặt lại mật khẩu"}
      </Button>
    </form>
  );
}

export default function ResetPasswordPage() {
  return (
    <div className="min-h-[80vh] flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <Image src="/logo.png" alt="SBLT CUP" width={56} height={56} className="rounded-lg mx-auto mb-4" />
          <h1 className="sblt-heading text-3xl text-[#f5f5f5] tracking-tight">Đặt lại mật khẩu</h1>
        </div>
        <Card hover={false} className="p-6">
          <Suspense fallback={<div className="text-[#888] text-center">Đang tải...</div>}>
            <ResetPasswordForm />
          </Suspense>
        </Card>
      </div>
    </div>
  );
}
