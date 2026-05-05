"use client";

import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { useEffect } from "react";

export default function AdminGuard({ children }: { children: React.ReactNode }) {
  const { data: session, status } = useSession();
  const router = useRouter();

  useEffect(() => {
    if (status === "loading") return;
    if (!session) {
      router.replace("/auth/login?callbackUrl=/admin");
      return;
    }
    if (session.user.role !== "ADMIN") {
      router.replace("/dashboard");
    }
  }, [session, status, router]);

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[calc(100vh-4rem)] bg-black">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  if (!session || session.user.role !== "ADMIN") {
    return null;
  }

  return <>{children}</>;
}
