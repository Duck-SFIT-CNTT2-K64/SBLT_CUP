"use client";

import { useSession } from "next-auth/react";
import { Shield } from "lucide-react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[50vh]">
        <div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" />
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return (
      <div className="flex flex-col items-center justify-center min-h-[50vh] text-center">
        <Shield className="h-16 w-16 text-sblt-border mb-4" />
        <h2 className="text-xl font-semibold text-sblt-muted mb-2">Không có quyền truy cập</h2>
        <p className="text-sblt-muted text-sm">Bạn cần quyền Admin để truy cập trang này.</p>
      </div>
    );
  }

  return <>{children}</>;
}
