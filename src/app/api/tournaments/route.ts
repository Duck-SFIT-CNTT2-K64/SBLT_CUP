import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

export async function GET(req: NextRequest) {
  // Phân trang: mặc định 20 bản ghi
  const page = Math.max(1, Number(req.nextUrl.searchParams.get("page")) || 1);
  const limit = Math.min(Math.max(1, Number(req.nextUrl.searchParams.get("limit")) || 20), 100);
  const skip = (page - 1) * limit;

  const [tournaments, total] = await Promise.all([
    prisma.tournament.findMany({
      orderBy: { season: "desc" },
      take: limit,
      skip,
      // select thay vì include — chỉ lấy trường cần thiết cho list view
      select: {
        id: true,
        name: true,
        season: true,
        description: true,
        status: true,
        regStart: true,
        regEnd: true,
        startDate: true,
        endDate: true,
        maxPlayers: true,
        prizePool: true,
        _count: {
          select: {
            registrations: true,
            stages: true,
          },
        },
      },
    }),
    prisma.tournament.count(),
  ]);

  return NextResponse.json(
    {
      data: tournaments,
      pagination: {
        page,
        limit,
        total,
        totalPages: Math.ceil(total / limit),
      },
    },
    {
      headers: {
        "Cache-Control": "public, s-maxage=60, stale-while-revalidate",
      },
    }
  );
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { name, season, description, regStart, regEnd, startDate, endDate, maxPlayers, prizePool } = body;

  if (!name || typeof name !== "string" || name.trim().length < 2 || name.trim().length > 200) {
    return NextResponse.json({ error: "Tên giải đấu phải từ 2 đến 200 ký tự" }, { status: 400 });
  }
  if (season === undefined || season === null || isNaN(Number(season))) {
    return NextResponse.json({ error: "Mùa giải phải là số" }, { status: 400 });
  }
  if (description !== undefined && description !== null) {
    if (typeof description !== "string" || description.length > 2000) {
      return NextResponse.json({ error: "Mô tả không được quá 2000 ký tự" }, { status: 400 });
    }
  }
  if (maxPlayers !== undefined && maxPlayers !== null) {
    const mp = Number(maxPlayers);
    if (isNaN(mp) || mp < 2 || mp > 1024) {
      return NextResponse.json({ error: "Số lượng tuyển thủ phải từ 2 đến 1024" }, { status: 400 });
    }
  }
  if (prizePool !== undefined && prizePool !== null) {
    const pp = Number(prizePool);
    if (isNaN(pp) || pp < 0) {
      return NextResponse.json({ error: "Giải thưởng không hợp lệ" }, { status: 400 });
    }
  }

  const reg_start = new Date(regStart);
  const reg_end = new Date(regEnd);
  const start = new Date(startDate);
  const end = new Date(endDate);

  if (isNaN(reg_start.getTime()) || isNaN(reg_end.getTime()) || isNaN(start.getTime()) || isNaN(end.getTime())) {
    return NextResponse.json({ error: "Ngày không hợp lệ" }, { status: 400 });
  }
  if (reg_end <= reg_start) {
    return NextResponse.json({ error: "Ngày kết thúc đăng ký phải sau ngày bắt đầu đăng ký" }, { status: 400 });
  }
  if (start < reg_end) {
    return NextResponse.json({ error: "Ngày bắt đầu thi đấu phải sau ngày kết thúc đăng ký" }, { status: 400 });
  }
  if (end <= start) {
    return NextResponse.json({ error: "Ngày kết thúc thi đấu phải sau ngày bắt đầu thi đấu" }, { status: 400 });
  }

  try {
    const tournament = await prisma.tournament.create({
      data: {
        name,
        season: parseInt(season),
        description,
        regStart: new Date(regStart),
        regEnd: new Date(regEnd),
        startDate: new Date(startDate),
        endDate: new Date(endDate),
        maxPlayers: parseInt(maxPlayers) || 64,
        prizePool: parseInt(prizePool) || 10000000,
      },
    });

    return NextResponse.json(tournament, { status: 201 });
  } catch (error: unknown) {
    if (error instanceof Error && error.message.includes("Unique constraint")) {
      return NextResponse.json(
        { error: "Mùa giải này đã tồn tại" },
        { status: 400 }
      );
    }
    return NextResponse.json(
      { error: "Đã xảy ra lỗi khi tạo giải đấu" },
      { status: 500 }
    );
  }
}
