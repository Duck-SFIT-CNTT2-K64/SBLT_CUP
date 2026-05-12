"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PredictionGroupForm from "@/components/predictions/PredictionGroupForm";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Target, ArrowLeft, Loader2, Lock, AlertTriangle, Send, CheckCircle } from "lucide-react";

interface Player {
  id: string;
  ign: string;
  isGuest: boolean;
}

interface GroupData {
  id: string;
  name: string;
  players: Player[];
}

interface RankSlots {
  rank1PlayerId: string;
  rank2PlayerId: string;
  rank3PlayerId: string;
  rank4PlayerId: string;
}

export default function PredictionFormPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session, status: sessionStatus } = useSession();

  const tournamentId = params.id as string;
  const stageId = params.stageId as string;

  const [groups, setGroups] = useState<GroupData[]>([]);
  const [stageName, setStageName] = useState("");
  const [predictionStatus, setPredictionStatus] = useState("");
  const [lockedReason, setLockedReason] = useState<string | null>(null);
  const [windowOpensAt, setWindowOpensAt] = useState<string>("");
  const [existingPredictionId, setExistingPredictionId] = useState<string | null>(null);
  const [entries, setEntries] = useState<Map<string, RankSlots>>(new Map());
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [successMessage, setSuccessMessage] = useState("");

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.id) {
      router.push("/auth/login");
      return;
    }

    fetch(`/api/tournaments/${tournamentId}/predictions/${stageId}`)
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        const data = await r.json();
        if (!r.ok) {
          setError(data.error || `Lỗi server (${r.status})`);
          return;
        }
        setGroups((data.groups || []).map((g: { groupId: string; groupName: string; players: Player[] }) => ({
          id: g.groupId,
          name: g.groupName,
          players: g.players,
        })));
        setStageName(data.stageName || "");
        setPredictionStatus(data.predictionStatus || "");
        setLockedReason(data.lockedReason || null);
        setWindowOpensAt(data.windowOpensAt || "");

        if (data.existingPrediction) {
          setExistingPredictionId(data.existingPrediction.id);
          const entryMap = new Map<string, RankSlots>();
          for (const e of data.existingPrediction.entries) {
            entryMap.set(e.groupId, {
              rank1PlayerId: e.rank1PlayerId,
              rank2PlayerId: e.rank2PlayerId,
              rank3PlayerId: e.rank3PlayerId,
              rank4PlayerId: e.rank4PlayerId,
            });
          }
          setEntries(entryMap);
        }
      })
      .catch(() => setError("Lỗi kết nối. Vui lòng thử lại."))
      .finally(() => setLoading(false));
  }, [tournamentId, stageId, session, sessionStatus, router]);

  const handleGroupChange = useCallback((groupId: string, rankSlots: RankSlots) => {
    setEntries((prev) => {
      const next = new Map(prev);
      next.set(groupId, rankSlots);
      return next;
    });
  }, []);

  const isLocked = predictionStatus === "LOCKED" || predictionStatus === "SCORED";
  const completedCount = Array.from(entries.values()).filter(
    (e) => e.rank1PlayerId && e.rank2PlayerId && e.rank3PlayerId && e.rank4PlayerId
  ).length;
  const allComplete = groups.length > 0 && completedCount === groups.length;

  const handleSubmit = async () => {
    if (!allComplete || isLocked) return;

    setSubmitting(true);
    setError("");
    setSuccessMessage("");

    const isUpdating = Boolean(existingPredictionId);

    const entriesArray = groups.map((g) => ({
      groupId: g.id,
      ...entries.get(g.id)!,
    }));

    try {
      const res = await fetch(`/api/tournaments/${tournamentId}/predictions/${stageId}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ entries: entriesArray }),
      });
      if (res.status === 401) {
        window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
        return;
      }

      const data = await res.json();

      if (!res.ok) {
        setError(data.error || "Lỗi gửi dự đoán");
        return;
      }

      setSuccessMessage(isUpdating ? "Cập nhật dự đoán thành công!" : "Gửi dự đoán thành công!");
      setExistingPredictionId(data.predictionId);
      window.scrollTo({ top: 0, behavior: "smooth" });
    } catch {
      setError("Lỗi kết nối server");
    } finally {
      setSubmitting(false);
    }
  };

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
      </div>
    );
  }

  const getLockedMessage = () => {
    if (predictionStatus === "SCORED") return "Vòng đấu đã kết thúc. Dự đoán đã được chấm điểm.";
    if (lockedReason === "window_not_open") return `Cửa sổ dự đoán sẽ mở lúc 9h sáng ngày ${new Date(windowOpensAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`;
    if (lockedReason === "window_closed") return "Cửa sổ dự đoán đã đóng. Hạn cuối dự đoán là 19h30.";
    return "Vòng đấu đã bắt đầu. Không thể chỉnh sửa dự đoán.";
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl pb-28">
      {/* Back link */}
      <Link
        href={`/tournaments/${tournamentId}/predictions`}
        className="inline-flex items-center gap-1.5 text-sm text-[#888] hover:text-[#f5f5f5] transition-colors mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      {/* Header */}
      <div className="relative mb-8">
        <div className="hero-orb absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-2">
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-[#dc2626]/10 text-[#dc2626] shadow-[0_0_20px_rgba(220,38,38,0.2)]">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <p className="text-[11px] uppercase tracking-[0.25em] text-[#dc2626] font-semibold">Dự đoán</p>
              <h1 className="sblt-heading text-2xl text-[#f5f5f5] tracking-tight">{stageName}</h1>
            </div>
          </div>
          <div className="sblt-divider mt-4" />
        </div>
      </div>

      {/* Locked warning */}
      {isLocked && (
        <div className="mb-6 rounded-xl border border-amber-500/20 bg-amber-500/5 p-4 flex items-start gap-3">
          <AlertTriangle className="h-5 w-5 text-amber-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-amber-400">Dự đoán đã bị khóa</p>
            <p className="text-sm text-[#b7b7b7] mt-0.5">{getLockedMessage()}</p>
          </div>
        </div>
      )}

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {successMessage && (
        <div className="mb-6 rounded-xl border border-green-500/20 bg-green-500/5 p-4 flex items-start gap-3">
          <CheckCircle className="h-5 w-5 text-green-400 shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-semibold text-green-400">{successMessage}</p>
          </div>
        </div>
      )}

      {/* Group forms */}
      <div className="space-y-5">
        {groups.map((group) => (
          <PredictionGroupForm
            key={group.id}
            group={group}
            existingEntries={entries.get(group.id) || null}
            locked={isLocked}
            onChange={handleGroupChange}
          />
        ))}
      </div>

      {/* Leaderboard link if scored */}
      {predictionStatus === "SCORED" && (
        <div className="mt-8 text-center">
          <Link href={`/tournaments/${tournamentId}/predictions/${stageId}/leaderboard`}>
            <Button variant="outline" size="lg">Xem bảng xếp hạng dự đoán</Button>
          </Link>
        </div>
      )}

      {/* Sticky submit bar */}
      {!isLocked && (
        <div className="fixed bottom-0 left-0 right-0 z-50 border-t border-[#222] bg-[#0a0a0a]/90 backdrop-blur-md">
          <div className="container mx-auto max-w-4xl px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-4">
              {/* Progress dots */}
              <div className="hidden sm:flex items-center gap-1.5">
                {groups.map((g) => {
                  const e = entries.get(g.id);
                  const done = e && e.rank1PlayerId && e.rank2PlayerId && e.rank3PlayerId && e.rank4PlayerId;
                  return (
                    <div
                      key={g.id}
                      className={`h-2 w-2 rounded-full transition-colors ${done ? "bg-green-400" : "bg-[#333]"}`}
                      title={g.name}
                    />
                  );
                })}
              </div>
              <p className="text-sm text-[#888]">
                {allComplete ? (
                  <span className="text-green-400 font-medium">Sẵn sàng gửi!</span>
                ) : (
                  <span>Đã dự đoán <span className="text-[#f5f5f5] font-medium">{completedCount}/{groups.length}</span> bảng</span>
                )}
              </p>
            </div>
            <Button
              onClick={handleSubmit}
              disabled={!allComplete || submitting}
              className="min-w-[160px] gap-2"
            >
              {submitting ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  {existingPredictionId ? "Cập nhật dự đoán" : "Gửi dự đoán"}
                </>
              )}
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}
