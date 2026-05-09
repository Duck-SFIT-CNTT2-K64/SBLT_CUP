import { NextRequest, NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/prisma";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";
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
    // Rate limit: 3 registrations per 15 minutes per IP
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
    const rateLimit = await checkRateLimit({
      key: `register:${ip}`,
      ...RATE_LIMITS.AUTH,
    });
    if (!rateLimit.allowed) {
      return NextResponse.json(
        { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
        {
          status: 429,
          headers: { "Retry-After": String(rateLimit.retryAfterSeconds) },
        }
      );
    }

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
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: error.issues?.[0]?.message || "Dữ liệu không hợp lệ" },
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
