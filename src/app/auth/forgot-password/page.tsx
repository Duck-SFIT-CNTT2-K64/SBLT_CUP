"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { ArrowLeft, CheckCircle } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

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
          <div className="flex justify-center mb-6">
            <Image src="/logo.png" alt="SBLT CUP" width={56} height={56} className="rounded-lg" />
          </div>
          <h1 className="sblt-heading text-3xl text-[#f5f5f5] tracking-tight">Quên mật khẩu</h1>
          <p className="text-[#888] mt-2 text-sm">Nhập email để nhận link đặt lại mật khẩu</p>
        </div>

        <Card hover={false} className="p-6">
          {sent ? (
            <div className="text-center">
              <CheckCircle className="h-16 w-16 text-emerald-500 mx-auto mb-4" />
              <h2 className="text-lg font-semibold mb-2 text-[#f5f5f5]">Đã gửi yêu cầu</h2>
              <p className="text-[#888] text-sm mb-6">
                Nếu email <strong className="text-[#f5f5f5]">{email}</strong> tồn tại trong hệ thống,
                bạn sẽ nhận được link đặt lại mật khẩu. Kiểm tra hộp thư (kể cả spam).
              </p>
              <Link href="/auth/login" className="text-[#dc2626] hover:text-red-400 text-sm flex items-center justify-center gap-1 transition-colors duration-300">
                <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
              </Link>
            </div>
          ) : (
            <form onSubmit={handleSubmit}>
              {error && <Alert variant="error" message={error} onDismiss={() => setError("")} className="mb-4" />}
              <div className="mb-6">
                <label className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)}
                  className="sblt-input-bordered"
                  placeholder="your@email.com" required />
              </div>
              <Button type="submit" disabled={loading} className="w-full">
                {loading ? "Đang gửi..." : "Gửi link đặt lại mật khẩu"}
              </Button>
              <div className="text-center mt-4">
                <Link href="/auth/login" className="text-[#888] hover:text-[#f5f5f5] text-sm flex items-center justify-center gap-1 transition-colors duration-300">
                  <ArrowLeft className="h-4 w-4" /> Quay lại đăng nhập
                </Link>
              </div>
            </form>
          )}
        </Card>
      </div>
    </div>
  );
}
