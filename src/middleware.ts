import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;

  // Public routes - always allow
  if (
    pathname === "/" ||
    pathname.startsWith("/auth") ||
    pathname.startsWith("/tournaments") ||
    pathname.startsWith("/rules") ||
    pathname.startsWith("/announcements") ||
    pathname.startsWith("/api") ||
    pathname.startsWith("/_next") ||
    pathname.startsWith("/favicon") ||
    pathname.includes(".")
  ) {
    return NextResponse.next();
  }

  // Check for session cookie (NextAuth v5 dùng "authjs.session-token")
  const sessionCookie =
    request.cookies.get("authjs.session-token") ||
    request.cookies.get("next-auth.session-token") ||
    request.cookies.get("__Secure-authjs.session-token") ||
    request.cookies.get("__Secure-next-auth.session-token");

  // Protected routes - require login
  if (!sessionCookie) {
    const loginUrl = new URL("/auth/login", request.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // For admin routes, we'll check role in the page/API level
  // since we can't easily decode JWT in middleware without Edge-compatible library

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
