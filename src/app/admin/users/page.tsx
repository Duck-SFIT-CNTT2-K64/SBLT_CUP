"use client";

import { useState, useEffect } from "react";
import { Users, Shield, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Alert } from "@/components/ui/Alert";
import { RevealOnScroll } from "@/components/ui/RevealOnScroll";

interface UserRow {
  id: string; name: string; email: string; role: string; createdAt: string;
  player: { ign: string; isGuest: boolean } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/admin/users");
        if (res.ok && !cancelled) setUsers(await res.json());
      } catch { if (!cancelled) setError("Không thể tải danh sách người dùng."); } finally { if (!cancelled) setLoading(false); }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    if (res.ok) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" /></div>;

  return (
    <div className="py-12 px-6 lg:px-8 max-w-[1280px]">
      <RevealOnScroll>
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-[#f5f5f5] sblt-heading">Quản lý Users</h1>
          <p className="text-[#888] mt-1">Quản lý tài khoản và phân quyền</p>
        </div>
      </RevealOnScroll>

      {error && <Alert variant="error" message={error} onDismiss={() => setError(null)} className="mb-6" />}

      <RevealOnScroll>
        <Card hover={false} className="overflow-hidden hover:border-[#dc2626]/60 hover:-translate-y-0.5 hover:shadow-[0_0_24px_rgba(220,38,38,0.15)]">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[#0d0d0d] border-b-2 border-[#dc2626]">
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Tên</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Email</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Ingame</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Vai trò</th>
                  <th className="text-left py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Ngày tạo</th>
                  <th className="text-right py-3 px-6 text-[#888] font-semibold text-xs uppercase tracking-wider">Thao tác</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.id} className="border-b border-[#222] hover:bg-[#dc2626]/3 transition-colors">
                    <td className="py-4 px-6">
                      <div className="flex items-center gap-3">
                        {u.role === "ADMIN" ? <Shield className="h-5 w-5 text-[#dc2626]" /> : <User className="h-5 w-5 text-[#888]" />}
                        <span className="font-medium text-[#f5f5f5]">{u.name}</span>
                      </div>
                    </td>
                    <td className="py-4 px-6 text-[#f5f5f5] text-sm">{u.email}</td>
                    <td className="py-4 px-6 text-[#f5f5f5] text-sm">
                      {u.player?.ign || "-"}
                      {u.player?.isGuest && <Badge variant="yellow" className="ml-2">Khách mời</Badge>}
                    </td>
                    <td className="py-4 px-6">
                      <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                        className="bg-[#0d0d0d] border border-[#222] rounded-lg px-3 py-1.5 text-sm text-[#f5f5f5] focus:outline-none focus:ring-2 focus:ring-[#dc2626]">
                        <option value="PLAYER">Player</option>
                        <option value="ADMIN">Admin</option>
                      </select>
                    </td>
                    <td className="py-4 px-6 text-[#888] text-sm">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
                    <td className="py-4 px-6 text-right">
                      <button onClick={() => handleDelete(u.id)} className="text-red-400 hover:text-red-300 text-sm">Xóa</button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {users.length === 0 && (
            <div className="text-center py-12">
              <Users className="h-12 w-12 text-[#222] mx-auto mb-4" />
              <p className="text-[#888]">Chưa có người dùng nào</p>
            </div>
          )}
        </Card>
      </RevealOnScroll>
    </div>
  );
}
