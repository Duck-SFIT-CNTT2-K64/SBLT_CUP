import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET() {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
    select: {
      id: true,
      ign: true,
      rank: true,
      discord: true,
      phone: true,
      isGuest: true,
      createdAt: true,
      // Exclude userId (S-02)
    },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  return NextResponse.json(player);
}

export async function PUT(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { ign, rank, discord, phone } = body;

  const player = await prisma.player.findUnique({
    where: { userId: session.user.id },
  });

  if (!player) {
    return NextResponse.json({ error: "Player not found" }, { status: 404 });
  }

  // S-12: Validate field lengths
  if (ign !== undefined) {
    if (typeof ign !== "string" || ign.trim().length < 2 || ign.trim().length > 30) {
      return NextResponse.json({ error: "Tên ingame phải từ 2 đến 30 ký tự" }, { status: 400 });
    }
  }
  if (rank !== undefined && rank !== null && typeof rank !== "string") {
    return NextResponse.json({ error: "Rank không hợp lệ" }, { status: 400 });
  }
  if (discord !== undefined && discord !== null) {
    if (typeof discord !== "string" || discord.length > 100) {
      return NextResponse.json({ error: "Discord quá dài" }, { status: 400 });
    }
  }
  if (phone !== undefined && phone !== null) {
    if (typeof phone !== "string" || phone.length > 20) {
      return NextResponse.json({ error: "Số điện thoại không hợp lệ" }, { status: 400 });
    }
  }

  // S-13: Sanitize ign
  const sanitizedIgn = ign ? ign.trim().replace(/[<>&"]/g, "") : undefined;

  // Check if ign is already taken by another player
  if (sanitizedIgn && sanitizedIgn !== player.ign) {
    const existing = await prisma.player.findFirst({
      where: {
        ign: sanitizedIgn,
        id: { not: player.id },
      },
    });

    if (existing) {
      return NextResponse.json(
        { error: "Tên ingame đã được sử dụng" },
        { status: 400 }
      );
    }
  }

  const updated = await prisma.player.update({
    where: { id: player.id },
    data: {
      ign: sanitizedIgn || player.ign,
      rank: rank || null,
      discord: discord || null,
      phone: phone || null,
    },
    select: {
      id: true,
      ign: true,
      rank: true,
      discord: true,
      phone: true,
      isGuest: true,
      createdAt: true,
      // Exclude userId
    },
  });

  return NextResponse.json(updated);
}
