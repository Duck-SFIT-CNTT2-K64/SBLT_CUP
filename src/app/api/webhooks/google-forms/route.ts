import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import bcrypt from "bcryptjs";
import crypto from "crypto";

const WEBHOOK_SECRET = process.env.WEBHOOK_SECRET;

export async function POST(req: NextRequest) {
  try {
    // 1. Verify webhook secret
    const secret = req.headers.get("x-webhook-secret");
    if (!WEBHOOK_SECRET || secret !== WEBHOOK_SECRET) {
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

    // 3. Check email uniqueness
    const existingUser = await prisma.user.findUnique({
      where: { email: email.toLowerCase() },
    });
    if (existingUser) {
      return NextResponse.json(
        { error: "Email đã được đăng ký" },
        { status: 409 }
      );
    }

    // 4. Check ign uniqueness
    const existingPlayer = await prisma.player.findFirst({
      where: { ign },
    });
    if (existingPlayer) {
      return NextResponse.json(
        { error: "Tên ingame đã được sử dụng" },
        { status: 409 }
      );
    }

    // 5. Get active tournament
    const tournament = await prisma.tournament.findFirst({
      where: { status: "REGISTRATION_OPEN" },
    });
    if (!tournament) {
      return NextResponse.json(
        { error: "Không có giải đấu nào đang mở đăng ký" },
        { status: 400 }
      );
    }

    // 6. Check registration capacity
    const registrationCount = await prisma.registration.count({
      where: { tournamentId: tournament.id, status: { in: ["PENDING", "APPROVED"] } },
    });
    if (registrationCount >= tournament.maxPlayers) {
      return NextResponse.json(
        { error: "Giải đấu đã đủ số lượng tuyển thủ" },
        { status: 400 }
      );
    }

    // 7. Create User + Player + Registration in transaction
    const randomPassword = crypto.randomBytes(16).toString("hex");
    const hashedPassword = await bcrypt.hash(randomPassword, 12);

    const result = await prisma.$transaction(async (tx) => {
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
        console.error("[EMAIL ERROR]", err);
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
    console.error("Google Forms webhook error:", error);
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi xử lý đăng ký" },
      { status: 500 }
    );
  }
}
