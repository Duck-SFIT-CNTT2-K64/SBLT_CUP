import { NextRequest, NextResponse } from "next/server";
import { auth } from "@/lib/auth";
import { readFileSync, writeFileSync, existsSync } from "fs";
import { join } from "path";

const LOCKDOWN_FILE = join(process.cwd(), ".lockdown");

function parseConfig() {
  const defaults = { enabled: false, ips: [] as string[], message: "Giải đấu đang diễn ra, vui lòng quay lại sau!" };
  try {
    if (!existsSync(LOCKDOWN_FILE)) return defaults;
    const raw = readFileSync(LOCKDOWN_FILE, "utf-8");
    const enabled = /^ENABLED=true/m.test(raw);
    const ipsMatch = raw.match(/^IPS=(.+)$/m);
    const msgMatch = raw.match(/^MESSAGE=(.+)$/m);
    return {
      enabled,
      ips: ipsMatch ? ipsMatch[1].split(",").map((s) => s.trim()).filter(Boolean) : [],
      message: msgMatch ? msgMatch[1].trim() : defaults.message,
    };
  } catch {
    return defaults;
  }
}

export async function GET() {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }
  return NextResponse.json(parseConfig());
}

export async function POST(req: NextRequest) {
  const session = await auth();
  if (!session?.user || session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { enabled, ips, message } = body;

  const lines = [
    `ENABLED=${enabled ? "true" : "false"}`,
    `IPS=${Array.isArray(ips) ? ips.join(",") : ""}`,
    `MESSAGE=${message || "Giải đấu đang diễn ra, vui lòng quay lại sau!"}`,
  ];

  try {
    writeFileSync(LOCKDOWN_FILE, lines.join("\n") + "\n", "utf-8");
    return NextResponse.json({ ok: true, ...parseConfig() });
  } catch {
    return NextResponse.json({ error: "Không thể lưu cấu hình" }, { status: 500 });
  }
}
