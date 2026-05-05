"use client";

import { useState, useEffect } from "react";
import { Bell, Calendar, AlertTriangle, Trophy } from "lucide-react";

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

export default function AnnouncementsPage() {
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

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
      setError("Không thể tải thông báo. Vui lòng thử lại.");
    } finally {
      setLoading(false);
    }
  };

  const getTypeIcon = (type: string) => {
    switch (type) {
      case "SCHEDULE_CHANGE":
        return <Calendar className="h-5 w-5 text-blue-400" />;
      case "RULE_UPDATE":
        return <AlertTriangle className="h-5 w-5 text-yellow-400" />;
      case "RESULT":
        return <Trophy className="h-5 w-5 text-green-400" />;
      default:
        return <Bell className="h-5 w-5 text-gray-400" />;
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
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-20 text-center">
        <div className="text-gray-400">Đang tải...</div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div className="text-center mb-12">
        <Bell className="h-16 w-16 text-yellow-500 mx-auto mb-4" />
        <h1 className="text-4xl font-bold mb-4">Thông báo</h1>
        <p className="text-gray-400">Các thông báo mới nhất từ Ban Tổ Chức</p>
      </div>

      {error && (
        <div className="bg-red-500/10 border border-red-500/50 text-red-400 px-4 py-3 rounded-lg mb-6 text-sm">
          {error}
        </div>
      )}

      <div className="space-y-6">
        {announcements.map((announcement) => (
          <div
            key={announcement.id}
            className="bg-gray-900 border border-gray-800 rounded-xl p-6"
          >
            <div className="flex items-start gap-4">
              <div className="mt-1">{getTypeIcon(announcement.type)}</div>
              <div className="flex-1">
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
                <h2 className="text-xl font-semibold mb-3">{announcement.title}</h2>
                <p className="text-gray-300 whitespace-pre-wrap">{announcement.content}</p>
                <div className="mt-4 text-sm text-gray-500">
                  {new Date(announcement.createdAt).toLocaleString("vi-VN")}
                </div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {announcements.length === 0 && (
        <div className="text-center py-20">
          <Bell className="h-16 w-16 text-gray-600 mx-auto mb-4" />
          <h2 className="text-xl font-semibold text-gray-400 mb-2">Chưa có thông báo</h2>
          <p className="text-gray-500">Các thông báo sẽ được cập nhật tại đây</p>
        </div>
      )}
    </div>
  );
}
