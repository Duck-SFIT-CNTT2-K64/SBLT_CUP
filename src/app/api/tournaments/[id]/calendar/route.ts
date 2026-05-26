import { resolveTournamentId } from "@/lib/tournament-resolve";
import { NextRequest, NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";

/**
 * GET /api/tournaments/[id]/calendar
 * Returns iCal (.ics) file for the tournament schedule
 */
export async function GET(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: slugOrId } = await params;
  const id = await resolveTournamentId(slugOrId);
  if (!id) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const tournament = await prisma.tournament.findUnique({
    where: { id },
    include: {
      stages: {
        orderBy: { stageOrder: "asc" },
      },
    },
  });

  if (!tournament) {
    return NextResponse.json({ error: "Không tìm thấy giải đấu" }, { status: 404 });
  }

  const BASE_URL = process.env.NEXTAUTH_URL || "https://sbltcup.com";

  const formatDate = (date: Date, timeStr?: string): string => {
    const d = new Date(date);
    if (timeStr) {
      const [h, m] = timeStr.split(":").map(Number);
      d.setHours(h, m, 0, 0);
    }
    return d.toISOString().replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  };

  const escapeIcal = (str: string) =>
    str.replace(/\\/g, "\\\\").replace(/;/g, "\\;").replace(/,/g, "\\,").replace(/\n/g, "\\n");

  let ical = [
    "BEGIN:VCALENDAR",
    "VERSION:2.0",
    "PRODID:-//SBLT CUP//Tournament Calendar//VI",
    "CALSCALE:GREGORIAN",
    "METHOD:PUBLISH",
    `X-WR-CALNAME:${escapeIcal(tournament.name)}`,
    "X-WR-TIMEZONE:Asia/Ho_Chi_Minh",
  ].join("\r\n");

  // Add tournament registration period
  ical += "\r\nBEGIN:VEVENT";
  ical += `\r\nUID:reg-${tournament.id}@sbltcup.com`;
  ical += `\r\nDTSTART;VALUE=DATE:${formatDate(tournament.regStart).slice(0, 8)}`;
  ical += `\r\nDTEND;VALUE=DATE:${formatDate(tournament.regEnd).slice(0, 8)}`;
  ical += `\r\nSUMMARY:${escapeIcal(tournament.name)} - Đăng ký`;
  ical += `\r\nDESCRIPTION:Thời gian đăng ký ${escapeIcal(tournament.name)}`;
  ical += `\r\nURL:${BASE_URL}/tournaments/${tournament.slug}`;
  ical += "\r\nEND:VEVENT";

  // Add each stage
  for (const stage of tournament.stages) {
    const startDt = formatDate(stage.date, stage.startTime);
    // Assume each stage lasts ~5 hours
    const endDate = new Date(stage.date);
    endDate.setHours(23, 0, 0, 0);
    const endDt = formatDate(endDate);

    ical += "\r\nBEGIN:VEVENT";
    ical += `\r\nUID:stage-${stage.id}@sbltcup.com`;
    ical += `\r\nDTSTART:${startDt}`;
    ical += `\r\nDTEND:${endDt}`;
    ical += `\r\nSUMMARY:${escapeIcal(tournament.name)} - ${escapeIcal(stage.name)}`;
    ical += `\r\nDESCRIPTION:${escapeIcal(stage.name)} - Bắt đầu lúc ${stage.startTime}`;
    ical += `\r\nURL:${BASE_URL}/tournaments/${tournament.slug}/brackets`;
    ical += "\r\nEND:VEVENT";
  }

  ical += "\r\nEND:VCALENDAR";

  // S-19: Sanitize filename
  const safeFilename = tournament.name.replace(/[^\w\-_.]/g, "_").slice(0, 100);
  const filename = `${safeFilename}_schedule.ics`;

  return new NextResponse(ical, {
    headers: {
      "Content-Type": "text/calendar; charset=utf-8",
      "Content-Disposition": `attachment; filename="${filename}"`,
    },
  });
}
