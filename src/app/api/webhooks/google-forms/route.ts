import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { logger } from "@/lib/logger";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

const VALID_RANKS = ["Thach Dau", "Cao Thu", "Dai Cao Thu", "Kim Cuong", "Bach Kim", "Vang", "Bac", "Dong"] as const;

class ConflictError extends Error {
  constructor(message: string) {
    super(message);
    this.name = "ConflictError";
  }
}

export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook secret (timing-safe comparison)
    const secret = req.headers.get("x-webhook-secret");
    if (!WEBHOOK_SECRET || !secret) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const secretBuf = Buffer.from(secret);
    const expectedBuf = Buffer.from(WEBHOOK_SECRET);
    if (secretBuf.length !== expectedBuf.length || !crypto.timingSafeEqual(secretBuf, expectedBuf)) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // 2. Parse body
    const body = await req.json();
    const { email, name, phone, ign, rank } = body;

    if (!email || !name || !phone || !ign || !rank) {
      return NextResponse.json(
        { error: "Thiếu thông tin bắt buộc" },
        { status: 400 }
      );
    }

    if (!VALID_RANKS.includes(rank)) {
      return NextResponse.json(
        { error: "Rank không hợp lệ" },
        { status: 400 }
      );
    }

    // 3. Get active tournament (outside transaction — read-only)
    const tournament = await prisma.tournament.findFirst({
      where: { status: "REGISTRATION_OPEN" },
    });
    if (!tournament) {
      return NextResponse.json(
        { error: "Không có giải đấu nào đang mở đăng ký" },
        { status: 400 }
      );
    }

    // 4. Check registration capacity (outside transaction — read-only)
    const registrationCount = await prisma.registration.count({
      where: { tournamentId: tournament.id, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (registrationCount >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: "Giải đấu đã đủ số lượng tuyển thủ" },
        { status: 400 }
      );
    }

    // 5. Create User + Player + Registration in transaction (uniqueness checks inside)
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
      // Uniqueness checks inside transaction to prevent TOCTOU race condition
      const existingUser = await tx.user.findUnique({
        where: { email: email.toLowerCase() },
      });
      if (existingUser) {
        throw new ConflictError("Email đã được đăng ký");
      }

      const existingPlayer = await tx.player.findFirst({
        where: { ign },
      });
      if (existingPlayer) {
        throw new ConflictError("Tên ingame đã được sử dụng");
      }

      const user = await tx.user.create({
        data: {
          email: email.toLowerCase(),
          password: hashedPassword,
          name,
          role: "PLAYER",
          player: {
            create: {
              ign,
              rank,
              phone,
            },
          },
        },
        include: { player: true },
      });

      const registration = await tx.registration.create({
        data: {
          tournamentId: tournament.id,
          playerId: user.player!.id,
          status: "PENDING",
        },
      });

      // Create password reset token
      const token = crypto.randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000); // 24 hours

      await tx.passwordResetToken.create({
        data: { userId: user.id, token, expiresAt },
      });

      return { user, registration, resetToken: token };
    });

    // 8. Send password reset email
    const resetUrl = `${process.env.NEXTAUTH_URL}/auth/reset-password?token=${result.resetToken}`;

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
          to: email.toLowerCase(),
          subject: "Chào mừng bạn đến với SBLT CUP - Đặt mật khẩu",
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #dc2626;">🏆 SBLT CUP - Đăng ký thành công!</h2>
              <p>Xin chào <strong>${name.replace(/[<>&"]/g, (c: string) => ({ "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" }[c] || c))}</strong>,</p>
              <p>Bạn đã đăng ký tham gia giải đấu <strong>${tournament.name}</strong> thành công!</p>
              <p>Thông tin đăng ký:</p>
              <ul>
                <li><strong>Tên ingame:</strong> ${ign}</li>
                <li><strong>Rank:</strong> ${rank}</li>
                <li><strong>Trạng thái:</strong> Chờ duyệt</li>
              </ul>
              <p>Để quản lý tài khoản, vui lòng đặt mật khẩu bằng cách bấm vào link bên dưới:</p>
              <a href="${resetUrl}" style="display: inline-block; background: #dc2626; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; margin: 16px 0;">
                Đặt mật khẩu
              </a>
              <p style="color: #666; font-size: 14px;">Link có hiệu lực trong 24 giờ.</p>
              <p style="color: #666; font-size: 14px;">Bạn sẽ nhận được thông báo khi được duyệt tham gia giải đấu.</p>
            </div>
          `,
        });
      } catch (err) {
        logger.error("[EMAIL ERROR]", err instanceof Error ? err : new Error(String(err)));
      }
    }

    return NextResponse.json(
      {
        message: "Đăng ký thành công",
        registration: {
          id: result.registration.id,
          status: result.registration.status,
          playerName: result.user.name,
          ign: result.user.player!.ign,
        },
      },
      { status: 201 }
    );
  } catch (error) {
    if (error instanceof ConflictError) {
      return NextResponse.json({ error: error.message }, { status: 409 });
    }
    logger.error("Google Forms webhook error", error instanceof Error ? error : new Error(String(error)));
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý đăng ký" },
      { status: 500 }
    );
  }
}
