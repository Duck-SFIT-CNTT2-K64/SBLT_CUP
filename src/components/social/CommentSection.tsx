"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { MessageCircle, Send, Trash2, Reply, ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/Button";

interface Comment {
  id: string;
  content: string;
  createdAt: string;
  user: {
    id: string;
    name: string;
    avatar: string | null;
    role: string;
  };
  replies: Comment[];
  _count: { replies: number };
}

interface CommentSectionProps {
  type: string;
  entityId: string;
}

export function CommentSection({ type, entityId }: CommentSectionProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyContent, setReplyContent] = useState("");
  const [showReplies, setShowReplies] = useState<Record<string, boolean>>({});
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/comments/${type}/${entityId}?page=${page}&limit=10`);
        if (res.ok && !cancelled) {
          const data = await res.json();
          setComments((prev) => (page === 1 ? data.data : [...prev, ...data.data]));
          setHasMore(data.pagination.page < data.pagination.totalPages);
        }
      } catch (error) {
        console.error("Failed to fetch comments:", error);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [type, entityId, page]);

  const handleSubmit = async () => {
    if (!newComment.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${type}/${entityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newComment }),
      });

      if (res.ok) {
        const comment = await res.json();
        setComments((prev) => [comment, ...prev]);
        setNewComment("");
      }
    } catch (error) {
      console.error("Failed to post comment:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleReply = async (parentId: string) => {
    if (!replyContent.trim() || submitting) return;

    setSubmitting(true);
    try {
      const res = await fetch(`/api/comments/${type}/${entityId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: replyContent, parentId }),
      });

      if (res.ok) {
        const reply = await res.json();
        setComments((prev) =>
          prev.map((c) =>
            c.id === parentId
              ? { ...c, replies: [...c.replies, reply], _count: { replies: c._count.replies + 1 } }
              : c
          )
        );
        setReplyContent("");
        setReplyTo(null);
        setShowReplies((prev) => ({ ...prev, [parentId]: true }));
      }
    } catch (error) {
      console.error("Failed to post reply:", error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleDelete = async (commentId: string) => {
    if (!confirm("Bạn có chắc muốn xóa bình luận này?")) return;

    try {
      const res = await fetch(`/api/comments/${type}/${entityId}?commentId=${commentId}`, {
        method: "DELETE",
      });

      if (res.ok) {
        setComments((prev) => prev.filter((c) => c.id !== commentId));
      }
    } catch (error) {
      console.error("Failed to delete comment:", error);
    }
  };

  const formatDate = (dateString: string) => {
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
    <div className="space-y-4">
      <h3 className="font-semibold text-[#f5f5f5] flex items-center gap-2">
        <MessageCircle className="h-5 w-5 text-[#dc2626]" />
        Bình luận
      </h3>

      {/* Comment input */}
      {session && (
        <div className="flex gap-3">
          <div className="flex-1">
            <textarea
              value={newComment}
              onChange={(e) => setNewComment(e.target.value)}
              placeholder="Viết bình luận..."
              className="w-full px-4 py-3 bg-[#111] border border-[#222] rounded-lg text-[#f5f5f5] placeholder-[#555] focus:border-[#dc2626] focus:outline-none resize-none"
              rows={2}
              maxLength={1000}
            />
            <div className="flex items-center justify-between mt-2">
              <span className="text-xs text-[#555]">{newComment.length}/1000</span>
              <Button
                size="sm"
                onClick={handleSubmit}
                disabled={!newComment.trim() || submitting}
              >
                <Send className="h-4 w-4 mr-1" />
                Gửi
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* Comments list */}
      {loading && page === 1 ? (
        <div className="text-center py-8">
          <div className="inline-block w-6 h-6 border-2 border-[#dc2626]/30 border-t-[#dc2626] rounded-full animate-spin" />
        </div>
      ) : comments.length === 0 ? (
        <div className="text-center py-8 text-[#555]">
          <MessageCircle className="h-12 w-12 mx-auto mb-3 opacity-50" />
          <p>Chưa có bình luận nào</p>
        </div>
      ) : (
        <div className="space-y-4">
          {comments.map((comment) => (
            <div key={comment.id} className="bg-[#111] rounded-lg p-4 border border-[#222]">
              <div className="flex items-start gap-3">
                <div className="w-8 h-8 rounded-full bg-[#222] flex items-center justify-center text-sm font-bold text-[#888]">
                  {comment.user.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <span className="font-medium text-[#f5f5f5] text-sm">
                      {comment.user.name}
                    </span>
                    {comment.user.role === "ADMIN" && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-[#dc2626]/20 text-[#dc2626] rounded font-medium">
                        Admin
                      </span>
                    )}
                    <span className="text-xs text-[#555]">{formatDate(comment.createdAt)}</span>
                  </div>
                  <p className="text-sm text-[#ccc] mt-1 whitespace-pre-wrap">{comment.content}</p>

                  <div className="flex items-center gap-4 mt-2">
                    {session && (
                      <button
                        onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                        className="text-xs text-[#888] hover:text-[#dc2626] transition-colors flex items-center gap-1"
                      >
                        <Reply className="h-3 w-3" />
                        Trả lời
                      </button>
                    )}
                    {(session?.user?.id === comment.user.id || session?.user?.role === "ADMIN") && (
                      <button
                        onClick={() => handleDelete(comment.id)}
                        className="text-xs text-[#888] hover:text-red-400 transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="h-3 w-3" />
                        Xóa
                      </button>
                    )}
                    {comment._count.replies > 0 && (
                      <button
                        onClick={() =>
                          setShowReplies((prev) => ({
                            ...prev,
                            [comment.id]: !prev[comment.id],
                          }))
                        }
                        className="text-xs text-[#888] hover:text-[#dc2626] transition-colors flex items-center gap-1"
                      >
                        {showReplies[comment.id] ? (
                          <ChevronUp className="h-3 w-3" />
                        ) : (
                          <ChevronDown className="h-3 w-3" />
                        )}
                        {comment._count.replies} trả lời
                      </button>
                    )}
                  </div>

                  {/* Reply input */}
                  {replyTo === comment.id && (
                    <div className="mt-3 flex gap-2">
                      <input
                        value={replyContent}
                        onChange={(e) => setReplyContent(e.target.value)}
                        placeholder="Viết trả lời..."
                        className="flex-1 px-3 py-2 bg-[#0a0a0a] border border-[#222] rounded text-sm text-[#f5f5f5] placeholder-[#555] focus:border-[#dc2626] focus:outline-none"
                        maxLength={1000}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" && !e.shiftKey) {
                            e.preventDefault();
                            handleReply(comment.id);
                          }
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleReply(comment.id)}
                        disabled={!replyContent.trim() || submitting}
                      >
                        Gửi
                      </Button>
                    </div>
                  )}

                  {/* Replies */}
                  {showReplies[comment.id] && comment.replies.length > 0 && (
                    <div className="mt-3 space-y-3 pl-4 border-l-2 border-[#222]">
                      {comment.replies.map((reply) => (
                        <div key={reply.id} className="flex items-start gap-2">
                          <div className="w-6 h-6 rounded-full bg-[#222] flex items-center justify-center text-[10px] font-bold text-[#888]">
                            {reply.user.name.charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-[#f5f5f5] text-xs">
                                {reply.user.name}
                              </span>
                              <span className="text-[10px] text-[#555]">
                                {formatDate(reply.createdAt)}
                              </span>
                            </div>
                            <p className="text-xs text-[#ccc] mt-0.5">{reply.content}</p>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            </div>
          ))}

          {hasMore && (
            <button
              onClick={() => setPage((p) => p + 1)}
              className="w-full py-3 text-sm text-[#888] hover:text-[#dc2626] transition-colors"
            >
              Tải thêm bình luận
            </button>
          )}
        </div>
      )}
    </div>
  );
}
