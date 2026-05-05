import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { token, password } = body;

  if (!token || !password) {
    return NextResponse.json({ error: "Token và mật khẩu là bắt buộc" }, { status: 400 });
  }

  if (password.length < 6) {
    return NextResponse.json({ error: "Mật khẩu phải có ít nhất 6 ký tự" }, { status: 400 });
  }

  const resetToken = await prisma.passwordResetToken.findUnique({
    where: { token },
    include: { user: true },
  });

  if (!resetToken || resetToken.used) {
    return NextResponse.json({ error: "Link đặt lại mật khẩu không hợp lệ" }, { status: 400 });
  }

  if (new Date() > resetToken.expiresAt) {
    return NextResponse.json({ error: "Link đặt lại mật khẩu đã hết hạn. Vui lòng yêu cầu lại." }, { status: 400 });
  }

  const hashedPassword = await bcrypt.hash(password, 12);

  await prisma.$transaction([
    prisma.user.update({
      where: { id: resetToken.userId },
      data: { password: hashedPassword },
    }),
    prisma.passwordResetToken.update({
      where: { id: resetToken.id },
      data: { used: true },
    }),
  ]);

  return NextResponse.json({ message: "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay." });
}
