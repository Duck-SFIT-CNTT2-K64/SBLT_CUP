"use client";

import { useEffect, useState } from "react";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
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

  useEffect(() => {
    if (sessionStatus === "loading") return;
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

    // Fetch all tournaments to get user's predictions
    fetch("/api/tournaments?limit=100")
      .then(async (r) => {
        if (r.status === 401) {
          window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
          return;
        }
        const data = await r.json();
        const tournaments = data.tournaments || [];
        const allPredictions: PredictionItem[] = [];

        for (const t of tournaments) {
          try {
            const predRes = await fetch(`/api/tournaments/${t.id}/predictions`);
            if (predRes.status === 401) {
              window.location.href = `/auth/login?callbackUrl=${encodeURIComponent(window.location.pathname)}`;
              return;
            }
            if (!predRes.ok) continue;
            const predData = await predRes.json();
            if (predData.stages) {
              for (const s of predData.stages) {
                if (s.hasSubmitted) {
                  allPredictions.push({
                    stageId: s.stageId,
                    stageName: s.stageName,
                    stageType: s.stageType,
                    tournamentId: t.id,
                    tournamentName: t.name,
                    status: s.predictionStatus,
                    totalScore: s.userScore || 0,
                  });
                }
              }
            }
          } catch {}
        }

        setPredictions(allPredictions);
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [session?.user?.id, sessionStatus]);

  if (sessionStatus === "loading" || loading) {
    return (
      <div className="flex justify-center py-20">
        <Loader2 className="h-8 w-8 text-sblt-red animate-spin" />
      </div>
    );
  }

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl text-center">
        <Target className="h-16 w-16 text-sblt-red mx-auto mb-4" />
        <h1 className="text-2xl font-bold text-white mb-4">Dự đoán của bạn</h1>
        <p className="text-sblt-muted mb-6">Đăng nhập để xem lịch sử dự đoán.</p>
        <Link href="/auth/login">
          <Button>Đăng nhập</Button>
        </Link>
      </div>
    );
  }

  const totalPoints = predictions.reduce((sum, p) => sum + p.totalScore, 0);
  const scoredCount = predictions.filter((p) => p.status === "SCORED").length;

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-white flex items-center gap-3 mb-2">
          <Target className="h-7 w-7 text-sblt-red" />
          Dự đoán của bạn
        </h1>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-8">
        <Card hover={false}>
          <CardContent className="pt-6 text-center">
            <Trophy className="h-8 w-8 text-sblt-red mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{totalPoints}</p>
            <p className="text-sm text-sblt-muted">Tổng điểm dự đoán</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="pt-6 text-center">
            <CheckCircle className="h-8 w-8 text-green-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{predictions.length}</p>
            <p className="text-sm text-sblt-muted">Vòng đã dự đoán</p>
          </CardContent>
        </Card>
        <Card hover={false}>
          <CardContent className="pt-6 text-center">
            <Target className="h-8 w-8 text-blue-400 mx-auto mb-2" />
            <p className="text-2xl font-bold text-white">{scoredCount}</p>
            <p className="text-sm text-sblt-muted">Vòng đã chấm điểm</p>
          </CardContent>
        </Card>
      </div>

      {/* Predictions list */}
      {predictions.length === 0 ? (
        <div className="text-center py-12 text-sblt-muted">
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
                      <p className="text-white font-medium">{pred.stageName}</p>
                      <p className="text-xs text-sblt-muted">{pred.tournamentName}</p>
                    </div>
                    <div className="flex items-center gap-3">
                      {pred.status === "SCORED" && (
                        <span className="text-lg font-bold text-sblt-red">{pred.totalScore}đ</span>
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
