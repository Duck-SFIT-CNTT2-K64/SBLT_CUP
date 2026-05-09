"use client";

import { useState, useEffect } from "react";
import { Bell, Save, Trophy, Target, Megaphone, UserCheck, Clock, Mail, Smartphone } from "lucide-react";
import { Card } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { usePushNotifications } from "@/lib/hooks/usePushNotifications";

interface NotificationPreference {
  emailEnabled: boolean;
  pushEnabled: boolean;
  tournamentUpdates: boolean;
  matchResults: boolean;
  predictionScored: boolean;
  announcements: boolean;
  registrationStatus: boolean;
  checkInReminder: boolean;
}

const NOTIFICATION_TYPES = [
  {
    key: "tournamentUpdates",
    label: "Cập nhật giải đấu",
    desc: "Thông báo khi có thay đổi về giải đấu",
    icon: Trophy,
    color: "text-blue-400",
  },
  {
    key: "matchResults",
    label: "Kết quả trận đấu",
    desc: "Thông báo khi có kết quả trận đấu mới",
    icon: Trophy,
    color: "text-green-400",
  },
  {
    key: "predictionScored",
    label: "Điểm dự đoán",
    desc: "Thông báo khi dự đoán được chấm điểm",
    icon: Target,
    color: "text-purple-400",
  },
  {
    key: "announcements",
    label: "Thông báo chung",
    desc: "Thông báo từ ban tổ chức",
    icon: Megaphone,
    color: "text-yellow-400",
  },
  {
    key: "registrationStatus",
    label: "Trạng thái đăng ký",
    desc: "Thông báo khi đăng ký được duyệt/từ chối",
    icon: UserCheck,
    color: "text-emerald-400",
  },
  {
    key: "checkInReminder",
    label: "Nhắc điểm danh",
    desc: "Nhắc nhở trước giờ điểm danh",
    icon: Clock,
    color: "text-orange-400",
  },
];

export default function NotificationsPage() {
  const [preferences, setPreferences] = useState<NotificationPreference>({
    emailEnabled: true,
    pushEnabled: true,
    tournamentUpdates: true,
    matchResults: true,
    predictionScored: true,
    announcements: true,
    registrationStatus: true,
    checkInReminder: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [success, setSuccess] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/notifications/preferences");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setPreferences(data);
        }
      } catch (error) {
        console.error("Failed to fetch preferences:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const handleSave = async () => {
    setSaving(true);
    setSuccess(false);
    try {
      const res = await fetch("/api/notifications/preferences", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(preferences),
      });
      if (res.ok) {
        setSuccess(true);
        setTimeout(() => setSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Failed to save preferences:", error);
    } finally {
      setSaving(false);
    }
  };

  const { isSupported: pushSupported, isSubscribed: pushSubscribed, subscribe: pushSubscribe, unsubscribe: pushUnsubscribe } = usePushNotifications();

  const togglePreference = async (key: keyof NotificationPreference) => {
    const newValue = !preferences[key];

    // Handle push notification subscription
    if (key === "pushEnabled" && pushSupported) {
      if (newValue) {
        await pushSubscribe();
      } else {
        await pushUnsubscribe();
      }
    }

    setPreferences((prev) => ({ ...prev, [key]: newValue }));
  };

  if (loading) {
    return (
      <div className="max-w-2xl mx-auto px-4 py-20 text-center">
        <div className="inline-block w-8 h-8 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-10">
      <SectionHeading
        title="Cài đặt thông báo"
        subtitle="Quản lý cách bạn nhận thông báo từ SBLT CUP"
      />

      {success && (
        <Alert variant="success" message="Đã lưu cài đặt thành công!" className="mb-6" />
      )}

      {/* Delivery methods */}
      <Card hover={false} className="p-6 mb-6">
        <h3 className="font-semibold text-[#f5f5f5] mb-4 flex items-center gap-2">
          <Bell className="h-5 w-5 text-[#dc2626]" />
          Phương thức nhận thông báo
        </h3>
        <div className="space-y-4">
          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Mail className="h-5 w-5 text-[#888]" />
              <div>
                <p className="text-sm font-medium text-[#f5f5f5]">Email</p>
                <p className="text-xs text-[#888]">Nhận thông báo qua email</p>
              </div>
            </div>
            <button
              onClick={() => togglePreference("emailEnabled")}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                preferences.emailEnabled ? "bg-[#dc2626]" : "bg-[#333]"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences.emailEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </label>

          <label className="flex items-center justify-between cursor-pointer">
            <div className="flex items-center gap-3">
              <Smartphone className="h-5 w-5 text-[#888]" />
              <div>
                <p className="text-sm font-medium text-[#f5f5f5]">Push Notification</p>
                <p className="text-xs text-[#888]">
                  {!pushSupported
                    ? "Trình duyệt không hỗ trợ"
                    : pushSubscribed
                    ? "Đang nhận thông báo đẩy"
                    : "Nhận thông báo trên trình duyệt"}
                </p>
              </div>
            </div>
            <button
              onClick={() => togglePreference("pushEnabled")}
              disabled={!pushSupported}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                !pushSupported
                  ? "bg-[#222] cursor-not-allowed"
                  : preferences.pushEnabled
                  ? "bg-[#dc2626]"
                  : "bg-[#333]"
              }`}
            >
              <div
                className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                  preferences.pushEnabled ? "translate-x-7" : "translate-x-1"
                }`}
              />
            </button>
          </label>
        </div>
      </Card>

      {/* Notification types */}
      <Card hover={false} className="p-6 mb-6">
        <h3 className="font-semibold text-[#f5f5f5] mb-4">Loại thông báo</h3>
        <div className="space-y-4">
          {NOTIFICATION_TYPES.map(({ key, label, desc, icon: Icon, color }) => (
            <label key={key} className="flex items-center justify-between cursor-pointer">
              <div className="flex items-center gap-3">
                <Icon className={`h-5 w-5 ${color}`} />
                <div>
                  <p className="text-sm font-medium text-[#f5f5f5]">{label}</p>
                  <p className="text-xs text-[#888]">{desc}</p>
                </div>
              </div>
              <button
                onClick={() => togglePreference(key as keyof NotificationPreference)}
                className={`relative w-12 h-6 rounded-full transition-colors ${
                  preferences[key as keyof NotificationPreference] ? "bg-[#dc2626]" : "bg-[#333]"
                }`}
              >
                <div
                  className={`absolute top-1 w-4 h-4 bg-white rounded-full transition-transform ${
                    preferences[key as keyof NotificationPreference] ? "translate-x-7" : "translate-x-1"
                  }`}
                />
              </button>
            </label>
          ))}
        </div>
      </Card>

      {/* Save button */}
      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saving}>
          {saving ? (
            "Đang lưu..."
          ) : (
            <>
              <Save className="h-4 w-4 mr-2" />
              Lưu cài đặt
            </>
          )}
        </Button>
      </div>
    </div>
  );
}
