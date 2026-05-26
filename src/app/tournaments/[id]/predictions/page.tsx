"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Target, Clock, Lock, CheckCircle, Loader2, ArrowRight, Trophy } from "lucide-react";
import PredictionRulesAndRewardsPanel from "@/components/predictions/PredictionRulesAndRewards";

interface StageData {
  stageId: string;
  stageName: string;
  stageType: string;
  stageStatus: string;
  predictionStatus: string;
  lockedReason: string | null;
  windowOpensAt: string;
  windowClosesAt: string;
  hasSubmitted: boolean;
  userScore: number | null;
  groups: {
    groupId: string;
    groupName: string;
    players: { id: string; ign: string; isGuest: boolean }[];
  }[];
}

const STATUS_CONFIG: Record<string, { label: string; dot: string; bg: string; text: string }> = {
  OPEN: { label: "Đang mở", dot: "bg-green-400", bg: "bg-green-500/10", text: "text-green-400" },
  LOCKED: { label: "Đã khóa", dot: "bg-yellow-400", bg: "bg-yellow-500/10", text: "text-yellow-400" },
  SCORED: { label: "Đã chấm", dot: "bg-blue-400", bg: "bg-blue-500/10", text: "text-blue-400" },
  NOT_READY: { label: "Chưa sẵn sàng", dot: "bg-[#555]", bg: "bg-[#222]", text: "text-[#888]" },
};

function formatVietnamTime(isoString: string): string {
  return new Date(isoString).toLocaleTimeString("vi-VN", {
    hour: "2-digit",
    minute: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

function formatVietnamDate(isoString: string): string {
  return new Date(isoString).toLocaleDateString("vi-VN", {
    day: "2-digit",
    month: "2-digit",
    timeZone: "Asia/Ho_Chi_Minh",
  });
}

export default function PredictionsPage() {
  const params = useParams();
  const { data: session, status: sessionStatus } = useSession();
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tournamentId = params.id as string;

  useEffect(() => {
    if (!session?.user?.id) return;

    let cancelled = false;
    fetch(`/api/tournaments/${tournamentId}/predictions`)
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
        setStages(data.stages || []);
      })
      .catch(() => setError("Lỗi kết nối. Vui lòng thử lại."))
      .finally(() => { if (!cancelled) setLoading(false); });
    return () => { cancelled = true; };
  }, [tournamentId, session?.user?.id]);

  if (sessionStatus === "loading") {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-6xl">
        {/* Hero header for guests */}
        <div className="relative text-center mb-10">
          <div className="hero-orb absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
          <div className="relative">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-[#dc2626]/10 text-[#dc2626] shadow-[0_0_30px_rgba(220,38,38,0.2)] mb-5">
              <Target className="h-8 w-8" />
            </div>
            <h1 className="sblt-heading text-4xl text-[#f5f5f5] tracking-tight mb-3">Dự đoán kết quả</h1>
            <p className="text-[#888] max-w-lg mx-auto text-sm leading-relaxed">
              Đăng nhập để dự đoán 4 người đi tiếp mỗi bảng đấu và xem cơ cấu phần thưởng từ BTC.
            </p>
            <div className="sblt-divider mx-auto mt-5 w-16" />
            <div className="mt-6">
              <Link href="/auth/login">
                <Button size="lg">Đăng nhập để dự đoán</Button>
              </Link>
            </div>
          </div>
        </div>

        <PredictionRulesAndRewardsPanel variant={stages.some(s => s.stageType === "WARMUP") ? "warmup" : "default"} />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Hero header */}
      <div className="relative mb-10">
        <div className="hero-orb absolute top-0 left-1/2 -translate-x-1/2 -translate-y-1/2" />
        <div className="relative">
          <div className="flex items-center gap-4 mb-3">
            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-[#dc2626]/10 text-[#dc2626] shadow-[0_0_24px_rgba(220,38,38,0.2)]">
              <Target className="h-6 w-6" />
            </div>
            <div>
              <h1 className="sblt-heading text-3xl text-[#f5f5f5] tracking-tight">Dự đoán kết quả</h1>
              <p className="text-sm text-[#888] mt-0.5">
                Dự đoán 4 người đi tiếp của mỗi bảng đấu. Đúng mỗi người thuộc top 4 = <span className="text-[#f5f5f5] font-medium">10đ</span>. <span className="text-[#dc2626] font-medium">Chung kết x2!</span>
              </p>
            </div>
          </div>
          <div className="sblt-divider mt-4" />
        </div>
      </div>

      <PredictionRulesAndRewardsPanel variant={stages.some(s => s.stageType === "WARMUP") ? "warmup" : "default"} />

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {/* Section title */}
      <div className="flex items-center gap-3 mb-5">
        <Trophy className="h-5 w-5 text-[#dc2626]" />
        <h2 className="sblt-heading text-lg text-[#f5f5f5] tracking-wider">Vòng đấu</h2>
      </div>

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-16 text-[#888] rounded-2xl border border-[#222] bg-[#111]">
          <Target className="h-10 w-10 text-[#333] mx-auto mb-3" />
          <p>Chưa có vòng đấu nào hỗ trợ dự đoán.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {stages.map((stage) => {
            const status = STATUS_CONFIG[stage.predictionStatus] || STATUS_CONFIG.NOT_READY;
            const totalPlayers = stage.groups.reduce((sum, g) => sum + g.players.length, 0);

            return (
              <div
                key={stage.stageId}
                className={`group relative overflow-hidden rounded-2xl border bg-[#111] transition-all ${
                  stage.predictionStatus === "OPEN"
                    ? "border-[#333] hover:border-[#dc2626]/40 hover:shadow-[0_0_24px_rgba(220,38,38,0.1)]"
                    : "border-[#222]"
                }`}
              >
                <div className="p-5">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="sblt-heading text-xl text-[#f5f5f5] tracking-wider">{stage.stageName}</h3>
                        <span className={`inline-flex items-center gap-1.5 rounded-md ${status.bg} ${status.text} border ${status.bg} px-2 py-0.5 text-[11px] font-semibold`}>
                          <span className={`h-1.5 w-1.5 rounded-full ${status.dot}`} />
                          {status.label}
                        </span>
                      </div>
                      <div className="flex items-center gap-3 text-sm text-[#888]">
                        <span>{stage.groups.length} bảng đấu</span>
                        <span className="text-[#333]">&middot;</span>
                        <span>{totalPlayers} tuyển thủ</span>
                        {stage.hasSubmitted && (
                          <>
                            <span className="text-[#333]">&middot;</span>
                            <span className="inline-flex items-center gap-1 text-green-400">
                              <CheckCircle className="h-3.5 w-3.5" />
                              Đã dự đoán
                            </span>
                          </>
                        )}
                        {stage.hasSubmitted && stage.userScore !== null && (
                          <>
                            <span className="text-[#333]">&middot;</span>
                            <span className="text-[#dc2626] font-bold" style={{ fontFamily: "var(--font-heading)" }}>
                              {stage.userScore}đ
                            </span>
                          </>
                        )}
                      </div>
                    </div>

                    <div className="flex-shrink-0">
                      {stage.predictionStatus === "OPEN" && (
                        <Link href={`/tournaments/${tournamentId}/predictions/${stage.stageId}`}>
                          <Button size="sm" className="gap-1.5">
                            {stage.hasSubmitted ? "Chỉnh sửa" : "Dự đoán ngay"}
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}

                      {stage.predictionStatus === "SCORED" && (
                        <Link href={`/tournaments/${tournamentId}/predictions/${stage.stageId}/leaderboard`}>
                          <Button size="sm" variant="outline" className="gap-1.5">
                            Bảng xếp hạng
                            <ArrowRight className="h-3.5 w-3.5" />
                          </Button>
                        </Link>
                      )}

                      {stage.predictionStatus === "LOCKED" && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#888] bg-[#222] px-3 py-1.5 rounded-lg">
                          <Lock className="h-3.5 w-3.5" />
                          {stage.lockedReason === "window_not_open"
                            ? `Mở lúc ${formatVietnamTime(stage.windowOpensAt)} ${formatVietnamDate(stage.windowOpensAt)}`
                            : stage.lockedReason === "window_closed"
                              ? "Cửa sổ dự đoán đã đóng"
                              : "Đã khóa"}
                        </span>
                      )}

                      {stage.predictionStatus === "NOT_READY" && (
                        <span className="inline-flex items-center gap-1.5 text-sm text-[#888] bg-[#222] px-3 py-1.5 rounded-lg">
                          <Clock className="h-3.5 w-3.5" /> Chờ bốc thăm
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
