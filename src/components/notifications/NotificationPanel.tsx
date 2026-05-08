"use client";

import { useState, useEffect } from "react";
import { Check, CheckCheck, Bell, Trophy, Target, Megaphone, UserCheck, Clock } from "lucide-react";
import { NotificationType } from "@prisma/client";

interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  link: string | null;
  read: boolean;
  createdAt: string;
}

interface NotificationPanelProps {
  onClose: () => void;
  onCountChange: (count: number) => void;
}

const NOTIFICATION_ICONS: Record<NotificationType, typeof Bell> = {
  TOURNAMENT_UPDATE: Trophy,
  MATCH_RESULT: Trophy,
  PREDICTION_SCORED: Target,
  ANNOUNCEMENT: Megaphone,
  REGISTRATION_STATUS: UserCheck,
  CHECK_IN_REMINDER: Clock,
};

const NOTIFICATION_COLORS: Record<NotificationType, string> = {
  TOURNAMENT_UPDATE: "text-blue-400",
  MATCH_RESULT: "text-green-400",
  PREDICTION_SCORED: "text-purple-400",
  ANNOUNCEMENT: "text-yellow-400",
  REGISTRATION_STATUS: "text-emerald-400",
  CHECK_IN_REMINDER: "text-orange-400",
};

export function NotificationPanel({ onClose, onCountChange }: NotificationPanelProps) {
  const [notifications, setNotifications] = useState<Notification[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    fetchNotifications();
  }, [page]);

  const fetchNotifications = async () => {
    try {
      const res = await fetch(`/api/notifications?page=${page}&limit=10`);
      if (res.ok) {
        const data = await res.json();
        setNotifications((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
        setHasMore(data.pagination.page < data.pagination.totalPages);
      }
    } catch (error) {
      console.error("Failed to fetch notifications:", error);
    } finally {
      setLoading(false);
    }
  };

  const markAsRead = async (id: string) => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read", notificationId: id }),
      });
      setNotifications((prev) =>
        prev.map((n) => (n.id === id ? { ...n, read: true } : n))
      );
      // Fetch updated count
      const res = await fetch("/api/notifications/unread-count");
      if (res.ok) {
        const data = await res.json();
        onCountChange(data.count);
      }
    } catch (error) {
      console.error("Failed to mark as read:", error);
    }
  };

  const markAllAsRead = async () => {
    try {
      await fetch("/api/notifications", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "read-all" }),
      });
      setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
      onCountChange(0);
    } catch (error) {
      console.error("Failed to mark all as read:", error);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes} phút trước`;
    if (hours < 24) return `${hours} giờ trước`;
    if (days < 7) return `${days} ngày trước`;
    return date.toLocaleDateString("vi-VN");
  };

  return (
    <div className="absolute right-0 top-full mt-2 w-96 max-h-[500px] bg-[#111] border border-[#222] rounded-xl shadow-2xl overflow-hidden z-50">
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b border-[#222]">
        <h3 className="font-semibold text-[#f5f5f5]">Thông báo</h3>
        <button
          onClick={markAllAsRead}
          className="text-xs text-[#888] hover:text-[#dc2626] transition-colors flex items-center gap-1"
        >
          <CheckCheck className="h-3 w-3" />
          Đánh dấu tất cả đã đọc
        </button>
      </div>

      {/* Notifications list */}
      <div className="overflow-y-auto max-h-[400px]">
        {loading && page === 1 ? (
          <div className="p-8 text-center">
            <div className="inline-block w-6 h-6 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" />
          </div>
        ) : notifications.length === 0 ? (
          <div className="p-8 text-center">
            <Bell className="h-12 w-12 text-[#222] mx-auto mb-3" />
            <p className="text-[#888] text-sm">Không có thông báo nào</p>
          </div>
        ) : (
          <div>
            {notifications.map((notification) => {
              const Icon = NOTIFICATION_ICONS[notification.type] || Bell;
              const iconColor = NOTIFICATION_COLORS[notification.type] || "text-[#888]";

              return (
                <div
                  key={notification.id}
                  className={`p-4 border-b border-[#222] hover:bg-[#1a1a1a] transition-colors ${
                    !notification.read ? "bg-[#dc2626]/5" : ""
                  }`}
                >
                  <div className="flex gap-3">
                    <div className={`mt-1 ${iconColor}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-start justify-between gap-2">
                        <p className="text-sm font-medium text-[#f5f5f5] truncate">
                          {notification.title}
                        </p>
                        {!notification.read && (
                          <button
                            onClick={() => markAsRead(notification.id)}
                            className="shrink-0 text-[#888] hover:text-[#dc2626] transition-colors"
                            title="Đánh dấu đã đọc"
                          >
                            <Check className="h-4 w-4" />
                          </button>
                        )}
                      </div>
                      <p className="text-xs text-[#888] mt-1 line-clamp-2">
                        {notification.message}
                      </p>
                      <p className="text-xs text-[#555] mt-2">
                        {formatTime(notification.createdAt)}
                      </p>
                    </div>
                  </div>
                  {notification.link && (
                    <a
                      href={notification.link}
                      onClick={onClose}
                      className="block mt-2 ml-8 text-xs text-[#dc2626] hover:underline"
                    >
                      Xem chi tiết →
                    </a>
                  )}
                </div>
              );
            })}

            {hasMore && (
              <button
                onClick={() => setPage((p) => p + 1)}
                className="w-full p-3 text-sm text-[#888] hover:text-[#dc2626] hover:bg-[#1a1a1a] transition-colors"
              >
                Tải thêm
              </button>
            )}
          </div>
        )}
      </div>

      {/* Footer */}
      <div className="p-3 border-t border-[#222] bg-[#0a0a0a]">
        <a
          href="/dashboard/notifications"
          onClick={onClose}
          className="block text-center text-xs text-[#888] hover:text-[#dc2626] transition-colors"
        >
          Xem tất cả thông báo
        </a>
      </div>
    </div>
  );
}
