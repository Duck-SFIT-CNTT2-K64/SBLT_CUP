import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { PREDICTABLE_STAGES } from "@/lib/constants";
import { getPredictionWindow } from "@/lib/predictions";
import type { StageType } from "@prisma/client";

/**
 * GET /api/tournaments/[id]/predictions
 * Trả về trạng thái dự đoán cho tất cả các vòng có thể dự đoán.
 * Yêu cầu đăng nhập.
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id: tournamentId },
    include: {
      stages: {
        where: { stageType: { in: PREDICTABLE_STAGES as StageType[] } },
        orderBy: { stageOrder: "asc" },
        include: {
          groups: {
            include: {
              players: {
                include: { player: { select: { id: true, ign: true, isGuest: true } } },
              },
            },
          },
        },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  // Lấy user's player profile
  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: { id: true },
  });

  // Lấy predictions của user cho tournament này
  const userPredictions = player
    ? await prisma.prediction.findMany({
        where: {
          userId: session.user.id,
          stage: { tournamentId },
        },
        select: { stageId: true, status: true, totalScore: true },
      })
    : [];

  const predictionMap = new Map(userPredictions.map((p) => [p.stageId, p]));

  const stages = tournament.stages.map((stage) => {
    const hasPlayers = stage.groups.some((g) => g.players.length > 0);
    const window = getPredictionWindow(stage.date);

    let predictionStatus: string;
    let lockedReason: string | null = null;

    if (stage.status === "COMPLETED") {
      predictionStatus = "SCORED";
    } else if (stage.status === "IN_PROGRESS") {
      predictionStatus = "LOCKED";
      lockedReason = "stage_started";
    } else if (!window.isOpen) {
      predictionStatus = "LOCKED";
      const now = new Date();
      lockedReason = now < new Date(window.windowOpensAt) ? "window_not_open" : "window_closed";
    } else if (hasPlayers) {
      predictionStatus = "OPEN";
    } else {
      predictionStatus = "NOT_READY";
    }

    const userPred = predictionMap.get(stage.id);

    return {
      stageId: stage.id,
      stageName: stage.name,
      stageType: stage.stageType,
      stageStatus: stage.status,
      predictionStatus,
      lockedReason,
      windowOpensAt: window.windowOpensAt,
      windowClosesAt: window.windowClosesAt,
      hasSubmitted: !!userPred,
      userScore: userPred?.totalScore ?? null,
      groups: stage.groups.map((g) => ({
        groupId: g.id,
        groupName: g.name,
        players: g.players.map((gp) => ({
          id: gp.player.id,
          ign: gp.player.ign,
          isGuest: gp.player.isGuest,
        })),
      })),
    };
  });

  return NextResponse.json({ stages }, {
    headers: { "Cache-Control": "public, s-maxage=30, stale-while-revalidate" },
  });
}
