import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { endpoint, keys } = body;

  if (!endpoint || !keys?.p256dh || !keys?.auth) {
    return NextResponse.json({ error: "Thiếu thông tin subscription" }, { status: 400 });
  }

  // Upsert subscription
  await prisma.pushSubscription.upsert({
    where: {
      userId_endpoint: {
        userId: session.user.id,
        endpoint,
      },
    },
    update: {
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
    create: {
      userId: session.user.id,
      endpoint,
      p256dh: keys.p256dh,
      auth: keys.auth,
    },
  });

  return NextResponse.json({ success: true });
}

export async function DELETE(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const endpoint = searchParams.get("endpoint");

  if (!endpoint) {
    return NextResponse.json({ error: "Thiếu endpoint" }, { status: 400 });
  }

  await prisma.pushSubscription.deleteMany({
    where: {
      userId: session.user.id,
      endpoint,
    },
  });

  return NextResponse.json({ success: true });
}
