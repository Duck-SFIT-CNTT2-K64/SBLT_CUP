"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession } from "next-auth/react";
import { Bell, X, Calendar, AlertTriangle, Trophy, ChevronLeft, ChevronRight, Megaphone } from "lucide-react";
import { Badge } from "@/components/ui/Badge";

interface Announcement {
  id: string;
  title: string;
  content: string;
  type: string;
  createdAt: string;
  tournament: { name: string } | null;
}

const TYPE_CONFIG: Record<string, { icon: typeof Bell; label: string; variant: "red" | "green" | "yellow" | "default"; accentBorder: string; accentBg: string }> = {
  GENERAL: { icon: Megaphone, label: "Thông báo chung", variant: "default", accentBorder: "border-t-[#dc2626]", accentBg: "bg-[#dc2626]/10" },
  SCHEDULE_CHANGE: { icon: Calendar, label: "Thay đổi lịch", variant: "red", accentBorder: "border-t-[#dc2626]", accentBg: "bg-[#dc2626]/10" },
  RULE_UPDATE: { icon: AlertTriangle, label: "Quy định", variant: "yellow", accentBorder: "border-t-amber-500", accentBg: "bg-amber-500/10" },
  RESULT: { icon: Trophy, label: "Kết quả", variant: "green", accentBorder: "border-t-emerald-500", accentBg: "bg-emerald-500/10" },
};

const STORAGE_KEY = "sblt_dismissed_announcements";

function getDismissedIds(): string[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

function addDismissedId(id: string) {
  const current = getDismissedIds();
  if (!current.includes(id)) {
    current.push(id);
    localStorage.setItem(STORAGE_KEY, JSON.stringify(current));
  }
}

function clearDismissedIds() {
  localStorage.removeItem(STORAGE_KEY);
}

export { clearDismissedIds };

export default function AnnouncementPopup() {
  const { data: session, status } = useSession();
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isOpen, setIsOpen] = useState(false);

  const fetchAndFilter = useCallback(async () => {
    if (status !== "authenticated") return;
    try {
      const res = await fetch("/api/announcements");
      if (!res.ok) return;
      const all: Announcement[] = await res.json();
      const dismissed = getDismissedIds();
      const unseen = all.filter((a) => !dismissed.includes(a.id));
      if (unseen.length > 0) {
        setAnnouncements(unseen);
        setCurrentIndex(0);
        setIsOpen(true);
      }
    } catch { /* ignore */ }
  }, [status]);

  useEffect(() => {
    fetchAndFilter();
  }, [fetchAndFilter]);

  const handleDismiss = () => {
    if (announcements.length === 0) return;
    const current = announcements[currentIndex];
    addDismissedId(current.id);

    const remaining = announcements.filter((a) => a.id !== current.id);
    if (remaining.length > 0) {
      setAnnouncements(remaining);
      setCurrentIndex(Math.min(currentIndex, remaining.length - 1));
    } else {
      setIsOpen(false);
      setAnnouncements([]);
    }
  };

  const handleDismissAll = () => {
    for (const a of announcements) {
      addDismissedId(a.id);
    }
    setIsOpen(false);
    setAnnouncements([]);
  };

  const handleNext = () => {
    if (currentIndex < announcements.length - 1) setCurrentIndex(currentIndex + 1);
  };

  const handlePrev = () => {
    if (currentIndex > 0) setCurrentIndex(currentIndex - 1);
  };

  // Expose open function via window for Navbar bell
  useEffect(() => {
    (window as unknown as Record<string, unknown>).__openAnnouncementPopup = () => {
      fetchAndFilter();
    };
    return () => {
      delete (window as unknown as Record<string, unknown>).__openAnnouncementPopup;
    };
  }, [fetchAndFilter]);

  if (!isOpen || announcements.length === 0) return null;

  const current = announcements[currentIndex];
  const cfg = TYPE_CONFIG[current.type] || TYPE_CONFIG.GENERAL;
  const Icon = cfg.icon;

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/70 backdrop-blur-sm animate-fade-in"
        onClick={handleDismiss}
      />

      {/* Modal */}
      <div className="relative w-full max-w-lg animate-slide-up">
        {/* Top accent bar */}
        <div className={`h-1 rounded-t-2xl ${cfg.accentBorder.replace("border-t-", "bg-")} opacity-80`} />

        <div className="bg-[#111] border border-[#222] border-t-0 rounded-b-2xl shadow-2xl overflow-hidden">
          {/* Header */}
          <div className="flex items-center justify-between px-6 pt-5 pb-3">
            <div className="flex items-center gap-3">
              <div className={`w-10 h-10 rounded-xl ${cfg.accentBg} flex items-center justify-center`}>
                <Icon className="h-5 w-5 text-[#f5f5f5]" />
              </div>
              <div>
                <Badge variant={cfg.variant}>{cfg.label}</Badge>
                {current.tournament && (
                  <span className="text-xs text-[#dc2626] ml-2">{current.tournament.name}</span>
                )}
              </div>
            </div>
            <button
              onClick={handleDismiss}
              className="p-2 text-[#888] hover:text-[#f5f5f5] hover:bg-[#222] rounded-lg transition-colors"
            >
              <X className="h-5 w-5" />
            </button>
          </div>

          {/* Content */}
          <div className="px-6 pb-2">
            <h2 className="text-xl font-bold text-[#f5f5f5] mb-3">{current.title}</h2>
            <p className="text-[#888] text-sm leading-relaxed whitespace-pre-wrap max-h-60 overflow-y-auto">
              {current.content}
            </p>
            <p className="text-xs text-[#555] mt-3">
              {new Date(current.createdAt).toLocaleString("vi-VN")}
            </p>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-6 py-4 border-t border-[#222] bg-[#111]/50">
            <div className="flex items-center gap-2">
              {announcements.length > 1 && (
                <>
                  <button
                    onClick={handlePrev}
                    disabled={currentIndex === 0}
                    className="p-1.5 rounded-lg text-[#888] hover:text-[#f5f5f5] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronLeft className="h-4 w-4" />
                  </button>
                  <span className="text-xs text-[#888]">
                    {currentIndex + 1}/{announcements.length}
                  </span>
                  <button
                    onClick={handleNext}
                    disabled={currentIndex === announcements.length - 1}
                    className="p-1.5 rounded-lg text-[#888] hover:text-[#f5f5f5] hover:bg-[#222] disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                  >
                    <ChevronRight className="h-4 w-4" />
                  </button>
                </>
              )}
            </div>
            <div className="flex items-center gap-2">
              {announcements.length > 1 && (
                <button
                  onClick={handleDismissAll}
                  className="text-xs text-[#888] hover:text-[#f5f5f5] px-3 py-2 rounded-lg hover:bg-[#222] transition-colors"
                >
                  Đã hiểu tất cả
                </button>
              )}
              <button
                onClick={handleDismiss}
                className="text-sm font-medium bg-[#dc2626] hover:bg-[#b91c1c] text-[#f5f5f5] px-5 py-2 rounded-xl transition-colors"
              >
                Đã hiểu
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
