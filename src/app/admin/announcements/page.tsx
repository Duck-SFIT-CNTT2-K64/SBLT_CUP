"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Edit, Trash2, X } from "lucide-react";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  tournament: {
    name: string;
  } | null;
}

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [formData, setFormData] = useState({
    title: "",
    content: "",
    type: "GENERAL",
  });

  useEffect(() => {
    fetchAnnouncements();
  }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) {
        const data = await res.json();
        setAnnouncements(data);
      }
    } catch (error) {
      console.error("Failed to fetch announcements:", error);
      setError("Không thể tải thông báo.");
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    try {
      const url = editingId
        ? `/api/announcements/${editingId}`
        : "/api/announcements";

      const res = await fetch(url, {
        method: editingId ? "PUT" : "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (res.ok) {
        setShowModal(false);
        setEditingId(null);
        setFormData({ title: "", content: "", type: "GENERAL" });
        fetchAnnouncements();
      }
    } catch (error) {
      console.error("Failed to save announcement:", error);
    }
  };

  const handleEdit = (announcement: Announcement) => {
    setEditingId(announcement.id);
    setFormData({
      title: announcement.title,
      content: announcement.content,
      type: announcement.type,
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Bạn có chắc chắn muốn xóa thông báo này?")) return;

    try {
      const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" });
      if (res.ok) {
        setAnnouncements((prev) => prev.filter((a) => a.id !== id));
      }
    } catch (error) {
      console.error("Failed to delete announcement:", error);
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      GENERAL: "Thông báo chung",
      SCHEDULE_CHANGE: "Thay đổi lịch trình",
      RULE_UPDATE: "Cập nhật quy định",
      RESULT: "Kết quả",
    };
    return labels[type] || type;
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
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold">Quản lý Thông báo</h1>
          <p className="text-gray-400 mt-2">Tạo và quản lý thông báo cho tuyển thủ</p>
        </div>
        <button
          onClick={() => {
            setEditingId(null);
            setFormData({ title: "", content: "", type: "GENERAL" });
            setShowModal(true);
          }}
          className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-4 py-2 rounded-lg flex items-center gap-2 transition-colors"
        >
          <Plus className="h-4 w-4" />
          Tạo thông báo
        </button>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-3 mb-2">
                  <span className="text-xs font-medium text-gray-400 bg-gray-800 px-2 py-1 rounded">
                    {getTypeLabel(announcement.type)}
                  </span>
                  {announcement.tournament && (
                    <span className="text-xs text-yellow-400">
                      {announcement.tournament.name}
                    </span>
                  )}
                </div>
                <h2 className="text-lg font-semibold mb-2">{announcement.title}</h2>
                <p className="text-gray-400 text-sm line-clamp-2">{announcement.content}</p>
                <div className="mt-3 text-xs text-gray-500">
                  {new Date(announcement.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
              <div className="flex gap-2">
                <button
                  onClick={() => handleEdit(announcement)}
                  className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Edit className="h-4 w-4" />
                </button>
                <button
                  onClick={() => handleDelete(announcement.id)}
                  className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-700 rounded-lg transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12 text-gray-400">
          <Bell className="h-12 w-12 mx-auto mb-4 opacity-50" />
          <p>Chưa có thông báo nào</p>
        </div>
      )}

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-gray-900 border border-gray-800 rounded-xl p-6 w-full max-w-lg">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold">
                {editingId ? "Sửa thông báo" : "Tạo thông báo mới"}
              </h2>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-white"
              >
                <X className="h-5 w-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Tiêu đề
                </label>
                <input
                  type="text"
                  value={formData.title}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, title: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Loại thông báo
                </label>
                <select
                  value={formData.type}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, type: e.target.value }))
                  }
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                >
                  <option value="GENERAL">Thông báo chung</option>
                  <option value="SCHEDULE_CHANGE">Thay đổi lịch trình</option>
                  <option value="RULE_UPDATE">Cập nhật quy định</option>
                  <option value="RESULT">Kết quả</option>
                </select>
              </div>

              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-300 mb-1">
                  Nội dung
                </label>
                <textarea
                  value={formData.content}
                  onChange={(e) =>
                    setFormData((prev) => ({ ...prev, content: e.target.value }))
                  }
                  rows={5}
                  className="w-full px-4 py-2.5 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:ring-2 focus:ring-yellow-500"
                  required
                />
              </div>

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 text-gray-400 hover:text-white transition-colors"
                >
                  Hủy
                </button>
                <button
                  type="submit"
                  className="bg-yellow-500 hover:bg-yellow-600 text-black font-semibold px-6 py-2 rounded-lg transition-colors"
                >
                  {editingId ? "Cập nhật" : "Tạo"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
