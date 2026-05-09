import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { addLog } from "@/lib/logging";

// =============================================================
// IN-MEMORY RATE LIMITER — Edge-compatible, không cần Redis
// =============================================================

interface RateLimitEntry {
  timestamps: number[];
}

const store = new Map<string, RateLimitEntry>();

const CLEANUP_INTERVAL_MS = 60_000;
let lastCleanup = Date.now();

function cleanupStore(now: number) {
  if (now - lastCleanup < CLEANUP_INTERVAL_MS) return;
  lastCleanup = now;
  store.forEach((entry, key) => {
    entry.timestamps = entry.timestamps.filter((t) => now - t < CLEANUP_INTERVAL_MS);
    if (entry.timestamps.length === 0) store.delete(key);
  });
}

function checkRateLimit(key: string, limit: number, windowMs: number): boolean {
  const now = Date.now();
  cleanupStore(now);

  let entry = store.get(key);
  if (!entry) {
    entry = { timestamps: [] };
    store.set(key, entry);
  }

  entry.timestamps = entry.timestamps.filter((t) => now - t < windowMs);

  if (entry.timestamps.length >= limit) {
    return false;
  }

  entry.timestamps.push(now);
  return true;
}

// =============================================================
// LOGIN BRUTE FORCE PROTECTION — Per-email lockout
// =============================================================

interface LoginAttemptEntry {
  count: number;
  lockedUntil: number;
}

const loginAttempts = new Map<string, LoginAttemptEntry>();

const MAX_LOGIN_ATTEMPTS = 5;
const LOCKOUT_DURATION_MS = 15 * 60 * 1000; // 15 minutes

function checkLoginBruteForce(email: string): { blocked: boolean; retryAfter?: number } {
  const now = Date.now();
  const key = `login:${email.toLowerCase()}`;
  const entry = loginAttempts.get(key);

  if (entry) {
    // Check if lockout has expired
    if (entry.lockedUntil > now) {
      return { blocked: true, retryAfter: Math.ceil((entry.lockedUntil - now) / 1000) };
    }
    // Reset if lockout expired
    if (entry.lockedUntil > 0 && entry.lockedUntil <= now) {
      entry.count = 0;
      entry.lockedUntil = 0;
    }
  }

  return { blocked: false };
}

function recordLoginFailure(email: string) {
  const key = `login:${email.toLowerCase()}`;
  let entry = loginAttempts.get(key);
  if (!entry) {
    entry = { count: 0, lockedUntil: 0 };
    loginAttempts.set(key, entry);
  }
  entry.count++;
  if (entry.count >= MAX_LOGIN_ATTEMPTS) {
    entry.lockedUntil = Date.now() + LOCKOUT_DURATION_MS;
  }
}

function clearLoginAttempts(email: string) {
  loginAttempts.delete(`login:${email.toLowerCase()}`);
}

// =============================================================
// CSRF PROTECTION — Origin/Referer validation
// =============================================================

function validateCsrfOrigin(request: NextRequest): boolean {
  const origin = request.headers.get("origin");
  const referer = request.headers.get("referer");

  // Get the expected origin from NEXTAUTH_URL or construct from request
  const expectedOrigin = process.env.NEXTAUTH_URL || process.env.AUTH_URL;

  if (expectedOrigin) {
    if (origin) {
      return origin === expectedOrigin;
    }
    if (referer) {
      return referer.startsWith(expectedOrigin);
    }
  }

  // If no expected origin configured, allow (dev mode)
  // If no Origin/Referer header, allow (same-origin form submissions)
  return true;
}

function getClientIp(request: NextRequest): string {
  const forwarded = request.headers.get("x-forwarded-for");
  if (forwarded) return forwarded.split(",")[0].trim();

  const realIp = request.headers.get("x-real-ip");
  if (realIp) return realIp.trim();

  return "127.0.0.1";
}

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

function csrfForbiddenResponse(): NextResponse {
  return new NextResponse(
    JSON.stringify({
      error: "Forbidden",
      message: "Request origin không được phép",
    }),
    {
      status: 403,
      headers: { "Content-Type": "application/json" },
    }
  );
}

// =============================================================
// PROXY CHÍNH (Next.js 16 — renamed from middleware)
// =============================================================

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const clientIp = getClientIp(request);
  const requestStart = Date.now();

  // Extract userId from session cookie if available
  const userId = request.headers.get("X-User-ID");

  // --- BỎ QUA các route tĩnh ---
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // --- CSRF PROTECTION: Chặn state-changing requests từ origin lạ ---
  if (
    request.method === "POST" ||
    request.method === "PUT" ||
    request.method === "DELETE" ||
    request.method === "PATCH"
  ) {
    if (pathname.startsWith("/api/") && !pathname.startsWith("/api/auth/")) {
      if (!validateCsrfOrigin(request)) {
        return csrfForbiddenResponse();
      }
    }
  }

  // --- RATE LIMIT: Login / Auth routes — 3 attempts per 15 min ---
  if (
    pathname.startsWith("/api/auth/callback") ||
    pathname.startsWith("/api/auth/register") ||
    pathname.startsWith("/api/auth/forgot-password") ||
    pathname.startsWith("/api/auth/reset-password")
  ) {
    const authKey = `auth:${clientIp}`;
    if (!checkRateLimit(authKey, 3, 15 * 60_000)) {
      return rateLimitResponse(60);
    }
  }

  // --- RATE LIMIT: Admin routes — 30 per minute ---
  if (pathname.startsWith("/api/admin")) {
    const adminKey = `admin:${clientIp}`;
    if (!checkRateLimit(adminKey, 30, 60_000)) {
      return rateLimitResponse(60);
    }
  }

  // --- RATE LIMIT: General API routes — 60 per minute ---
  if (pathname.startsWith("/api")) {
    const apiKey = `api:${clientIp}`;
    if (!checkRateLimit(apiKey, 60, 60_000)) {
      return rateLimitResponse(60);
    }
  }

  // --- RATE LIMIT: Public page routes — 100 per minute ---
  if (!pathname.startsWith("/api")) {
    const publicKey = `page:${clientIp}`;
    if (!checkRateLimit(publicKey, 100, 60_000)) {
      return rateLimitResponse(60);
    }
  }

  // --- AUTH: Các route public ---
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

  // --- AUTH: Kiểm tra session cookie ---
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  if (!sessionCookie) {
    // Log unauthenticated access attempt to protected route
    if (pathname.startsWith("/api/admin") || pathname.startsWith("/dashboard")) {
      const duration = Date.now() - requestStart;
      addLog({
        timestamp: new Date().toISOString(),
        method: request.method,
        path: pathname,
        status: 401,
        duration,
        error: "Unauthorized - No session cookie",
      });
    }

    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Log successful middleware passage for protected routes
  if (pathname.startsWith("/api/") || pathname.startsWith("/admin") || pathname.startsWith("/dashboard")) {
    const duration = Date.now() - requestStart;
    addLog({
      timestamp: new Date().toISOString(),
      method: request.method,
      path: pathname,
      status: 200,
      duration,
      userId: userId ?? undefined,
    });
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

// Export helpers for use in API routes
export { checkLoginBruteForce, recordLoginFailure, clearLoginAttempts };
