import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

// =============================================================
// IN-MEMORY RATE LIMITER — Edge-compatible, không cần Redis
// =============================================================

interface RateLimitEntry {
  timestamps: number[]; // Mảng thời gian các request gần đây
}

const store = new Map<string, RateLimitEntry>();

// Dọn dẹp entries cũ mỗi 60 giây để tránh rò rỉ bộ nhớ
// Chạy dưới dạng interval đơn giản — mỗi request có xác suất dọn dẹp
const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupStore(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    // Xóa entry nếu không còn timestamp nào trong 60s gần nhất
    entry.timestamps = entry.timestamps.filter((t) => now - t < CLEANUP_INTERVAL_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  });
}

/**
 * Kiểm tra rate limit cho một IP cụ thể.
 * @param key    — Khóa định danh (thường là IP)
 * @param limit  — Số request tối đa trong cửa sổ thời gian
 * @param windowMs — Cửa sổ thời gian (milliseconds)
 * @returns true nếu request được phép, false nếu bị chặn
 */
function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanupStore(now);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  // Chỉ giữ lại các timestamp trong cửa sổ thời gian
  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return false; // Vượt quá giới hạn
  }

  entry.timestamps.push(now);
  return true;
}

/**
 * Lấy IP của client từ request headers.
 * Ưu tiên header từ reverse proxy (X-Forwarded-For) rồi mới đến các header khác.
 */
function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  // Fallback: dùng một giá trị cố định cho môi trường local/dev
  return "127.0.0.1";
}

/**
 * Tạo response 429 Too Many Requests kèm header Retry-After.
 */
function rateLimitResponse(retryAfterSeconds: number): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Too Many Requests",
      message: `Bạn đã gửi quá nhiều request. Vui lòng thử lại sau ${retryAfterSeconds} giây.`,
    }),
    {
      status: 429,
      headers: {
        "Content-Type": "application/json",
        "Retry-After": String(retryAfterSeconds),
        "X-RateLimit-Limit": "5",
        "X-RateLimit-Remaining": "0",
      },
    }
  );
}

// =============================================================
// MIDDLEWARE CHÍNH
// =============================================================

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);

  // --- BỎ QUA các route tĩnh, không cần rate limit ---
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- RATE LIMIT: Auth routes (register, login) — chống brute-force ---
  // Giới hạn: 1 request / 3 giây cho mỗi IP
  if (
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/callback")
  ) {
    const authKey = `auth:${clientIp}`;
    if (!checkRateLimit(authKey, 1, 3_000)) {
      return rateLimitResponse(3);
    }
  }

  // --- RATE LIMIT: Tất cả API routes — 5 request / giây cho mỗi IP ---
  if (pathname.startsWith("/api")) {
    const apiKey = `api:${clientIp}`;
    if (!checkRateLimit(apiKey, 5, 1_000)) {
      return rateLimitResponse(1);
    }
  }

  // --- AUTH: Các route tĩnh/public — cho phép truy cập tự do ---
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/tournaments") ||
    pathname.startsWith("/predictions") ||
    pathname.startsWith("/rules") ||
    pathname.startsWith("/announcements") ||
    pathname === "/api/health" ||
    pathname === "/api/tournaments" ||
    /^\/api\/tournaments\/[^/]+$/.test(pathname) ||
    pathname === "/api/leaderboard" ||
    pathname === "/api/predictions/leaderboard" ||
    /^\/api\/tournaments\/[^/]+\/predictions\/[^/]+\/leaderboard$/.test(pathname) ||
    /^\/api\/tournaments\/[^/]+\/predictions(\/[^/]+)?$/.test(pathname) ||
    pathname === "/api/announcements" ||
    /^\/api\/announcements\/[^/]+$/.test(pathname) ||
    pathname.startsWith("/api/auth")
  ) {
    return NextResponse.next();
  }

  // --- AUTH: Kiểm tra session cookie cho các route được bảo vệ ---
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
