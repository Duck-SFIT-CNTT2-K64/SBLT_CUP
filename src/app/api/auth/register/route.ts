import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { z } from "zod";

const registerSchema = z.object({
  email: z.string().email("Email không hợp lệ"),
  password: z
    .string()
    .min(8, "Mật khẩu phải có ít nhất 8 ký tự")
    .regex(/[A-Z]/, "Mật khẩu phải có ít nhất 1 chữ hoa")
    .regex(/[a-z]/, "Mật khẩu phải có ít nhất 1 chữ thường")
    .regex(/[0-9]/, "Mật khẩu phải có ít nhất 1 chữ số"),
  name: z.string().min(2, "Tên phải có ít nhất 2 ký tự"),
  ign: z.string().min(2, "Tên ingame phải có ít nhất 2 ký tự"),
});

const ADMIN_EMAILS = (process.env.ADMIN_EMAILS || "").split(",").map((e) => e.trim().toLowerCase());

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { email, password, name, ign } = registerSchema.parse(body);

    const existingUser = await prisma.user.findUnique({
      where: { email },
    });

    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được sử dụng" },
        { status: 400 }
      );
    }

    const existingPlayer = await prisma.player.findFirst({
      where: { ign },
    });

    if (existingPlayer) {
      return NextResponse.json(
        { error: "Tên ingame đã được sử dụng" },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 12);
    const role = ADMIN_EMAILS.includes(email.toLowerCase()) ? "ADMIN" : "PLAYER";

    const user = await prisma.user.create({
      data: {
        email,
        password: hashedPassword,
        name,
        role,
        player: {
          create: {
            ign,
          },
        },
      },
      include: {
        player: true,
      },
    });

    return NextResponse.json(
      {
        message: "Đăng ký thành công",
        user: {
          id: user.id,
          email: user.email,
          name: user.name,
          role: user.role,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof Error && error.name === "ZodError") {
      const zodError = error as any;
      return NextResponse.json(
        { error: zodError.issues?.[0]?.message || "Dữ liệu không hợp lệ" },
        { status: 400 }
      );
    }

    console.error("Registration error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi đăng ký" },
      { status: 500 }
    );
  }
}
