import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const announcementUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  content: z.string().min(1).max(5000).optional(),
  type: z.enum(["GENERAL", "SCHEDULE_CHANGE", "RULE_UPDATE", "RESULT"]).optional(),
  tournamentId: z.string().cuid().optional().nullable(),
});

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // S-04: Validate and whitelist fields
  const parsed = announcementUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  // Check exists
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
  }

  try {
    const announcement = await prisma.announcement.update({
      where: { id },
      data: parsed.data,
    });

    await auditLog({
      userId: session.user.id,
      action: "UPDATE_ANNOUNCEMENT",
      entityType: "Announcement",
      entityId: id,
      before: { title: existing.title, content: existing.content, type: existing.type },
      after: parsed.data,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(announcement);
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi khi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  // B-08: Check exists before delete
  const existing = await prisma.announcement.findUnique({ where: { id } });
  if (!existing) {
    return NextResponse.json({ error: "Không tìm thấy thông báo" }, { status: 404 });
  }

  try {
    await prisma.announcement.delete({ where: { id } });

    await auditLog({
      userId: session.user.id,
      action: "DELETE_ANNOUNCEMENT",
      entityType: "Announcement",
      entityId: id,
      before: { title: existing.title, content: existing.content, type: existing.type },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: "Đã xóa thông báo" });
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa" }, { status: 500 });
  }
}
