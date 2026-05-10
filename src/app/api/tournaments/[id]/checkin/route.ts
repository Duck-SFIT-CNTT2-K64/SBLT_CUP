import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { handleApiError } from "@/lib/api-error";

// Player tự check-in
export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = await auth();
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
  });

  if (!player) {
    return NextResponse.json({ error: "Không tìm thấy hồ sơ tuyển thủ" }, { status: 404 });
  }

  const registration = await prisma.registration.findUnique({
    where: { tournamentId_playerId: { tournamentId, playerId: player.id } },
  });

  if (!registration) {
    return NextResponse.json({ error: "Bạn chưa đăng ký giải đấu này" }, { status: 404 });
  }

  if (registration.status !== "APPROVED") {
    return NextResponse.json({ error: "Đăng ký chưa được duyệt" }, { status: 400 });
  }

  if (registration.checkedIn) {
    return NextResponse.json({ message: "Đã check-in trước đó", checkedIn: true });
  }

  const updated = await prisma.registration.update({
    where: { id: registration.id },
    data: { checkedIn: true, checkInTime: new Date() },
  });

  return NextResponse.json({ message: "Check-in thành công", checkedIn: true, checkInTime: updated.checkInTime });
  } catch (error) {
    return handleApiError(error);
  }
}

// Admin xem danh sách check-in
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;

  const registrations = await prisma.registration.findMany({
    where: { tournamentId, status: "APPROVED" },
    include: {
      player: {
        include: { user: { select: { email: true } } },
      },
    },
    orderBy: [{ checkedIn: "desc" }, { checkInTime: "asc" }],
  });

  const summary = {
    total: registrations.length,
    checkedIn: registrations.filter((r) => r.checkedIn).length,
    notCheckedIn: registrations.filter((r) => !r.checkedIn).length,
    registrations,
  };

  return NextResponse.json(summary);
  } catch (error) {
    return handleApiError(error);
  }
}

// Admin force check-in hoặc reject người không check-in
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;
  const body = await req.json();
  const { registrationId, action } = body;

  const VALID_ACTIONS = ["checkin", "reject_no_checkin", "bulk_reject_no_checkin"];
  if (!action || !VALID_ACTIONS.includes(action)) {
    return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  }

  // For single-item actions, validate registrationId belongs to this tournament
  if ((action === "checkin" || action === "reject_no_checkin") && registrationId) {
    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, tournamentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy đăng ký" }, { status: 404 });
    }
  }

  if (action === "checkin") {
    // Verify registration is APPROVED
    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, tournamentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy đăng ký" }, { status: 404 });
    }
    if (existing.status !== "APPROVED") {
      return NextResponse.json({ error: "Chỉ có thể check-in tuyển thủ đã được duyệt" }, { status: 400 });
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { checkedIn: true, checkInTime: new Date() },
    });

    await auditLog({
      userId: session.user.id,
      action: "ADMIN_CHECKIN",
      entityType: "Registration",
      entityId: registrationId,
      after: { checkedIn: true },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(updated);
  }

  if (action === "reject_no_checkin") {
    // Verify registration is not already checked in
    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, tournamentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy đăng ký" }, { status: 404 });
    }
    if (existing.checkedIn) {
      return NextResponse.json({ error: "Không thể từ chối tuyển thủ đã check-in" }, { status: 400 });
    }

    const updated = await prisma.registration.update({
      where: { id: registrationId },
      data: { status: "REJECTED" },
    });

    await auditLog({
      userId: session.user.id,
      action: "REJECT_NO_CHECKIN",
      entityType: "Registration",
      entityId: registrationId,
      after: { status: "REJECTED" },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(updated);
  }

  // Bulk reject all who haven't checked in
  if (action === "bulk_reject_no_checkin") {
    const result = await prisma.registration.updateMany({
      where: { tournamentId, status: "APPROVED", checkedIn: false },
      data: { status: "REJECTED" },
    });

    await auditLog({
      userId: session.user.id,
      action: "BULK_REJECT_NO_CHECKIN",
      entityType: "Registration",
      entityId: tournamentId,
      after: { count: result.count },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: `Đã từ chối ${result.count} người không check-in` });
  }

  return NextResponse.json({ error: "Action không hợp lệ" }, { status: 400 });
  } catch (error) {
    return handleApiError(error);
  }
}
