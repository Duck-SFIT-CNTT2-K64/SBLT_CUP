import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

// Admin cập nhật trạng thái kháng nghị
export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ disputeId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { disputeId } = await params;
  const body = await req.json();
  const { status, adminNote } = body;

  const validStatuses = ["PENDING", "REVIEWING", "RESOLVED", "REJECTED"];
  if (!validStatuses.includes(status)) {
    return NextResponse.json({ error: "Trạng thái không hợp lệ" }, { status: 400 });
  }

  // B-15: Validate adminNote length
  if (adminNote !== undefined && adminNote !== null) {
    if (typeof adminNote !== "string" || adminNote.length > 2000) {
      return NextResponse.json({ error: "Ghi chú không được quá 2000 ký tự" }, { status: 400 });
    }
  }

  // Check dispute exists
  const existing = await prisma.dispute.findUnique({ where: { id: disputeId } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy kháng nghị" }, { status: 404 });
  }

  // Validate status transition
  const VALID_DISPUTE_TRANSITIONS: Record<string, string[]> = {
    PENDING: ["REVIEWING", "RESOLVED", "REJECTED"],
    REVIEWING: ["RESOLVED", "REJECTED"],
    RESOLVED: [],
    REJECTED: [],
  };
  const allowedTransitions = VALID_DISPUTE_TRANSITIONS[existing.status] || [];
  if (!allowedTransitions.includes(status)) {
    return NextResponse.json(
      { error: `Không thể chuyển trạng thái kháng nghị từ ${existing.status} sang ${status}` },
      { status: 400 }
    );
  }

  // S-13: Sanitize adminNote
  const sanitizedNote = adminNote
    ? String(adminNote).replace(/[<>&"]/g, (c: string) => {
        const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
        return map[c] || c;
      })
    : null;

  const dispute = await prisma.dispute.update({
    where: { id: disputeId },
    data: {
      status,
      adminNote: sanitizedNote,
      resolvedBy: ["RESOLVED", "REJECTED"].includes(status) ? session.user.id : null,
      resolvedAt: ["RESOLVED", "REJECTED"].includes(status) ? new Date() : null,
    },
    include: {
      player: { select: { ign: true } },
      tournament: { select: { name: true } },
    },
  });

  await auditLog({
    userId: session.user.id,
    action: "UPDATE_DISPUTE",
    entityType: "Dispute",
    entityId: disputeId,
    before: { status: existing.status, adminNote: existing.adminNote },
    after: { status, adminNote: sanitizedNote },
    ip: req.headers.get("x-forwarded-for") || undefined,
  });

  return NextResponse.json(dispute);
}
