import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { z } from "zod";

const tournamentUpdateSchema = z.object({
  name: z.string().min(2).max(100).optional(),
  description: z.string().max(500).optional().nullable(),
  // status removed — must use POST /api/tournaments/[id]/status for validated transitions
  regStart: z.string().datetime().optional(),
  regEnd: z.string().datetime().optional(),
  startDate: z.string().datetime().optional(),
  endDate: z.string().datetime().optional(),
  maxPlayers: z.number().int().min(2).max(512).optional(),
  prizePool: z.number().int().min(0).optional(),
});

export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      registrations: {
        include: {
          player: {
            select: {
              id: true,
              userId: true,
              ign: true,
              isGuest: true,
              rank: true,
              // S-03: Only expose phone/discord to admin
              ...(isAdmin ? { phone: true, discord: true } : {}),
            },
          },
        },
      },
      stages: {
        include: {
          groups: {
            include: {
              players: {
                include: {
                  player: {
                    select: { id: true, ign: true, isGuest: true },
                  },
                },
              },
              games: {
                include: {
                  results: {
                    include: {
                      player: { select: { id: true, ign: true } },
                    },
                  },
                },
              },
            },
          },
        },
        orderBy: { stageOrder: "asc" },
      },
      prizes: {
        include: {
          player: { select: { id: true, ign: true } },
        },
        orderBy: { rank: "asc" },
      },
      announcements: {
        orderBy: { createdAt: "desc" },
      },
      _count: {
        select: { registrations: true, stages: true },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json(tournament, {
    headers: {
      "Cache-Control": isAdmin ? "private, no-store" : "public, s-maxage=60, stale-while-revalidate",
      "Vary": "Authorization",
    },
  });
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const body = await req.json();

  // S-04: Validate and whitelist fields
  const parsed = tournamentUpdateSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || "Dữ liệu không hợp lệ" }, { status: 400 });
  }

  // Validate date ordering if dates are being updated
  const data = parsed.data;
  if (data.regStart || data.regEnd || data.startDate || data.endDate) {
    const existing = await prisma.tournament.findUnique({ where: { id }, select: { regStart: true, regEnd: true, startDate: true, endDate: true } });
    if (existing) {
      const regStart = data.regStart ? new Date(data.regStart) : existing.regStart;
      const regEnd = data.regEnd ? new Date(data.regEnd) : existing.regEnd;
      const startDate = data.startDate ? new Date(data.startDate) : existing.startDate;
      const endDate = data.endDate ? new Date(data.endDate) : existing.endDate;

      if (regStart >= regEnd) {
        return NextResponse.json({ error: "Ngày mở đăng ký phải trước ngày đóng đăng ký" }, { status: 400 });
      }
      if (regEnd > startDate) {
        return NextResponse.json({ error: "Ngày đóng đăng ký phải trước hoặc bằng ngày bắt đầu" }, { status: 400 });
      }
      if (startDate > endDate) {
        return NextResponse.json({ error: "Ngày bắt đầu phải trước ngày kết thúc" }, { status: 400 });
      }
    }
  }

  try {
    const before = await prisma.tournament.findUnique({ where: { id }, select: { name: true, status: true } });

    const tournament = await prisma.tournament.update({
      where: { id },
      data: parsed.data,
    });

    await auditLog({
      userId: session.user.id,
      action: "UPDATE_TOURNAMENT",
      entityType: "Tournament",
      entityId: id,
      before,
      after: parsed.data,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json(tournament);
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi khi cập nhật" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  try {
    const tournament = await prisma.tournament.findUnique({ where: { id }, select: { name: true, status: true } });
    if (!tournament) {
      return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
    }
    if (tournament.status !== "UPCOMING" && tournament.status !== "CANCELLED") {
      return NextResponse.json(
        { error: "Chỉ có thể xóa giải đấu sắp diễn ra hoặc đã hủy" },
        { status: 400 }
      );
    }
    await prisma.tournament.delete({ where: { id } });

    await auditLog({
      userId: session.user.id,
      action: "DELETE_TOURNAMENT",
      entityType: "Tournament",
      entityId: id,
      before: tournament,
      ip: req.headers.get("x-forwarded-for") || undefined,
    });

    return NextResponse.json({ message: "Đã xóa giải đấu" });
  } catch {
    return NextResponse.json({ error: "Đã xảy ra lỗi khi xóa" }, { status: 500 });
  }
}
