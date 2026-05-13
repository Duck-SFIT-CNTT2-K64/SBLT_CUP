import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import crypto from "crypto";
import { logger } from "@/lib/logger";
import { checkRateLimit, RATE_LIMITS } from "@/lib/rate-limit";

export async function POST(req: NextRequest) {
  const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "127.0.0.1";
  const rateLimit = await checkRateLimit({
    key: `forgot-password:${ip}`,
    ...RATE_LIMITS.AUTH,
  });
  if (!rateLimit.allowed) {
    return NextResponse.json(
      { error: "Quá nhiều yêu cầu. Vui lòng thử lại sau." },
      { status: 429, headers: { "Retry-After": String(rateLimit.retryAfterSeconds) } }
    );
  }

  const body = await req.json();
  const { email } = body;

  if (!email) {
    return NextResponse.json({ error: "Email là bắt buộc" }, { status: 400 });
  }

  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase() } });

  // Always return success to prevent email enumeration
  if (!user) {
    return NextResponse.json({ message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu." });
  }

  // Invalidate old tokens
  await prisma.passwordResetToken.updateMany({
    where: { userId: user.id, used: false },
    data: { used: true },
  });

  // Create new token (expires in 1 hour)
  const token = crypto.randomBytes(32).toString("hex");
  const expiresAt = new Date(Date.now() + 60 * 60 * 1000);

  await prisma.passwordResetToken.create({
    data: { userId: user.id, token, expiresAt },
  });

  const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${token}`;

  // S-10: Never log reset token to console in production
  if (process.env.NODE_ENV === "development") {
    logger.info(`[DEV ONLY - PASSWORD RESET] User: ${user.email} | Link: ${resetUrl}`);
  }

  // If SMTP is configured, send email
  if (process.env.SMTP_HOST && process.env.SMTP_USER && process.env.SMTP_PASS) {
    try {
      const nodemailer = await import("nodemailer");
      const transporter = nodemailer.default.createTransport({
        host: process.env.SMTP_HOST,
        port: parseInt(process.env.SMTP_PORT || "587"),
        secure: process.env.SMTP_SECURE === "true",
        auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
      });

      await transporter.sendMail({
        from: `"SBLT CUP" <${process.env.SMTP_USER}>`,
        to: user.email,
        subject: "Đặt lại mật khẩu SBLT CUP",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #dc2626;">SBLT CUP — Đặt lại mật khẩu</h2>
            <p>Xin chào <strong>${user.name.replace(/[<>&"]/g, (c) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] || c))}</strong>,</p>
            <p>Bạn đã yêu cầu đặt lại mật khẩu. Bấm vào link bên dưới để tiếp tục:</p>
            <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
              Đặt lại mật khẩu
            </a>
            <p style="color: #666; font-size: 14px;">Link có hiệu lực trong 1 giờ. Nếu bạn không yêu cầu, hãy bỏ qua email này.</p>
          </div>
        `,
      });
    } catch (err) {
      logger.error("[EMAIL ERROR]", err instanceof Error ? err : new Error(String(err)));
    }
  }

  return NextResponse.json({ message: "Nếu email tồn tại, bạn sẽ nhận được link đặt lại mật khẩu." });
}
