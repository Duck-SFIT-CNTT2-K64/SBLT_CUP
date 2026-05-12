"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import PredictionGroupForm from "@/components/predictions/PredictionGroupForm";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Target, ArrowLeft, Loader2, Lock } from "lucide-react";

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
  const allComplete = groups.length > 0 && groups.every((g) => {
    const e = entries.get(g.id);
    return e && e.rank1PlayerId && e.rank2PlayerId && e.rank3PlayerId && e.rank4PlayerId;
  });

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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Back link */}
      <Link
        href={`/tournaments/${tournamentId}/predictions`}
        className="inline-flex items-center gap-1 text-sm text-[#888] hover:text-[#f5f5f5] mb-6"
      >
        <ArrowLeft className="h-4 w-4" />
        Quay lại
      </Link>

      {/* Header */}
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-3">
          <Target className="h-7 w-7 text-[#dc2626]" />
          Dự đoán {stageName}
        </h1>
        {isLocked && (
          <div className="mt-2 flex items-center gap-2 text-yellow-400 text-sm">
            <Lock className="h-4 w-4" />
            {predictionStatus === "SCORED"
              ? "Vòng đấu đã kết thúc. Dự đoán đã được chấm điểm."
              : lockedReason === "window_not_open"
                ? `Cửa sổ dự đoán sẽ mở lúc 9h sáng ngày ${new Date(windowOpensAt).toLocaleDateString("vi-VN", { timeZone: "Asia/Ho_Chi_Minh" })}.`
                : lockedReason === "window_closed"
                  ? "Cửa sổ dự đoán đã đóng. Hạn cuối dự đoán là 19h30."
                  : "Vòng đấu đã bắt đầu. Không thể chỉnh sửa dự đoán."}
          </div>
        )}
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {successMessage && (
        <Alert
          variant="success"
          message={successMessage}
          className="mb-4"
          autoDismiss={5000}
          onDismiss={() => setSuccessMessage("")}
        />
      )}

      {/* Group forms */}
      <div className="space-y-6">
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

      {/* Submit */}
      {!isLocked && (
        <div className="mt-8 flex items-center justify-between">
          <p className="text-sm text-[#888]">
            {allComplete
              ? "Tất cả bảng đã dự đoán xong. Nhấn gửi để lưu."
              : `Đã dự đoán ${Array.from(entries.values()).filter((e) => e.rank1PlayerId && e.rank2PlayerId && e.rank3PlayerId && e.rank4PlayerId).length}/${groups.length} bảng`}
          </p>
          <Button
            onClick={handleSubmit}
            disabled={!allComplete || submitting}
            className="min-w-[140px]"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : existingPredictionId ? (
              "Cập nhật dự đoán"
            ) : (
              "Gửi dự đoán"
            )}
          </Button>
        </div>
      )}

      {/* View leaderboard link if scored */}
      {predictionStatus === "SCORED" && (
        <div className="mt-8 text-center">
          <Link href={`/tournaments/${tournamentId}/predictions/${stageId}/leaderboard`}>
            <Button variant="outline">Xem bảng xếp hạng dự đoán</Button>
          </Link>
        </div>
      )}
    </div>
  );
}
