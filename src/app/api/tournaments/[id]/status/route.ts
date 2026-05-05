import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

/**
 * GET  — Lấy trạng thái hiện tại + gợi ý chuyển trạng thái tiếp theo
 * POST — Admin manual trigger chuyển trạng thái
 */

const STATUS_LABELS: Record<string, string> = {
  UPCOMING: "Sắp diễn ra",
  REGISTRATION_OPEN: "Đang mở đăng ký",
  REGISTRATION_CLOSED: "Đã đóng đăng ký",
  IN_PROGRESS: "Đang diễn ra",
  COMPLETED: "Đã kết thúc",
  CANCELLED: "Đã hủy",
};

const VALID_TRANSITIONS: Record<string, string[]> = {
  UPCOMING: ["REGISTRATION_OPEN", "CANCELLED"],
  REGISTRATION_OPEN: ["REGISTRATION_CLOSED", "CANCELLED"],
  REGISTRATION_CLOSED: ["IN_PROGRESS", "REGISTRATION_OPEN", "CANCELLED"],
  IN_PROGRESS: ["COMPLETED", "CANCELLED"],
  COMPLETED: [],
  CANCELLED: [],
};

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: { select: { status: true } },
      stages: {
        select: { id: true, name: true, status: true, stageOrder: true },
        orderBy: { stageOrder: "asc" },
      },
      _count: { select: { registrations: true } },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  const now = new Date();
  const approvedCount = tournament.registrations.filter((r) => r.status === "APPROVED").length;

  // Auto-suggest next status
  const suggestions: { status: string; label: string; reason: string }[] = [];

  if (tournament.status === "UPCOMING" && now >= new Date(tournament.regStart)) {
    suggestions.push({
      status: "REGISTRATION_OPEN",
      label: STATUS_LABELS.REGISTRATION_OPEN,
      reason: "Đã đến ngày mở đăng ký",
    });
  }

  if (tournament.status === "REGISTRATION_OPEN") {
    const reasons: string[] = [];
    if (approvedCount >= tournament.maxPlayers) reasons.push(`Đã đủ ${tournament.maxPlayers} tuyển thủ`);
    if (now >= new Date(tournament.regEnd)) reasons.push("Đã hết hạn đăng ký");
    if (reasons.length > 0) {
      suggestions.push({
        status: "REGISTRATION_CLOSED",
        label: STATUS_LABELS.REGISTRATION_CLOSED,
        reason: reasons.join(" · "),
      });
    }
  }

  if (tournament.status === "REGISTRATION_CLOSED" && now >= new Date(tournament.startDate)) {
    suggestions.push({
      status: "IN_PROGRESS",
      label: STATUS_LABELS.IN_PROGRESS,
      reason: "Đã đến ngày thi đấu",
    });
  }

  const finalStage = tournament.stages.find((s) => s.stageOrder === Math.max(...tournament.stages.map((st) => st.stageOrder)));
  if (tournament.status === "IN_PROGRESS" && finalStage?.status === "COMPLETED") {
    suggestions.push({
      status: "COMPLETED",
      label: STATUS_LABELS.COMPLETED,
      reason: "Vòng chung kết đã hoàn thành",
    });
  }

  return NextResponse.json({
    currentStatus: tournament.status,
    currentLabel: STATUS_LABELS[tournament.status],
    validTransitions: VALID_TRANSITIONS[tournament.status].map((s) => ({
      status: s,
      label: STATUS_LABELS[s],
    })),
    suggestions,
    stats: {
      approvedPlayers: approvedCount,
      maxPlayers: tournament.maxPlayers,
      stages: tournament.stages,
    },
  });
}

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();
  const { status: newStatus } = body;

  const tournament = await prisma.tournament.findUnique({ where: { id } });
  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  const allowed = VALID_TRANSITIONS[tournament.status] || [];
  if (!allowed.includes(newStatus)) {
    return NextResponse.json(
      { error: `Không thể chuyển từ ${STATUS_LABELS[tournament.status]} sang ${STATUS_LABELS[newStatus]}` },
      { status: 400 }
    );
  }

  const updated = await prisma.tournament.update({
    where: { id },
    data: { status: newStatus },
  });

  await auditLog({
    userId: session.user.id,
    action: "UPDATE_TOURNAMENT_STATUS",
    entityType: "Tournament",
    entityId: id,
    before: { status: tournament.status },
    after: { status: newStatus },
    ip: req.headers.get("x-forwarded-for") || undefined,
  });

  return NextResponse.json({
    message: `Đã chuyển trạng thái sang "${STATUS_LABELS[newStatus]}"`,
    status: updated.status,
  });
}
