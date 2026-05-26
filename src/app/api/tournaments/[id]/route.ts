import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";
import { z } from "zod";
import { cacheGetOrSet, CACHE_TTL } from "@/lib/cache";
import { invalidateTournament } from "@/lib/cache-invalidate";

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
  const { id: slugOrId } = await params;
  const id = await resolveTournamentId(slugOrId);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const session = await auth();
  const isAdmin = session?.user?.role === "ADMIN";

  // Admin data is not cached (always fresh)
  if (isAdmin) {
    const tournament = await prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          include: {
            player: {
              select: { id: true, userId: true, ign: true, isGuest: true, rank: true, phone: true, discord: true, user: { select: { avatar: true } } },
            },
          },
        },
        stages: {
          include: { groups: { include: { players: { include: { player: { select: { id: true, ign: true, isGuest: true } } } }, games: { include: { results: { include: { player: { select: { id: true, ign: true } } } } } } } } },
          orderBy: { stageOrder: "asc" },
        },
        prizes: { include: { player: { select: { id: true, ign: true } } }, orderBy: { rank: "asc" } },
        announcements: { orderBy: { createdAt: "desc" } },
        _count: { select: { registrations: true, stages: true } },
      },
    });
    if (!tournament) return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
    return NextResponse.json(tournament, { headers: { "Cache-Control": "private, no-store", "Vary": "Authorization" } });
  }

  const cacheKey = `tournament:${id}:public`;

  const tournament = await cacheGetOrSet(cacheKey, CACHE_TTL.MEDIUM, async () => {
    return prisma.tournament.findUnique({
      where: { id },
      include: {
        registrations: {
          where: { status: { not: "WITHDRAWN" } },
          include: {
            player: {
              select: { id: true, userId: true, ign: true, isGuest: true, rank: true, user: { select: { avatar: true } } },
            },
          },
        },
        stages: {
          include: {
            groups: {
              include: {
                players: { include: { player: { select: { id: true, ign: true, isGuest: true } } } },
                games: { include: { results: { include: { player: { select: { id: true, ign: true } } } } } },
              },
            },
          },
          orderBy: { stageOrder: "asc" },
        },
        prizes: { include: { player: { select: { id: true, ign: true } } }, orderBy: { rank: "asc" } },
        announcements: { orderBy: { createdAt: "desc" } },
        _count: {
          select: {
            registrations: { where: { status: { not: "WITHDRAWN" } } },
            stages: true,
          },
        },
      },
    });
  });

  if (!tournament) {
    return NextResponse.json({ error: "Tournament not found" }, { status: 404 });
  }

  return NextResponse.json(tournament, {
    headers: {
      "Cache-Control": `public, s-maxage=${CACHE_TTL.MEDIUM}, stale-while-revalidate`,
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

  const { id: slugOrId } = await params;
  const id = await resolveTournamentId(slugOrId);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });
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

    await invalidateTournament(id);

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

  const { id: slugOrId } = await params;
  const id = await resolveTournamentId(slugOrId);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

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

    await invalidateTournament(id);

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
