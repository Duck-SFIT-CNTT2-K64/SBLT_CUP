import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import { z } from "zod";

const resetPasswordSchema = z.object({
  token: z.string().min(1, "Token là bắt buộc"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
});

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { token, password } = resetPasswordSchema.parse(body);

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
        data: {
          password: hashedPassword,
          passwordChangedAt: new Date(),
        },
      }),
      prisma.passwordResetToken.update({
        where: { id: resetToken.id },
        data: { used: true },
      }),
    ]);

    return NextResponse.json({ message: "Mật khẩu đã được đặt lại thành công. Bạn có thể đăng nhập ngay." });
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: zodError.issues?.[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    console.error("Reset password error:", error);
    return NextResponse.json({ error: "Đã xảy ra lỗi khi đặt lại mật khẩu" }, { status: 500 });
  }
}
