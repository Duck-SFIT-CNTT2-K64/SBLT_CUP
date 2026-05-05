import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

const VALID_ROLES = ["ADMIN", "PLAYER"] as const;

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

  // S-06: Validate role value
  if (!VALID_ROLES.includes(body.role)) {
    return NextResponse.json({ error: "Role không hợp lệ" }, { status: 400 });
  }

  // S-15: Admin cannot change their own role
  if (session.user.id === id) {
    return NextResponse.json({ error: "Không thể thay đổi role của chính mình" }, { status: 400 });
  }

  // Check target user exists
  const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true, role: true } });
  if (!existingUser) {
    return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
  }

  try {
    const before = { role: existingUser.role };

    const user = await prisma.user.update({
      where: { id },
      // S-04: Only update allowed fields, never passthrough body
      data: { role: body.role },
      select: { id: true, email: true, name: true, role: true },
    });

    await auditLog({
      userId: session.user.id,
      action: "UPDATE_USER_ROLE",
      entityType: "User",
      entityId: id,
      before: { role: before?.role },
      after: { role: body.role },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(user);
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

  // S-15: Admin cannot delete themselves
  if (session.user.id === id) {
    return NextResponse.json({ error: "Không thể xóa tài khoản của chính mình" }, { status: 400 });
  }

  // Check target user exists
  const existingUser = await prisma.user.findUnique({ where: { id }, select: { id: true } });
  if (!existingUser) {
    return NextResponse.json({ error: "Không tìm thấy người dùng" }, { status: 404 });
  }

  try {
    await prisma.user.delete({ where: { id } });

    await auditLog({
      userId: session.user.id,
      action: "DELETE_USER",
      entityType: "User",
      entityId: id,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: "Đã xóa người dùng" });
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa" }, { status: 500 });
  }
}
