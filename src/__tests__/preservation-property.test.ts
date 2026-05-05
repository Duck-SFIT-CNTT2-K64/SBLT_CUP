/**
 * Preservation Property Tests
 *
 * PURPOSE: Verify that existing correct behaviors are PRESERVED after the bugfix is applied.
 * These tests PASS on UNFIXED code — they document the baseline behavior that must not regress.
 *
 * Validates: Requirements 3.1, 3.2, 3.3, 3.4, 3.5, 3.12
 */

import * as fs from "fs";
import * as path from "path";

const ROOT = path.resolve(__dirname, "../..");

function readSourceFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// Preservation 1 — Protected page routes still redirect unauthenticated users
// ---------------------------------------------------------------------------

describe("Preservation 1: Protected page routes redirect unauthenticated users", () => {
  it("middleware contains session cookie check for protected routes", () => {
    const source = readSourceFile("src/middleware.ts");

    // The session cookie check must remain intact after the fix
    expect(source).toContain("next-auth.session-token");
    expect(source).toContain("__Secure-next-auth.session-token");
  });

  it("middleware redirects to /auth/login with callbackUrl for unauthenticated requests", () => {
    const source = readSourceFile("src/middleware.ts");

    // The redirect logic must remain intact
    expect(source).toContain("/auth/login");
    expect(source).toContain("callbackUrl");
    expect(source).toContain("NextResponse.redirect");
  });

  it("middleware still protects /dashboard routes (not in public whitelist)", () => {
    const source = readSourceFile("src/middleware.ts");

    // /dashboard must NOT be in the public routes whitelist
    // (it should fall through to the session cookie check)
    expect(source).not.toContain('pathname.startsWith("/dashboard")');
  });

  it("middleware still protects /admin routes (not in public whitelist)", () => {
    const source = readSourceFile("src/middleware.ts");

    // /admin must NOT be in the public routes whitelist
    expect(source).not.toContain('pathname.startsWith("/admin")');
  });
});

// ---------------------------------------------------------------------------
// Preservation 2 — NextAuth routes (/api/auth/*) pass through without interference
// ---------------------------------------------------------------------------

describe("Preservation 2: NextAuth /api/auth/* routes pass through middleware", () => {
  it("middleware whitelist includes /api/auth routes", () => {
    const source = readSourceFile("src/middleware.ts");

    // /api/auth must remain accessible — NextAuth needs these routes
    // After the fix, this is covered by the broader /api check,
    // but the behavior (passing through) must be preserved.
    const hasApiAuth = source.includes('pathname.startsWith("/api/auth")');
    const hasApiBroad = source.includes('pathname.startsWith("/api")');

    // Either the specific /api/auth check OR the broader /api check must be present
    expect(hasApiAuth || hasApiBroad).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Preservation 3 — Public page routes remain accessible without authentication
// ---------------------------------------------------------------------------

describe("Preservation 3: Public page routes accessible without authentication", () => {
  const publicRoutes = [
    { path: '"/auth"', label: "/auth routes" },
    { path: '"/tournaments"', label: "/tournaments routes" },
    { path: '"/rules"', label: "/rules routes" },
    { path: '"/announcements"', label: "/announcements routes" },
  ];

  for (const route of publicRoutes) {
    it(`middleware whitelist includes ${route.label}`, () => {
      const source = readSourceFile("src/middleware.ts");
      expect(source).toContain(route.path);
    });
  }

  it("middleware whitelist includes root path /", () => {
    const source = readSourceFile("src/middleware.ts");
    expect(source).toContain('pathname === "/"');
  });
});

// ---------------------------------------------------------------------------
// Preservation 4 — Static assets pass through without authentication
// ---------------------------------------------------------------------------

describe("Preservation 4: Static assets pass through without auth checks", () => {
  it("middleware whitelist includes /_next routes", () => {
    const source = readSourceFile("src/middleware.ts");
    expect(source).toContain('pathname.startsWith("/_next")');
  });

  it("middleware whitelist includes /favicon routes", () => {
    const source = readSourceFile("src/middleware.ts");
    expect(source).toContain('pathname.startsWith("/favicon")');
  });

  it("middleware whitelist includes files with extensions (pathname.includes('.'))", () => {
    const source = readSourceFile("src/middleware.ts");
    expect(source).toContain('pathname.includes(".")');
  });
});

// ---------------------------------------------------------------------------
// Preservation 5 — API handlers manage their own authentication via auth()
// ---------------------------------------------------------------------------

describe("Preservation 5: API handlers use auth() for internal authentication", () => {
  it("POST /api/tournaments requires ADMIN role via auth()", () => {
    const source = readSourceFile("src/app/api/tournaments/route.ts");

    // The API handler must still check auth internally
    expect(source).toContain("auth()");
    expect(source).toContain("ADMIN");
    expect(source).toContain("Unauthorized");
  });

  it("GET /api/tournaments is publicly accessible (no auth check on GET)", () => {
    const source = readSourceFile("src/app/api/tournaments/route.ts");

    // GET should not require auth — it's a public endpoint
    // The GET function should not call auth()
    const getFunction = source.match(/export async function GET[\s\S]*?(?=export async function|$)/)?.[0] || "";
    expect(getFunction).not.toContain("auth()");
  });

  it("POST /api/tournaments/[id]/register requires user session via auth()", () => {
    const source = readSourceFile("src/app/api/tournaments/[id]/register/route.ts");

    // Registration requires a logged-in user
    expect(source).toContain("auth()");
    expect(source).toContain("Unauthorized");
    expect(source).toContain("status: 401");
  });

  it("registration API returns 201 on success (not a redirect)", () => {
    const source = readSourceFile("src/app/api/tournaments/[id]/register/route.ts");

    // API handlers must return JSON, not HTML redirects
    expect(source).toContain("status: 201");
    expect(source).toContain("NextResponse.json");
    expect(source).not.toContain("NextResponse.redirect");
  });
});

// ---------------------------------------------------------------------------
// Preservation 6 — Middleware config matcher excludes static files
// ---------------------------------------------------------------------------

describe("Preservation 6: Middleware config matcher excludes static assets", () => {
  it("middleware config matcher excludes _next/static and _next/image", () => {
    const source = readSourceFile("src/middleware.ts");

    // The matcher config must exclude static assets at the Next.js level
    expect(source).toContain("_next/static");
    expect(source).toContain("_next/image");
    expect(source).toContain("favicon.ico");
  });
});
