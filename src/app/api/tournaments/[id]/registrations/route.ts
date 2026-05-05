import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;

  const registrations = await prisma.registration.findMany({
    where: { tournamentId },
    include: {
      player: {
        include: { user: { select: { email: true } } },
      },
    },
    orderBy: { registeredAt: "asc" },
  });

  return NextResponse.json(registrations);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;
  const body = await req.json();
  const { registrationId, status, action, registrationIds } = body;

  // S-11: Validate status value
  const VALID_STATUSES = ["PENDING", "APPROVED", "REJECTED", "WITHDRAWN"];
  if (status && !VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  // Bulk action
  if (action === "bulk_approve" && registrationIds?.length) {
    const result = await prisma.registration.updateMany({
      where: { id: { in: registrationIds }, tournamentId },
      data: { status: "APPROVED" },
    });

    await auditLog({
      userId: session.user.id,
      action: "BULK_APPROVE_REGISTRATION",
      entityType: "Registration",
      entityId: tournamentId,
      after: { count: result.count, registrationIds },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: `Đã duyệt ${result.count} đăng ký` });
  }

  if (action === "bulk_reject" && registrationIds?.length) {
    const result = await prisma.registration.updateMany({
      where: { id: { in: registrationIds }, tournamentId },
      data: { status: "REJECTED" },
    });

    await auditLog({
      userId: session.user.id,
      action: "BULK_REJECT_REGISTRATION",
      entityType: "Registration",
      entityId: tournamentId,
      after: { count: result.count, registrationIds },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: `Đã từ chối ${result.count} đăng ký` });
  }

  // Single update
  try {
    // B-17: Verify registrationId belongs to this tournament
    const existing = await prisma.registration.findFirst({
      where: { id: registrationId, tournamentId },
    });
    if (!existing) {
      return NextResponse.json({ error: "Không tìm thấy đăng ký" }, { status: 404 });
    }

    // Validate status transition
    const VALID_REG_TRANSITIONS: Record<string, string[]> = {
      PENDING: ["APPROVED", "REJECTED", "WITHDRAWN"],
      APPROVED: ["REJECTED", "WITHDRAWN"],
      REJECTED: ["PENDING"],
      WITHDRAWN: ["PENDING"],
    };
    const allowedStatuses = VALID_REG_TRANSITIONS[existing.status] || [];
    if (status && !allowedStatuses.includes(status)) {
      return NextResponse.json(
        { error: `Không thể chuyển từ trạng thái ${existing.status} sang ${status}` },
        { status: 400 }
      );
    }

    const registration = await prisma.registration.update({
      where: { id: registrationId },
      data: { status },
    });

    await auditLog({
      userId: session.user.id,
      action: "UPDATE_REGISTRATION",
      entityType: "Registration",
      entityId: registrationId,
      before: { status: existing.status },
      after: { status },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(registration);
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật" },
      { status: 500 }
    );
  }
}
