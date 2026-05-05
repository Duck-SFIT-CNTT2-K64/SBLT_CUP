"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, AlertTriangle, Trophy } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  tournament: { name: string } | null;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; label: string; variant: "red" | "green" | "yellow" | "default" }> = {
  GENERAL: { icon: Bell, label: "Thông báo chung", variant: "default" },
  SCHEDULE_CHANGE: { icon: Calendar, label: "Thay đổi lịch trình", variant: "red" },
  RULE_UPDATE: { icon: AlertTriangle, label: "Cập nhật quy định", variant: "yellow" },
  RESULT: { icon: Trophy, label: "Kết quả", variant: "green" },
};

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/announcements")
      .then((r) => { if (!r.ok) throw new Error(); return r.json(); })
      .then((data) => setAnnouncements(data))
      .catch(() => setError("Không thể tải thông báo. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, []);

  if (loading) return <div className="text-center py-20"><div className="inline-block w-8 h-8 border-2 border-sblt-red/30 border-t-sblt-red rounded-full animate-spin" /></div>;

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <SectionHeading title="Thông báo" subtitle="Các thông báo mới nhất từ Ban Tổ Chức" />

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 text-red-400 px-4 py-3 rounded-xl mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-4">
        {announcements.map((a) => {
          const cfg = TYPE_CONFIG[a.type] || TYPE_CONFIG.GENERAL;
          const Icon = cfg.icon;
          return (
            <Card key={a.id} hover={false} className="p-6">
              <div className="flex items-start gap-4">
                <div className="w-10 h-10 rounded-xl bg-sblt-dark border border-sblt-border flex items-center justify-center shrink-0">
                  <Icon className="h-5 w-5 text-sblt-muted" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-2 flex-wrap">
                    <Badge variant={cfg.variant}>{cfg.label}</Badge>
                    {a.tournament && (
                      <span className="text-xs text-sblt-red">{a.tournament.name}</span>
                    )}
                  </div>
                  <h2 className="text-lg font-bold text-white mb-2">{a.title}</h2>
                  <p className="text-sblt-muted text-sm whitespace-pre-wrap leading-relaxed">{a.content}</p>
                  <div className="mt-3 text-xs text-sblt-border">
                    {new Date(a.createdAt).toLocaleString("vi-VN")}
                  </div>
                </div>
              </div>
            </Card>
          );
        })}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-20">
          <Bell className="h-16 w-16 text-sblt-border mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-sblt-muted mb-2">Chưa có thông báo</h2>
          <p className="text-sblt-muted text-sm">Các thông báo sẽ được cập nhật tại đây</p>
        </div>
      )}
    </div>
  );
}
