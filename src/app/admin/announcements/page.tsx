"use client";

import { useState, useEffect } from "react";
import { Bell, Plus, Edit, Trash2, X } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";

interface Announcement {
  id: string; title: string; content: string; type: string; createdAt: string;
  tournament: { name: string } | null;
}

const TYPE_LABELS: Record<string, string> = {
  GENERAL: "Thông báo chung", SCHEDULE_CHANGE: "Thay đổi lịch trình", RULE_UPDATE: "Cập nhật quy định", RESULT: "Kết quả",
};

export default function AdminAnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", type: "GENERAL" });

  useEffect(() => { fetchAnnouncements(); }, []);

  const fetchAnnouncements = async () => {
    try {
      const res = await fetch("/api/announcements");
      if (res.ok) setAnnouncements(await res.json());
    } catch { /* empty */ } finally { setLoading(false); }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const url = editingId ? `/api/announcements/${editingId}` : "/api/announcements";
    const res = await fetch(url, { method: editingId ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(formData) });
    if (res.ok) { setShowModal(false); setEditingId(null); setFormData({ title: "", content: "", type: "GENERAL" }); fetchAnnouncements(); }
  };

  const handleEdit = (a: Announcement) => { setEditingId(a.id); setFormData({ title: a.title, content: a.content, type: a.type }); setShowModal(true); };
  const handleDelete = async (id: string) => { if (!confirm("Xóa thông báo này?")) return; const res = await fetch(`/api/announcements/${id}`, { method: "DELETE" }); if (res.ok) setAnnouncements((p) => p.filter((a) => a.id !== id)); };

  const inputClass = "w-full px-4 py-2.5 bg-sblt-dark border border-sblt-border rounded-xl text-white placeholder:text-sblt-border focus:outline-none focus:ring-2 focus:ring-sblt-red";

  if (loading) return <div className="p-8 text-center"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="p-6 lg:p-8 max-w-5xl">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-2xl font-bold text-white">Quản lý Thông báo</h1>
          <p className="text-sblt-muted mt-1">Tạo và quản lý thông báo cho tuyển thủ</p>
        </div>
        <Button size="sm" onClick={() => { setEditingId(null); setFormData({ title: "", content: "", type: "GENERAL" }); setShowModal(true); }}>
          <Plus className="h-4 w-4" /> Tạo thông báo
        </Button>
      </div>

      <div className="space-y-4">
        {announcements.map((a) => (
          <Card key={a.id} hover={false} className="p-5">
            <div className="flex items-start justify-between">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <Badge variant="default">{TYPE_LABELS[a.type] || a.type}</Badge>
                  {a.tournament && <span className="text-xs text-sblt-red">{a.tournament.name}</span>}
                </div>
                <h2 className="text-lg font-semibold text-white mb-1">{a.title}</h2>
                <p className="text-sblt-muted text-sm line-clamp-2">{a.content}</p>
                <div className="mt-2 text-xs text-sblt-border">{new Date(a.createdAt).toLocaleString("vi-VN")}</div>
              </div>
              <div className="flex gap-1">
                <button onClick={() => handleEdit(a)} className="p-2 text-sblt-muted hover:text-white hover:bg-sblt-border rounded-lg transition-colors"><Edit className="h-4 w-4" /></button>
                <button onClick={() => handleDelete(a.id)} className="p-2 text-sblt-muted hover:text-red-400 hover:bg-sblt-border rounded-lg transition-colors"><Trash2 className="h-4 w-4" /></button>
              </div>
            </div>
          </Card>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-12"><Bell className="h-12 w-12 text-sblt-border mx-auto mb-4" /><p className="text-sblt-muted">Chưa có thông báo nào</p></div>
      )}

      {showModal && (
        <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
          <Card hover={false} className="p-6 w-full max-w-lg mx-4">
            <div className="flex justify-between items-center mb-4">
              <h2 className="text-xl font-bold text-white">{editingId ? "Sửa thông báo" : "Tạo thông báo mới"}</h2>
              <button onClick={() => setShowModal(false)} className="text-sblt-muted hover:text-white"><X className="h-5 w-5" /></button>
            </div>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Tiêu đề</label>
                <input type="text" value={formData.title} onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))} className={inputClass} required />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Loại thông báo</label>
                <select value={formData.type} onChange={(e) => setFormData((p) => ({ ...p, type: e.target.value }))} className={inputClass}>
                  <option value="GENERAL">Thông báo chung</option>
                  <option value="SCHEDULE_CHANGE">Thay đổi lịch trình</option>
                  <option value="RULE_UPDATE">Cập nhật quy định</option>
                  <option value="RESULT">Kết quả</option>
                </select>
              </div>
              <div className="mb-6">
                <label className="block text-sm font-medium text-sblt-muted mb-1.5">Nội dung</label>
                <textarea value={formData.content} onChange={(e) => setFormData((p) => ({ ...p, content: e.target.value }))} className={`${inputClass} resize-none`} rows={5} required />
              </div>
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 text-sblt-muted hover:text-white transition-colors">Hủy</button>
                <Button type="submit">{editingId ? "Cập nhật" : "Tạo"}</Button>
              </div>
            </form>
          </Card>
        </div>
      )}
    </div>
  );
}
