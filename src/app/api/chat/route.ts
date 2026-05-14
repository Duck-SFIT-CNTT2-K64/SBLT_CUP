import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { checkRateLimit } from "@/lib/rate-limit";
import { sseManager } from "@/lib/sse";

const MAX_CONTENT_LENGTH = 200;
const MESSAGES_LIMIT = 50;
const RATE_LIMIT = { limit: 5, windowSeconds: 60 };

function sanitizeHtml(str: string): string {
  return str
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#x27;");
}

export async function GET() {
  // Lấy 50 tin nhắn MỚI NHẤT (desc), rồi đảo lại để hiển thị cũ → mới
  const messages = await prisma.comment.findMany({
    where: { type: "GLOBAL_CHAT", entityId: "global" },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
    orderBy: { createdAt: "desc" },
    take: MESSAGES_LIMIT,
  });

  return NextResponse.json(messages.reverse(), {
    headers: { "Cache-Control": "no-store" },
  });
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Vui lòng đăng nhập để gửi tin nhắn" }, { status: 401 });
  }

  // Rate limiting
  const rateLimitResult = await checkRateLimit({
    key: `chat:user:${session.user.id}`,
    limit: RATE_LIMIT.limit,
    windowSeconds: RATE_LIMIT.windowSeconds,
  });

  if (!rateLimitResult.allowed) {
    return NextResponse.json(
      { error: `Bạn đã gửi quá nhiều tin nhắn. Vui lòng thử lại sau ${rateLimitResult.retryAfterSeconds} giây.` },
      {
        status: 429,
        headers: {
          "Retry-After": String(rateLimitResult.retryAfterSeconds),
          "X-RateLimit-Limit": String(RATE_LIMIT.limit),
          "X-RateLimit-Remaining": "0",
        },
      }
    );
  }

  // Validate content
  const body = await req.json();
  const { content } = body;

  if (!content || typeof content !== "string" || content.trim().length === 0) {
    return NextResponse.json({ error: "Nội dung không được để trống" }, { status: 400 });
  }

  if (content.trim().length > MAX_CONTENT_LENGTH) {
    return NextResponse.json({ error: `Nội dung tối đa ${MAX_CONTENT_LENGTH} ký tự` }, { status: 400 });
  }

  // Create message
  const message = await prisma.comment.create({
    data: {
      userId: session.user.id,
      type: "GLOBAL_CHAT",
      entityId: "global",
      content: sanitizeHtml(content.trim()),
    },
    include: {
      user: { select: { id: true, name: true, avatar: true, role: true } },
    },
  });

  // Broadcast to all SSE clients
  sseManager.broadcastToAll("GLOBAL_CHAT", message);

  return NextResponse.json(message, {
    status: 201,
    headers: {
      "X-RateLimit-Limit": String(RATE_LIMIT.limit),
      "X-RateLimit-Remaining": String(rateLimitResult.remaining),
    },
  });
}
