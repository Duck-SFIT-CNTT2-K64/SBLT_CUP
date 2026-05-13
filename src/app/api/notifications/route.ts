import { NextRequest } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { markAllAsRead, markAsRead } from "@/lib/notifications";

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const searchParams = request.nextUrl.searchParams;
  const page = Math.max(1, parseInt(searchParams.get("page") || "1"));
  const limit = Math.min(100, Math.max(1, parseInt(searchParams.get("limit") || "20")));
  const unreadOnly = searchParams.get("unread") === "true";

  const where = {
    userId: session.user.id,
    ...(unreadOnly && { read: false }),
  };

  const [notifications, total] = await Promise.all([
    prisma.notification.findMany({
      where,
      orderBy: { createdAt: "desc" },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.notification.count({ where }),
  ]);

  return Response.json({
    data: notifications,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  }, {
    headers: { "Cache-Control": "private, no-store" },
  });
}

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { action, notificationId } = body;

  if (action === "read" && notificationId) {
    if (typeof notificationId !== "string") {
      return Response.json({ error: "Invalid notificationId" }, { status: 400 });
    }
    try {
      await markAsRead(notificationId, session.user.id);
    } catch {
      return Response.json({ error: "Notification not found" }, { status: 404 });
    }
    return Response.json({ success: true });
  }

  if (action === "read-all") {
    await markAllAsRead(session.user.id);
    return Response.json({ success: true });
  }

  return Response.json({ error: "Invalid action" }, { status: 400 });
}
