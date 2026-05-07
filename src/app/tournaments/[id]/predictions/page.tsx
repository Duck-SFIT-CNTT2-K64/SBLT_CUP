"use client";

import { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { useSession } from "next-auth/react";
import Link from "next/link";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { Button } from "@/components/ui/Button";
import { Alert } from "@/components/ui/Alert";
import { Target, Trophy, Clock, Lock, CheckCircle, Loader2 } from "lucide-react";

interface StageData {
  stageId: string;
  stageName: string;
  stageType: string;
  stageStatus: string;
  predictionStatus: string;
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

export default function PredictionsPage() {
  const params = useParams();
  const { data: session } = useSession();
  const [stages, setStages] = useState<StageData[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  const tournamentId = params.id as string;

  useEffect(() => {
    if (!session?.user?.id) {
      setLoading(false);
      return;
    }

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
      .finally(() => setLoading(false));
  }, [tournamentId, session?.user?.id]);

  if (!session?.user?.id) {
    return (
      <div className="container mx-auto px-4 py-12 max-w-4xl">
        <div className="text-center">
          <Target className="h-16 w-16 text-sblt-red mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-white mb-4">Dự đoán kết quả</h1>
          <p className="text-sblt-muted mb-6">
            Đăng nhập để dự đoán top 4 mỗi bảng đấu và nhận giải thưởng từ Riot!
          </p>
          <Link href="/auth/login">
            <Button>Đăng nhập để dự đoán</Button>
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-white flex items-center gap-3 mb-2">
          <Target className="h-8 w-8 text-sblt-red" />
          Dự đoán kết quả
        </h1>
        <p className="text-sblt-muted">
          Dự đoán top 1, 2, 3, 4 của mỗi bảng đấu. Đúng mỗi vị trí = 10đ. Chung kết x2!
        </p>
      </div>

      {/* Info banner */}
      <div className="bg-sblt-red/5 border border-sblt-red/20 rounded-xl p-4 mb-6">
        <div className="flex items-start gap-3">
          <Trophy className="h-5 w-5 text-sblt-red mt-0.5 shrink-0" />
          <div className="text-sm text-sblt-muted">
            <p className="text-white font-medium mb-1">Cách tính điểm dự đoán</p>
            <p>Dự đoán đúng mỗi vị trí Top 1-4 = <strong className="text-yellow-400">10 điểm</strong>. Riêng vòng <strong className="text-red-400">Chung Kết</strong> điểm x2 (20đ/rank). Người có tổng điểm cao nhất sau Chung Kết sẽ nhận giải thưởng từ Riot!</p>
          </div>
        </div>
      </div>

      {error && <Alert variant="error" message={error} className="mb-4" />}

      {loading ? (
        <div className="flex justify-center py-12">
          <Loader2 className="h-8 w-8 text-sblt-red animate-spin" />
        </div>
      ) : stages.length === 0 ? (
        <div className="text-center py-12 text-sblt-muted">
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
                      <span className="text-lg font-bold text-sblt-red">{stage.userScore}đ</span>
                    )}
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-sblt-muted">
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
                      <span className="text-sm text-sblt-muted flex items-center gap-1">
                        <Lock className="h-3 w-3" /> Đã khóa
                      </span>
                    )}

                    {stage.predictionStatus === "NOT_READY" && (
                      <span className="text-sm text-sblt-muted flex items-center gap-1">
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
