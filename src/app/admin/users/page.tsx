"use client";

import { useState, useEffect } from "react";
import { Users, Shield, User } from "lucide-react";

interface User {
  id: string;
  name: string;
  email: string;
  role: string;
  createdAt: string;
  player: {
    ign: string;
    isGuest: boolean;
  } | null;
}

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const res = await fetch("/api/admin/users");
      if (res.ok) {
        const data = await res.json();
        setUsers(data);
      }
    } catch (error) {
      console.error("Failed to fetch users:", error);
      setError("Không thể tải danh sách người dùng.");
    } finally {
      setLoading(false);
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      const res = await fetch(`/api/admin/users/${userId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ role: newRole }),
      });

      if (res.ok) {
        setUsers((prev) =>
          prev.map((u) => (u.id === userId ? { ...u, role: newRole } : u))
        );
      }
    } catch (error) {
      console.error("Failed to update role:", error);
    }
  };

  const handleDelete = async (userId: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa người dùng này?")) return;

    try {
      const res = await fetch(`/api/admin/users/${userId}`, { method: "DELETE" });
      if (res.ok) {
        setUsers((prev) => prev.filter((u) => u.id !== userId));
      }
    } catch (error) {
      console.error("Failed to delete user:", error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="text-center text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold">Quản lý Users</h1>
        <p className="text-gray-400 mt-2">Quản lý tài khoản và phân quyền</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="bg-gray-900 border border-gray-800 rounded-xl overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="border-b border-gray-800">
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Tên</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Email</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Ingame</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Vai trò</th>
                <th className="text-left py-4 px-6 text-gray-400 font-medium">Ngày tạo</th>
                <th className="text-right py-4 px-6 text-gray-400 font-medium">Thao tác</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id} className="border-b border-gray-800 hover:bg-gray-800/50">
                  <td className="py-4 px-6">
                    <div className="flex items-center gap-3">
                      {user.role === "ADMIN" ? (
                        <Shield className="h-5 w-5 text-yellow-500" />
                      ) : (
                        <User className="h-5 w-5 text-gray-400" />
                      )}
                      <span className="font-medium">{user.name}</span>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-300">{user.email}</td>
                  <td className="py-4 px-6 text-gray-300">
                    {user.player?.ign || "-"}
                    {user.player?.isGuest && (
                      <span className="ml-2 text-xs bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
                        Khách mời
                      </span>
                    )}
                  </td>
                  <td className="py-4 px-6">
                    <select
                      value={user.role}
                      onChange={(e) => handleRoleChange(user.id, e.target.value)}
                      className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-yellow-500"
                    >
                      <option value="PLAYER">Player</option>
                      <option value="ADMIN">Admin</option>
                    </select>
                  </td>
                  <td className="py-4 px-6 text-gray-300 text-sm">
                    {new Date(user.createdAt).toLocaleDateString("vi-VN")}
                  </td>
                  <td className="py-4 px-6">
                    <div className="flex justify-end">
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-400 hover:text-red-300 text-sm"
                      >
                        Xóa
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12 text-gray-400">
            <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Chưa có người dùng nào</p>
          </div>
        )}
      </div>
    </div>
  );
}
