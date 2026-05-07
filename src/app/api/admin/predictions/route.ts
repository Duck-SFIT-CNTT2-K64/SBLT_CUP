import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/admin/predictions?tournamentId=...&stageId=...
 * Admin xem tất cả dự đoán cho một giải đấu.
 */
export async function GET(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const tournamentId = req.nextUrl.searchParams.get("tournamentId");
  const stageId = req.nextUrl.searchParams.get("stageId");

  if (!tournamentId) {
    return NextResponse.json({ error: "Thiếu tournamentId" }, { status: 400 });
  }

  const where: any = {
    stage: { tournamentId },
  };
  if (stageId) {
    where.stageId = stageId;
  }

  const predictions = await prisma.prediction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    include: {
      user: { select: { id: true, name: true, email: true } },
      stage: { select: { id: true, name: true, stageType: true, status: true } },
      entries: {
        include: {
          group: { select: { id: true, name: true } },
          rank1Player: { select: { id: true, ign: true } },
          rank2Player: { select: { id: true, ign: true } },
          rank3Player: { select: { id: true, ign: true } },
          rank4Player: { select: { id: true, ign: true } },
        },
      },
    },
  });

  return NextResponse.json({ predictions });
}
