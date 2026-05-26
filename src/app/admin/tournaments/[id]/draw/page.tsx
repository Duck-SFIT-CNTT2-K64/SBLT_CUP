"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams, useRouter } from "next/navigation";
import BallDraw from "@/components/BallDraw";

interface DrawData {
  stageType: string;
  stageId: string;
  advancingPlayers: { id: string; ign: string; rank: string | null; fromGroup: string; finalRank: number }[];
  guestPlayers: { id: string; ign: string; rank: string | null; isGuest: boolean }[];
  allWheelItems: { id: string; label: string; type: "advancing" | "guest"; fromGroup?: string }[];
  groups: { id: string; name: string; currentCount: number }[];
  totalAdvancing: number;
  totalGuests: number;
}

export default function DrawPage() {
  const params = useParams();
  const router = useRouter();
  const [drawData, setDrawData] = useState<DrawData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    async function fetchDrawData() {
      try {
        // First get tournament to find SEMI_1 stage
        const tRes = await fetch(`/api/tournaments/${params.id}`);
        if (!tRes.ok) { setError("Không tìm thấy giải đấu"); return; }
        const tournament = await tRes.json();

        const semi1Stage = tournament.stages?.find((s: { stageType: string }) => s.stageType === "SEMI_1");
        if (!semi1Stage) { setError("Không tìm thấy vòng Semi 1"); return; }

        // Fetch draw data
        const dRes = await fetch(`/api/tournaments/${params.id}/stages/${semi1Stage.id}/draw`);
        if (!dRes.ok) { setError("Không thể tải dữ liệu bốc thăm"); return; }
        const data = await dRes.json();
        if (data.stageType !== "SEMI_1") { setError("Vòng này không hỗ trợ bốc thăm"); return; }

        setDrawData({ ...data, stageId: semi1Stage.id });
      } catch {
        setError("Đã xảy ra lỗi");
      } finally {
        setLoading(false);
      }
    }
    fetchDrawData();
  }, [params.id]);

  const handleComplete = useCallback(
    async (assignments: { groupId: string; playerIds: string[] }[]) => {
      if (!drawData) return;
      setSubmitting(true);
      try {
        const res = await fetch(`/api/tournaments/${params.id}/stages/${drawData.stageId}/draw`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ drawType: "wheel_spin", assignments }),
        });
        if (res.ok) {
          router.push(`/admin/tournaments/${params.id}`);
        } else {
          const data = await res.json();
          setError(data.error || "Lỗi khi lưu kết quả");
          setSubmitting(false);
        }
      } catch {
        setError("Đã xảy ra lỗi khi lưu");
        setSubmitting(false);
      }
    },
    [drawData, params.id, router],
  );

  if (loading) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#888] text-sm">Đang tải...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex flex-col items-center justify-center gap-4">
        <div className="text-red-400 text-sm">{error}</div>
        <button
          onClick={() => router.push(`/admin/tournaments/${params.id}`)}
          className="text-[#888] hover:text-white text-sm underline"
        >
          Quay lại
        </button>
      </div>
    );
  }

  if (submitting) {
    return (
      <div className="min-h-screen bg-[#0a0a0a] flex items-center justify-center">
        <div className="text-[#888] text-sm">Đang lưu kết quả...</div>
      </div>
    );
  }

  if (!drawData) return null;

  return (
    <BallDraw
      items={drawData.allWheelItems}
      groups={drawData.groups}
      onAssignmentsComplete={handleComplete}
      onCancel={() => router.push(`/admin/tournaments/${params.id}`)}
    />
  );
}
