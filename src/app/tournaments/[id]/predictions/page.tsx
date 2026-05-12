"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Target, Clock, Lock, CheckCircle, Loader2 } from "lucide-react";
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

const STATUS_LABELS: Record<string, { label: string; variant: "green" | "yellow" | "blue" | "default" }> = {
  OPEN: { label: "Đang mở", variant: "green" },
  LOCKED: { label: "Đã khóa", variant: "yellow" },
  SCORED: { label: "Đã chấm", variant: "blue" },
  NOT_READY: { label: "Chưa sẵn sàng", variant: "default" },
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
        <div className="text-center">
          <Target className="h-16 w-16 text-[#dc2626] mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-[#f5f5f5] mb-4">Dự đoán kết quả</h1>
          <p className="text-[#888] mb-6">
            Đăng nhập để dự đoán 4 người đi tiếp mỗi bảng đấu và xem cơ cấu phần thưởng từ BTC.
          </p>
          <Link href="/auth/login">
            <Button>Đăng nhập để dự đoán</Button>
          </Link>
        </div>

        <div className="mt-10">
          <PredictionRulesAndRewardsPanel />
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-6xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-[#f5f5f5] flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-[#dc2626]" />
          Dự đoán kết quả
        </h1>
        <p className="text-[#888]">
          Dự đoán 4 người đi tiếp của mỗi bảng đấu. Đúng mỗi người thuộc top 4 = 10đ. Chung kết x2!
        </p>
      </div>

      <PredictionRulesAndRewardsPanel />

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-[#dc2626] animate-spin" />
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-12 text-[#888]">
          Chưa có vòng đấu nào hỗ trợ dự đoán.
        </div>
      ) : (
        <div className="space-y-4">
          {stages.map((stage) => {
            const statusInfo = STATUS_LABELS[stage.predictionStatus] || STATUS_LABELS.NOT_READY;
            const totalPlayers = stage.groups.reduce((sum, g) => sum + g.players.length, 0);

            return (
              <Card key={stage.stageId} hover={stage.predictionStatus === "OPEN"}>
                <CardHeader>
                  <div className="flex items-center justify-between">
                    <CardTitle className="flex items-center gap-2">
                      {stage.stageName}
                      <Badge variant={statusInfo.variant}>{statusInfo.label}</Badge>
                    </CardTitle>
                    {stage.hasSubmitted && stage.userScore !== null && (
                      <span className="text-lg font-bold text-[#dc2626]">{stage.userScore}đ</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-[#888]">
                      {stage.groups.length} bảng đấu &middot; {totalPlayers} tuyển thủ
                      {stage.hasSubmitted && (
                        <span className="ml-2 text-green-400">
                          <CheckCircle className="inline h-3 w-3 mr-1" />
                          Đã dự đoán
                        </span>
                      )}
                    </div>

                    {stage.predictionStatus === "OPEN" && (
                      <Link href={`/tournaments/${tournamentId}/predictions/${stage.stageId}`}>
                        <Button size="sm">
                          {stage.hasSubmitted ? "Chỉnh sửa" : "Dự đoán ngay"}
                        </Button>
                      </Link>
                    )}

                    {stage.predictionStatus === "SCORED" && (
                      <Link href={`/tournaments/${tournamentId}/predictions/${stage.stageId}/leaderboard`}>
                        <Button size="sm" variant="outline">Xem bảng xếp hạng</Button>
                      </Link>
                    )}

                    {stage.predictionStatus === "LOCKED" && (
                      <span className="text-sm text-[#888] flex items-center gap-1">
                        <Lock className="h-3 w-3" />
                        {stage.lockedReason === "window_not_open"
                          ? `Mở lúc ${formatVietnamTime(stage.windowOpensAt)} ngày ${formatVietnamDate(stage.windowOpensAt)}`
                          : stage.lockedReason === "window_closed"
                            ? "Cửa sổ dự đoán đã đóng"
                            : "Đã khóa"}
                      </span>
                    )}

                    {stage.predictionStatus === "NOT_READY" && (
                      <span className="text-sm text-[#888] flex items-center gap-1">
                        <Clock className="h-3 w-3" /> Chờ bốc thăm
                      </span>
                    )}
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
