"use client";

import { useEffect, useState, useMemo } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Target, Trophy, Loader2, CheckCircle, Clock, Lock } from "lucide-react";

interface PredictionItem {
  stageId: string;
  stageName: string;
  stageType: string;
  tournamentId: string;
  tournamentName: string;
  status: string;
  totalScore: number;
}

export default function DashboardPredictionsPage() {
  const { data: session, status: sessionStatus } = useSession();
  const [predictions, setPredictions] = useState<PredictionItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.id) return;

    const controller = new AbortController();

    // Fetch all tournaments to get user's predictions
    fetch("/api/tournaments?limit=20", { signal: controller.signal })
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        const data = await r.json();
        const tournaments = data.tournaments || [];
        const allPredictions: PredictionItem[] = [];

        // Fetch predictions in parallel instead of sequentially
        const predResults = await Promise.allSettled(
          tournaments.map((t: { id: string }) =>
            fetch(`/api/tournaments/${t.id}/predictions`, { signal: controller.signal })
              .then((r) => ({ ok: r.ok, status: r.status, data: r.ok ? r.json() : null, tournamentId: t.id }))
          )
        );

        for (let i = 0; i < predResults.length; i++) {
          const result = predResults[i];
          if (result.status === "rejected") continue;
          const { ok, status, data: dataPromise, tournamentId } = result.value;
          if (status === 401) {
            window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
            return;
          }
          if (!ok || !dataPromise) continue;
          try {
            const predData = await dataPromise;
            const t = tournaments[i];
            if (predData.stages) {
              for (const s of predData.stages) {
                if (s.hasSubmitted) {
                  allPredictions.push({
                    stageId: s.stageId,
                    stageName: s.stageName,
                    stageType: s.stageType,
                    tournamentId: tournamentId,
                    tournamentName: t.name,
                    status: s.predictionStatus,
                    totalScore: s.userScore || 0,
                  });
                }
              }
            }
          } catch {
            // Skip failed tournament
          }
        }

        setPredictions(allPredictions);
      })
      .catch((e) => {
        if (e instanceof DOMException && e.name === "AbortError") return;
        console.error("Failed to fetch tournaments:", e);
        setError("Không thể tải dữ liệu. Vui lòng thử lại.");
      })
      .finally(() => setLoading(false));

    return () => controller.abort();
  }, [session?.user?.id, sessionStatus]);

  if (sessionStatus === "loading" || (loading && session?.user?.id)) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <Target className="h-16 w-16 text-[#dc2626] mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-[#f5f5f5] mb-4">Dự đoán của bạn</h1>
        <p className="text-[#888] mb-6">Đăng nhập để xem lịch sử dự đoán.</p>
        <Link href="/auth/login">
          <Button>Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  const { totalPoints, scoredCount } = useMemo(() => ({
    totalPoints: predictions.reduce((sum, p) => sum + p.totalScore, 0),
    scoredCount: predictions.filter((p) => p.status === "SCORED").length,
  }), [predictions]);

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-[#f5f5f5] flex items-center gap-3 mb-2">
          <Target className="h-7 w-7 text-[#dc2626]" />
          Dự đoán của bạn
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card hover={false}>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 text-[#dc2626] mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#f5f5f5]">{totalPoints}</p>
            <p className="text-sm text-[#888]">Tổng điểm dự đoán</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#f5f5f5]">{predictions.length}</p>
            <p className="text-sm text-[#888]">Vòng đã dự đoán</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-[#f5f5f5]">{scoredCount}</p>
            <p className="text-sm text-[#888]">Vòng đã chấm điểm</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictions list */}
      {error ? (
        <div className="text-center py-12 text-red-400">
          {error}
        </div>
      ) : predictions.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          Bạn chưa dự đoán vòng nào.
        </div>
      ) : (
        <div className="space-y-3">
          {predictions.map((pred) => {
            const statusIcon =
              pred.status === "SCORED" ? <CheckCircle className="h-4 w-4 text-green-400" /> :
              pred.status === "LOCKED" ? <Lock className="h-4 w-4 text-yellow-400" /> :
              <Clock className="h-4 w-4 text-blue-400" />;

            const statusLabel =
              pred.status === "SCORED" ? "Đã chấm" :
              pred.status === "LOCKED" ? "Đã khóa" : "Đang mở";

            return (
              <Card key={`${pred.tournamentId}-${pred.stageId}`} hover={false}>
                <CardContent className="py-4">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-[#f5f5f5] font-medium">{pred.stageName}</p>
                      <p className="text-xs text-[#888]">{pred.tournamentName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pred.status === "SCORED" && (
                        <span className="text-lg font-bold text-[#dc2626]">{pred.totalScore}đ</span>
                      )}
                      <Badge variant={pred.status === "SCORED" ? "blue" : pred.status === "LOCKED" ? "yellow" : "green"}>
                        {statusIcon}
                        <span className="ml-1">{statusLabel}</span>
                      </Badge>
                    </div>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
}
