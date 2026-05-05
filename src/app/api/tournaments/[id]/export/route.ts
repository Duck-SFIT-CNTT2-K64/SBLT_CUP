import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { prisma } from "@/lib/prisma";

// S-08: Sanitize CSV cell to prevent formula injection
function csvCell(value: string | number | null | undefined): string {
  const str = String(value ?? "");
  // Prefix dangerous characters that Excel/Sheets treat as formula starters
  if (/^[=+\-@\t\r]/.test(str)) {
    return `"'${str.replace(/"/g, '""')}"`;
  }
  // Escape double quotes and wrap in quotes if contains comma/newline/quote
  if (/[",\n\r]/.test(str)) {
    return `"${str.replace(/"/g, '""')}"`;
  }
  return str;
}

// S-19/S-20: Sanitize filename for Content-Disposition header
function safeFilename(name: string): string {
  return name.replace(/[^\w\-_.]/g, "_").slice(0, 100);
}

/**
 * GET /api/tournaments/[id]/export?type=registrations|standings|results|prizes
 * Returns CSV data
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id: tournamentId } = await params;
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type") || "registrations";

  const VALID_TYPES = ["registrations", "standings", "results", "prizes"];
  if (!VALID_TYPES.includes(type)) {
    return NextResponse.json({ error: "type không hợp lệ" }, { status: 400 });
  }

  const tournament = await prisma.tournament.findUnique({ where: { id: tournamentId } });
  if (!tournament) return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });

  let csv = "";
  const filename = `${safeFilename(tournament.name)}_${type}_${new Date().toISOString().split("T")[0]}.csv`;

  if (type === "registrations") {
    const regs = await prisma.registration.findMany({
      where: { tournamentId },
      include: { player: { include: { user: { select: { email: true } } } } },
      orderBy: { registeredAt: "asc" },
    });

    csv = "STT,Tên ingame,Email,Rank,Loại,Trạng thái,Check-in,Ngày đăng ký\n";
    regs.forEach((r, i) => {
      csv += [
        i + 1,
        csvCell(r.player.ign),
        csvCell(r.player.user.email),
        csvCell(r.player.rank),
        r.player.isGuest ? "Khách mời" : "Player",
        r.status,
        r.checkedIn ? "Có" : "Không",
        new Date(r.registeredAt).toLocaleDateString("vi-VN"),
      ].join(",") + "\n";
    });
  }

  else if (type === "standings") {
    const stages = await prisma.stage.findMany({
      where: { tournamentId },
      include: {
        groups: {
          include: {
            players: {
              include: { player: true },
              orderBy: { totalPoints: "desc" },
            },
          },
        },
      },
      orderBy: { stageOrder: "asc" },
    });

    csv = "Vòng đấu,Bảng,Hạng,Tên ingame,Tổng điểm,Hạng cuối\n";
    for (const stage of stages) {
      for (const group of stage.groups) {
        const sorted = [...group.players].sort((a, b) => b.totalPoints - a.totalPoints);
        sorted.forEach((gp, i) => {
          csv += [
            csvCell(stage.name),
            csvCell(group.name),
            i + 1,
            csvCell(gp.player.ign),
            gp.totalPoints,
            gp.finalRank || "",
          ].join(",") + "\n";
        });
      }
    }
  }

  else if (type === "results") {
    const stages = await prisma.stage.findMany({
      where: { tournamentId },
      include: {
        groups: {
          include: {
            games: {
              include: {
                results: {
                  include: { player: true },
                  orderBy: { placement: "asc" },
                },
              },
              orderBy: { gameNumber: "asc" },
            },
          },
        },
      },
      orderBy: { stageOrder: "asc" },
    });

    csv = "Vòng đấu,Bảng,Game,Hạng,Tên ingame,Điểm\n";
    for (const stage of stages) {
      for (const group of stage.groups) {
        for (const game of group.games) {
          for (const result of game.results) {
            csv += [
              csvCell(stage.name),
              csvCell(group.name),
              game.gameNumber,
              result.placement,
              csvCell(result.player.ign),
              result.points,
            ].join(",") + "\n";
          }
        }
      }
    }
  }

  else if (type === "prizes") {
    const prizes = await prisma.prize.findMany({
      where: { tournamentId },
      include: { player: true },
      orderBy: { rank: "asc" },
    });

    csv = "Hạng,Mô tả,Số tiền (VNĐ),Người nhận,Đã thanh toán,Ngày thanh toán\n";
    prizes.forEach((p) => {
      csv += [
        p.rank,
        csvCell(p.description),
        p.amount,
        p.player ? csvCell(p.player.ign) : "",
        p.paid ? "Có" : "Không",
        p.paidAt ? new Date(p.paidAt).toLocaleDateString("vi-VN") : "",
      ].join(",") + "\n";
    });
  }

  else {
    return NextResponse.json({ error: "type không hợp lệ. Dùng: registrations, standings, results, prizes" }, { status: 400 });
  }

  // Add BOM for Excel UTF-8 compatibility
  const bom = "\uFEFF";
  return new NextResponse(bom + csv, {
    headers: {
      "Content-Type": "text/csv; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
