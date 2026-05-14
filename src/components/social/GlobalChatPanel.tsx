"use client";

import { useState, useEffect, useRef, useCallback } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, X, LogIn } from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Avatar } from "@/components/ui/Avatar";
import { useSSE } from "@/lib/hooks/useSSE";
import Link from "next/link";

interface ChatMessage {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
}

export function GlobalChatPanel() {
  const { data: session } = useSession();
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [loading, setLoading] = useState(true);
  const [input, setInput] = useState("");
  const [isSending, setIsSending] = useState(false);
  const [cooldown, setCooldown] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const panelRef = useRef<HTMLDivElement>(null);

  // SSE connection for real-time updates
  const handleSSEEvent = useCallback((event: string, data: unknown) => {
    if (event === "GLOBAL_CHAT") {
      const message = data as ChatMessage;
      setMessages((prev) => {
        // Avoid duplicates
        if (prev.some((m) => m.id === message.id)) return prev;
        return [...prev, message];
      });
    }
  }, []);

  useSSE({ onEvent: handleSSEEvent });

  // Fetch initial messages
  useEffect(() => {
    if (!isOpen) return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch("/api/chat");
        if (res.ok && !cancelled) {
          const data = await res.json();
          setMessages(data);
        }
      } catch (err) {
        console.error("Failed to fetch chat messages:", err);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [isOpen]);

  // Auto-scroll to bottom on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Close panel on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") setIsOpen(false);
    };
    if (isOpen) {
      document.addEventListener("keydown", handleKeyDown);
      return () => document.removeEventListener("keydown", handleKeyDown);
    }
  }, [isOpen]);

  const handleSend = async () => {
    if (!input.trim() || isSending || cooldown) return;

    setIsSending(true);
    setError(null);

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: input }),
      });

      if (res.ok) {
        const message = await res.json();
        setMessages((prev) => {
          if (prev.some((m) => m.id === message.id)) return prev;
          return [...prev, message];
        });
        setInput("");

        // Cooldown: disable send for 2 seconds
        setCooldown(true);
        setTimeout(() => setCooldown(false), 2000);
      } else {
        const data = await res.json();
        setError(data.error || "Gửi thất bại");
      }
    } catch {
      setError("Lỗi kết nối");
    } finally {
      setIsSending(false);
    }
  };

  const formatTime = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diff = now.getTime() - date.getTime();
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);

    if (minutes < 1) return "Vừa xong";
    if (minutes < 60) return `${minutes}p`;
    if (hours < 24) return `${hours}h`;
    return date.toLocaleDateString("vi-VN", { day: "2-digit", month: "2-digit" });
  };

  return (
    <>
      {/* Toggle Button */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="fixed bottom-6 right-6 z-[90] w-14 h-14 bg-[#dc2626] hover:bg-[#b91c1c] rounded-full shadow-lg shadow-[#dc2626]/30 flex items-center justify-center transition-all duration-300 hover:scale-110 cursor-pointer"
        aria-label="Mở thảo luận"
      >
        {isOpen ? (
          <X className="h-6 w-6 text-white" />
        ) : (
          <MessageCircle className="h-6 w-6 text-white" />
        )}
        {!isOpen && (
          <span className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full animate-pulse" />
        )}
      </button>

      {/* Chat Panel */}
      {isOpen && (
        <div
          ref={panelRef}
          className="fixed bottom-24 right-6 z-[90] w-[360px] h-[500px] bg-[#111] border border-[#222] rounded-xl shadow-2xl flex flex-col overflow-hidden animate-slide-up"
        >
          {/* Header */}
          <div className="flex items-center justify-between px-4 py-3 border-b border-[#222] bg-[#0a0a0a]">
            <div className="flex items-center gap-2">
              <span className="live-dot w-2 h-2 bg-[#dc2626] rounded-full animate-pulse" />
              <h3 className="font-semibold text-[#f5f5f5] text-sm font-heading uppercase tracking-wider">
                Thảo luận
              </h3>
              <span className="text-xs text-[#555]">{messages.length}</span>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              className="text-[#555] hover:text-[#f5f5f5] transition-colors cursor-pointer"
            >
              <X className="h-4 w-4" />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-4 py-3 space-y-3 scrollbar-thin">
            {loading ? (
              <div className="flex items-center justify-center h-full">
                <div className="w-6 h-6 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" />
              </div>
            ) : messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full text-[#555]">
                <MessageCircle className="h-10 w-10 mb-2 opacity-50" />
                <p className="text-sm">Chưa có tin nhắn nào</p>
                <p className="text-xs mt-1">Hãy là người đầu tiên!</p>
              </div>
            ) : (
              messages.map((msg) => (
                <div key={msg.id} className="flex items-start gap-2.5">
                  <Avatar
                    name={msg.user.name}
                    src={msg.user.avatar ?? undefined}
                    size="sm"
                    variant={msg.user.role === "ADMIN" ? "host" : "default"}
                  />
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span className="font-medium text-[#f5f5f5] text-xs truncate">
                        {msg.user.name}
                      </span>
                      {msg.user.role === "ADMIN" && (
                        <span className="px-1 py-0.5 text-[9px] bg-[#dc2626]/20 text-[#dc2626] rounded font-medium shrink-0">
                          Admin
                        </span>
                      )}
                      <span className="text-[10px] text-[#555] shrink-0">
                        {formatTime(msg.createdAt)}
                      </span>
                    </div>
                    <p className="text-sm text-[#ccc] mt-0.5 break-words">{msg.content}</p>
                  </div>
                </div>
              ))
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <div className="border-t border-[#222] p-3 bg-[#0a0a0a]">
            {session ? (
              <>
                {error && (
                  <p className="text-xs text-red-400 mb-2">{error}</p>
                )}
                <div className="flex items-center gap-2">
                  <input
                    value={input}
                    onChange={(e) => setInput(e.target.value)}
                    placeholder="Nhập tin nhắn..."
                    className="flex-1 px-3 py-2 bg-[#111] border border-[#222] rounded-lg text-sm text-[#f5f5f5] placeholder-[#555] focus:border-[#dc2626] focus:outline-none"
                    maxLength={200}
                    onKeyDown={(e) => {
                      if (e.key === "Enter" && !e.shiftKey) {
                        e.preventDefault();
                        handleSend();
                      }
                    }}
                    disabled={isSending}
                  />
                  <button
                    onClick={handleSend}
                    disabled={!input.trim() || isSending || cooldown}
                    className="w-9 h-9 flex items-center justify-center bg-[#dc2626] hover:bg-[#b91c1c] rounded-lg transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer shrink-0"
                  >
                    <Send className="h-4 w-4 text-white" />
                  </button>
                </div>
                <div className="flex items-center justify-between mt-1.5">
                  <span className="text-[10px] text-[#555]">
                    {input.length}/200
                  </span>
                  {cooldown && (
                    <span className="text-[10px] text-[#dc2626]">Đợi 2s...</span>
                  )}
                </div>
              </>
            ) : (
              <div className="flex flex-col items-center gap-2 py-2">
                <p className="text-xs text-[#888]">Đăng nhập để tham gia thảo luận</p>
                <Link href="/auth/login">
                  <Button size="sm" variant="primary">
                    <LogIn className="h-4 w-4 mr-1" />
                    Đăng nhập
                  </Button>
                </Link>
              </div>
            )}
          </div>
        </div>
      )}
    </>
  );
}
