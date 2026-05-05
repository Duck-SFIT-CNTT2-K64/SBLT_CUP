"use client";

import { useState, useEffect } from "react";
import { Users, Shield, User } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";

interface UserRow {
  id: string; name: string; email: string; role: string; createdAt: string;
  player: { ign: string; isGuest: boolean } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<UserRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => { fetchUsers(); }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) setUsers(await res.json());
    } catch { setError("Không thể tải danh sách người dùng."); } finally { setLoading(false); }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    const res = await fetch(`/api/admin/users/${userId}`, { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ role: newRole }) });
    if (res.ok) setUsers((prev) => prev.map((u) => u.id === userId ? { ...u, role: newRole } : u));
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;
    const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
    if (res.ok) setUsers((prev) => prev.filter((u) => u.id !== userId));
  };

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-7xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white">Quản lý Users</h1>
        <p className="text-sblt-muted mt-1">Quản lý tài khoản và phân quyền</p>
      </div>

      {error && <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">{error}</div>}

      <Card hover={false} className="overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-sblt-dark border-b-2 border-sblt-red">
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Tên</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Email</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Ingame</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Vai trò</th>
                <th className="text-left py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Ngày tạo</th>
                <th className="text-right py-3 px-6 text-sblt-muted font-semibold text-xs uppercase tracking-wider">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((u) => (
                <tr key={u.id} className="border-b border-sblt-border hover:bg-sblt-red/3 transition-colors">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {u.role === "ADMIN" ? <Shield className="h-5 w-5 text-sblt-red" /> : <User className="h-5 w-5 text-sblt-muted" />}
                      <span className="font-medium text-white">{u.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-sblt-white text-sm">{u.email}</td>
                  <td className="py-4 px-6 text-sblt-white text-sm">
                    {u.player?.ign || "-"}
                    {u.player?.isGuest && <Badge variant="yellow" className="ml-2">Khách mời</Badge>}
                  </td>
                  <td className="py-4 px-6">
                    <select value={u.role} onChange={(e) => handleRoleChange(u.id, e.target.value)}
                      className="bg-sblt-dark border border-sblt-border rounded-lg px-3 py-1.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-sblt-red">
                      <option value="PLAYER">Player</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-sblt-muted text-sm">{new Date(u.createdAt).toLocaleDateString("vi-VN")}</td>
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
            <Users className="h-12 w-12 text-sblt-border mx-auto mb-4" />
            <p className="text-sblt-muted">Chưa có người dùng nào</p>
          </div>
        )}
      </Card>
    </div>
  );
}
