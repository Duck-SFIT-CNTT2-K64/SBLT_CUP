"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";

export default function RegisterPage() {
  const router = useRouter();
  const [formData, setFormData] = useState({ name: "", email: "", password: "", confirmPassword: "", ign: "" });
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (formData.password !== formData.confirmPassword) { setError("Mật khẩu xác nhận không khớp"); return; }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: formData.name, email: formData.email, password: formData.password, ign: formData.ign }),
      });
      const data = await res.json();
      if (!res.ok) { setError(data.error || "Đã xảy ra lỗi khi đăng ký"); return; }
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
          <div className="flex justify-center mb-6">
            <div className="animate-pulse-glow rounded-xl p-2">
              <Image src="/logo.png" alt="SBLT CUP" width={56} height={56} className="rounded-lg" />
            </div>
          </div>
          <h1 className="sblt-heading text-3xl text-[#f5f5f5] tracking-tight">Đăng ký tài khoản</h1>
          <p className="text-[#888] mt-2 text-sm">Tạo tài khoản để đăng ký tham gia giải đấu</p>
        </div>

        <Card hover={false} className="p-6">
          <form onSubmit={handleSubmit}>
            {error && <Alert variant="error" message={error} onDismiss={() => setError("")} className="mb-4" />}

            <div className="mb-5">
              <label htmlFor="name" className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Họ và tên</label>
              <input id="name" name="name" type="text" value={formData.name} onChange={handleChange}
                className="sblt-input-bordered"
                placeholder="Nguyễn Văn A" required />
            </div>

            <div className="mb-5">
              <label htmlFor="ign" className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Tên ingame (TFT)</label>
              <input id="ign" name="ign" type="text" value={formData.ign} onChange={handleChange}
                className="sblt-input-bordered"
                placeholder="Tên ingame TFT của bạn" required />
              <p className="text-xs text-[#555] mt-1">Tên này sẽ được sử dụng trong suốt giải đấu</p>
            </div>

            <div className="mb-5">
              <label htmlFor="email" className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Email</label>
              <input id="email" name="email" type="email" value={formData.email} onChange={handleChange}
                className="sblt-input-bordered"
                placeholder="your@email.com" required />
            </div>

            <div className="mb-5">
              <label htmlFor="password" className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Mật khẩu</label>
              <div className="relative">
                <input id="password" name="password" type={showPassword ? "text" : "password"} value={formData.password} onChange={handleChange}
                  className="sblt-input-bordered pr-10"
                  placeholder="••••••••" minLength={6} required />
                <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-3 top-1/2 -translate-y-1/2 text-[#888] hover:text-[#f5f5f5] transition-colors duration-300">
                  {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <div className="mb-6">
              <label htmlFor="confirmPassword" className="block text-xs font-semibold text-[#888] mb-2 uppercase tracking-wider">Xác nhận mật khẩu</label>
              <input id="confirmPassword" name="confirmPassword" type="password" value={formData.confirmPassword} onChange={handleChange}
                className="sblt-input-bordered"
                placeholder="••••••••" required />
            </div>

            <Button type="submit" disabled={loading} className="w-full">
              {loading ? "Đang đăng ký..." : "Đăng ký"}
            </Button>

            <p className="text-center text-[#888] text-sm mt-5">
              Đã có tài khoản?{" "}
              <Link href="/auth/login" className="text-[#dc2626] hover:text-red-400 transition-colors duration-300 font-medium">Đăng nhập</Link>
            </p>
          </form>
        </Card>
      </div>
    </div>
  );
}
