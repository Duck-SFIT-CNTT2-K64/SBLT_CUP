import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

const VALID_TYPES = ["GENERAL", "SCHEDULE_CHANGE", "RULE_UPDATE", "RESULT"];

function sanitizeHtml(str: string): string {
  return str.replace(/[<>&"]/g, (c) => {
    const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
    return map[c] || c;
  });
}

export async function GET() {
  const announcements = await prisma.announcement.findMany({
    include: {
      tournament: {
        select: { name: true },
      },
    },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(announcements);
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { title, content, type, tournamentId } = body;

  // H-01: Input validation
  if (!title || typeof title !== "string" || title.trim().length === 0 || title.length > 200) {
    return NextResponse.json({ error: "Tiêu đề không hợp lệ (1-200 ký tự)" }, { status: 400 });
  }
  if (!content || typeof content !== "string" || content.trim().length === 0 || content.length > 5000) {
    return NextResponse.json({ error: "Nội dung không hợp lệ (1-5000 ký tự)" }, { status: 400 });
  }
  const announcementType = type || "GENERAL";
  if (!VALID_TYPES.includes(announcementType)) {
    return NextResponse.json({ error: "Loại thông báo không hợp lệ" }, { status: 400 });
  }

  // H-02: Verify tournament exists if provided
  if (tournamentId) {
    const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
    if (!tournament) {
      return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
    }
  }

  try {
    const announcement = await prisma.announcement.create({
      data: {
        title: sanitizeHtml(title.trim()),
        content: sanitizeHtml(content.trim()),
        type: announcementType,
        tournamentId: tournamentId || null,
      },
    });

    await auditLog({
      userId: session.user.id,
      action: "CREATE_ANNOUNCEMENT",
      entityType: "Announcement",
      entityId: announcement.id,
      after: { title: announcement.title, type: announcementType },
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(announcement, { status: 201 });
  } catch {
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo thông báo" },
      { status: 500 }
    );
  }
}
