import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; prizeId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId, prizeId } = await params;
  const body = await req.json();

  // B-17: Verify prize belongs to this tournament
  const existing = await prisma.prize.findFirst({
    where: { id: prizeId, tournamentId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy giải thưởng" }, { status: 404 });
  }

  // S-04: Whitelist allowed fields only
  const allowedFields: Record<string, unknown> = {};
  if (body.rank !== undefined) {
    const r = Number(body.rank);
    if (!Number.isInteger(r) || r < 1 || r > 100) {
      return NextResponse.json({ error: "Hạng không hợp lệ (1-100)" }, { status: 400 });
    }
    allowedFields.rank = r;
  }
  if (body.amount !== undefined) {
    const a = Number(body.amount);
    if (!Number.isInteger(a) || a < 0) {
      return NextResponse.json({ error: "Số tiền không hợp lệ" }, { status: 400 });
    }
    allowedFields.amount = a;
  }
  if (body.description !== undefined) {
    const d = String(body.description).trim();
    if (d.length === 0) {
      return NextResponse.json({ error: "Mô tả không được để trống" }, { status: 400 });
    }
    allowedFields.description = d.slice(0, 500);
  }
  if (body.playerId !== undefined) allowedFields.playerId = body.playerId || null;
  if (body.paid !== undefined) {
    if (body.paid === true) {
      const playerIdBeingSet = allowedFields.playerId !== undefined ? allowedFields.playerId : existing.playerId;
      if (!playerIdBeingSet) {
        return NextResponse.json(
          { error: "Cần gán tuyển thủ trước khi đánh dấu đã trả" },
          { status: 400 }
        );
      }
      allowedFields.paid = true;
      allowedFields.paidAt = new Date();
    } else {
      allowedFields.paid = false;
      allowedFields.paidAt = null;
    }
  }

  try {
    const prize = await prisma.prize.update({
      where: { id: prizeId },
      data: allowedFields,
      include: { player: true },
    });

    await auditLog({
      userId: session.user.id,
      action: "UPDATE_PRIZE",
      entityType: "Prize",
      entityId: prizeId,
      before: { rank: existing.rank, amount: existing.amount, paid: existing.paid, playerId: existing.playerId },
      after: allowedFields,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(prize);
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi cập nhật" },
      { status: 500 }
    );
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string; prizeId: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId, prizeId } = await params;

  // B-17: Verify prize belongs to this tournament
  const existing = await prisma.prize.findFirst({
    where: { id: prizeId, tournamentId },
  });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy giải thưởng" }, { status: 404 });
  }

  try {
    await prisma.prize.delete({ where: { id: prizeId } });

    await auditLog({
      userId: session.user.id,
      action: "DELETE_PRIZE",
      entityType: "Prize",
      entityId: prizeId,
      before: { rank: existing.rank, amount: existing.amount, description: existing.description },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: "Đã xóa giải thưởng" });
  } catch {
    return NextResponse.json({ error: "Lỗi khi xóa" }, { status: 500 });
  }
}
