/**
 * Bug Condition Exploration Tests
 *
 * PURPOSE: Document and verify all 14 bugs in the SBLT CUP application.
 * These tests are EXPECTED TO FAIL on unfixed code — failure confirms the bugs exist.
 *
 * DO NOT attempt to fix the code when these tests fail.
 * When the fixes are applied (Tasks 3–14), these tests should all PASS.
 *
 * Validates: Requirements 1.1, 1.2, 1.3, 1.4, 1.5, 1.6, 1.7, 1.8, 1.9, 1.10, 1.11, 1.12, 1.13
 */

import * as fs from "fs";
import * as path from "path";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

const ROOT = path.resolve(__dirname, "../..");

function fileExists(relativePath: string): boolean {
  return fs.existsSync(path.join(ROOT, relativePath));
}

function readSourceFile(relativePath: string): string {
  return fs.readFileSync(path.join(ROOT, relativePath), "utf-8");
}

// ---------------------------------------------------------------------------
// Bug 1 — Middleware blocks /api/* routes (root cause)
// ---------------------------------------------------------------------------

describe("Bug 1: Middleware blocks API routes", () => {
  /**
   * Counterexample:
   *   GET /api/tournaments (no session cookie)
   *   → middleware redirects to /auth/login (returns HTML, status 200)
   *   → client receives HTML instead of JSON
   *   → SyntaxError: Unexpected token '<'
   *
   * The whitelist in src/middleware.ts only includes pathname.startsWith("/api/auth").
   * Any other /api/* path falls through to the session-cookie check and gets redirected.
   */
  it("middleware whitelist does NOT include pathname.startsWith('/api') — only /api/auth is whitelisted", () => {
    const source = readSourceFile("src/middleware.ts");

    // The BUGGY condition: only /api/auth is in the whitelist, not /api broadly
    // After the fix, pathname.startsWith("/api") should be present.
    // On unfixed code this assertion FAILS because the broader /api check is absent.
    expect(source).toContain('pathname.startsWith("/api")');
  });

  it("middleware whitelist does not block /api/tournaments (no /api/auth-only guard)", () => {
    const source = readSourceFile("src/middleware.ts");

    // On unfixed code, the only API whitelist entry is "/api/auth".
    // The fix should replace or supplement it with the broader "/api" prefix.
    // This test confirms the fix is in place by checking the broader prefix exists.
    const hasApiAuth = source.includes('pathname.startsWith("/api/auth")');
    const hasApiBroad = source.includes('pathname.startsWith("/api")');

    // After fix: hasApiBroad must be true (covers all API routes including /api/auth).
    // On unfixed code: hasApiBroad is false → test FAILS (bug confirmed).
    expect(hasApiBroad).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 2 — Registration status check uses wrong field (player.id vs player.userId)
// ---------------------------------------------------------------------------

describe("Bug 2: Registration status check compares wrong fields", () => {
  /**
   * Counterexample:
   *   user.id        = "user_xyz789"   (User table primary key)
   *   player.id      = "player_abc123" (Player table primary key — DIFFERENT table)
   *   player.userId  = "user_xyz789"   (FK back to User table — SAME as user.id)
   *
   *   Current check:  player.id === user.id  →  "player_abc123" === "user_xyz789"  → false  (BUG)
   *   Correct check:  player.userId === user.id  →  "user_xyz789" === "user_xyz789"  → true
   */

  it("player.id !== user.id for a registered user (always false — the bug is now fixed)", () => {
    // Simulate the data model relationship
    const userId = "user_xyz789";
    const player = {
      id: "player_abc123",   // Player table PK — different from userId
      userId: "user_xyz789", // FK to User table — same as userId
      ign: "TestPlayer",
    };

    // BUGGY check (old code used player.id === userId — always false)
    const buggyCheck = player.id === userId;
    // CORRECT check (fixed code uses player.userId === userId — correct)
    const correctCheck = player.userId === userId;

    // The bug: player.id never equals user.id
    expect(buggyCheck).toBe(false);
    // The fix: player.userId correctly equals user.id
    expect(correctCheck).toBe(true);
  });

  it("player.userId === user.id correctly identifies a registered user (the fix)", () => {
    const userId = "user_xyz789";
    const player = {
      id: "player_abc123",
      userId: "user_xyz789",
      ign: "TestPlayer",
    };

    // CORRECT check (what the fix should use)
    const correctCheck = player.userId === userId;

    // This is true — the fix works
    // On unfixed code the source still uses player.id, so this test documents the expected fix
    expect(correctCheck).toBe(true);
  });

  it("source code in tournaments/[id]/page.tsx uses the CORRECT field player.userId", () => {
    const source = readSourceFile("src/app/tournaments/[id]/page.tsx");

    // On unfixed code: source contains "r.player.id === session.user.id" (the bug)
    // After fix: source should contain "r.player.userId === session.user.id"
    // This test FAILS on unfixed code → confirms the bug exists in source
    expect(source).toContain("r.player.userId");
    expect(source).not.toContain("r.player.id === session.user.id");
  });
});

// ---------------------------------------------------------------------------
// Bug 3 — Admin players page always uses tournaments[0] (hardcoded index)
// ---------------------------------------------------------------------------

describe("Bug 3: Admin players page hardcodes tournaments[0]", () => {
  /**
   * Counterexample:
   *   Admin selects tournament "tournament-5" from a list of 6 tournaments.
   *   fetchRegistrations() still calls /api/tournaments/tournaments[0].id/registrations
   *   → shows registrations for tournament-1, not tournament-5.
   */

  it("source code in admin/players/page.tsx uses tournaments[0].id (hardcoded — the bug)", () => {
    const source = readSourceFile("src/app/admin/players/page.tsx");

    // On unfixed code: tournaments[0].id is used directly
    // After fix: a selectedTournamentId state variable is used instead
    // This test FAILS on unfixed code (tournaments[0] is present, selectedTournamentId is absent)
    expect(source).not.toContain("tournaments[0].id");
  });

  it("source code in admin/players/page.tsx uses selectedTournamentId state (the fix)", () => {
    const source = readSourceFile("src/app/admin/players/page.tsx");

    // After fix: selectedTournamentId state should be present
    // On unfixed code: this is absent → test FAILS → confirms bug
    expect(source).toContain("selectedTournamentId");
  });
});

// ---------------------------------------------------------------------------
// Bug 4 — Missing /admin/tournaments/[id]/edit page
// ---------------------------------------------------------------------------

describe("Bug 4: Missing /admin/tournaments/[id]/edit page", () => {
  /**
   * Counterexample:
   *   Admin clicks "Edit" button on /admin/tournaments page.
   *   Browser navigates to /admin/tournaments/some-id/edit.
   *   Next.js returns 404 — the page file does not exist.
   */

  it("edit page file does NOT exist (the bug)", () => {
    const editPagePath = "src/app/admin/tournaments/[id]/edit/page.tsx";

    // On unfixed code: file is absent → fileExists returns false
    // After fix: file exists → fileExists returns true
    // This test FAILS on unfixed code (expects true, gets false) → confirms bug
    expect(fileExists(editPagePath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 5 — Missing stage creation UI in admin tournament detail page
// ---------------------------------------------------------------------------

describe("Bug 5: Missing stage creation UI", () => {
  /**
   * Counterexample:
   *   Admin opens /admin/tournaments/[id].
   *   There is no button or form to create a new Stage.
   *   Admin can only manage Groups and Games within existing Stages.
   */

  it("admin tournament detail page source does NOT contain stage creation UI (the bug)", () => {
    const source = readSourceFile("src/app/admin/tournaments/[id]/page.tsx");

    // After fix: showCreateStage state and handleCreateStage function should be present
    // On unfixed code: these are absent → test FAILS → confirms bug
    expect(source).toContain("showCreateStage");
    expect(source).toContain("handleCreateStage");
  });
});

// ---------------------------------------------------------------------------
// Bug 6 — Game result editing shows form for LAST game, not clicked game
// ---------------------------------------------------------------------------

describe("Bug 6: Game result editing shows wrong game form", () => {
  /**
   * Counterexample:
   *   Group has 3 games: [game1, game2, game3].
   *   Admin clicks "Nhập kết quả" on game1.
   *   editingResults is set (length > 0).
   *   Condition: editingResults.length > 0 && game.id === currentGroup.games[currentGroup.games.length - 1]?.id
   *   → game.id === game3.id (last game)
   *   → form renders for game3, NOT game1 (the bug)
   */

  it("buggy condition always shows form for the LAST game, not the clicked game", () => {
    const games = [
      { id: "game1", gameNumber: 1 },
      { id: "game2", gameNumber: 2 },
      { id: "game3", gameNumber: 3 },
    ];

    const editingResults = [{ playerId: "player1", placement: 1 }]; // non-empty after clicking game1

    // Simulate clicking game1 — editingResults is set but editingGameId is NOT tracked (the bug)
    const clickedGameId = "game1";

    // BUGGY condition from current source:
    // editingResults.length > 0 && game.id === currentGroup.games[currentGroup.games.length - 1]?.id
    const lastGameId = games[games.length - 1]?.id; // "game3"

    const buggyFormShownForGame = (gameId: string) =>
      editingResults.length > 0 && gameId === lastGameId;

    // The form is shown for game3 (last), NOT game1 (clicked)
    expect(buggyFormShownForGame("game1")).toBe(false); // clicked game — form NOT shown (bug)
    expect(buggyFormShownForGame("game3")).toBe(true);  // last game — form shown (wrong)

    // After fix: editingGameId === game.id should be used
    // Simulate the fix:
    const editingGameId = clickedGameId; // set when user clicks
    const fixedFormShownForGame = (gameId: string) => editingGameId === gameId;

    expect(fixedFormShownForGame("game1")).toBe(true);  // clicked game — form shown (correct)
    expect(fixedFormShownForGame("game3")).toBe(false); // last game — form NOT shown (correct)
  });

  it("source code uses editingGameId state instead of array-length check (the fix)", () => {
    const source = readSourceFile("src/app/admin/tournaments/[id]/page.tsx");

    // After fix: editingGameId state should be present and used in the condition
    // On unfixed code: editingGameId is absent → test FAILS → confirms bug
    expect(source).toContain("editingGameId");
    expect(source).not.toContain(
      "currentGroup.games[currentGroup.games.length - 1]?.id"
    );
  });
});

// ---------------------------------------------------------------------------
// Bug 7 — Missing date validation in tournament creation form
// ---------------------------------------------------------------------------

describe("Bug 7: Missing client-side date validation in tournament creation", () => {
  /**
   * Counterexample:
   *   Admin submits form with:
   *     regStart  = "2025-12-01"
   *     regEnd    = "2025-11-01"  (before regStart — invalid)
   *   No client-side validation fires.
   *   Form submits to POST /api/tournaments with invalid dates.
   */

  it("date string comparison correctly identifies invalid date ranges", () => {
    // ISO date strings can be compared lexicographically
    const regStart = "2025-12-01";
    const regEnd = "2025-11-01"; // before regStart — invalid

    // The validation logic that SHOULD exist (but doesn't in unfixed code)
    const isInvalid = regEnd < regStart;
    expect(isInvalid).toBe(true); // confirms the validation logic is sound

    // Valid case
    const validRegEnd = "2025-12-15";
    expect(validRegEnd < regStart).toBe(false);
  });

  it("source code in admin/tournaments/new/page.tsx contains date validation (the fix)", () => {
    const source = readSourceFile("src/app/admin/tournaments/new/page.tsx");

    // After fix: validation checks should be present in handleSubmit
    // The implementation uses formData.regEnd < formData.regStart
    const hasRegEndValidation =
      source.includes("regEnd < regStart") ||
      source.includes("formData.regEnd < formData.regStart");
    expect(hasRegEndValidation).toBe(true);
  });

  it("source code validates startDate > regEnd and endDate > startDate (the fix)", () => {
    const source = readSourceFile("src/app/admin/tournaments/new/page.tsx");

    // After fix: all three date relationship checks should be present
    // On unfixed code: absent → test FAILS → confirms bug
    expect(source).toContain("startDate");
    expect(source).toContain("endDate");
    // At least one of the cross-field comparisons must be present
    const hasStartDateValidation =
      source.includes("startDate < regEnd") ||
      source.includes("formData.startDate < formData.regEnd");
    expect(hasStartDateValidation).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 8 — Missing /api/players/schedule endpoint
// ---------------------------------------------------------------------------

describe("Bug 8: Missing /api/players/schedule endpoint", () => {
  /**
   * Counterexample:
   *   Player visits /dashboard/schedule.
   *   Page calls fetch("/api/players/schedule").
   *   File src/app/api/players/schedule/route.ts does not exist.
   *   Next.js returns 404 JSON: { error: "Not Found" }
   *   Player sees empty schedule with no data.
   */

  it("API route file for /api/players/schedule does NOT exist (the bug)", () => {
    const routePath = "src/app/api/players/schedule/route.ts";

    // On unfixed code: file is absent → fileExists returns false
    // After fix: file exists → fileExists returns true
    // This test FAILS on unfixed code → confirms bug
    expect(fileExists(routePath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 9 — Missing /api/players/results endpoint
// ---------------------------------------------------------------------------

describe("Bug 9: Missing /api/players/results endpoint", () => {
  /**
   * Counterexample:
   *   Player visits /dashboard/results.
   *   Page calls fetch("/api/players/results").
   *   File src/app/api/players/results/route.ts does not exist.
   *   Next.js returns 404.
   *   Player sees empty results list.
   */

  it("API route file for /api/players/results does NOT exist (the bug)", () => {
    const routePath = "src/app/api/players/results/route.ts";

    // On unfixed code: file is absent → fileExists returns false
    // After fix: file exists → fileExists returns true
    // This test FAILS on unfixed code → confirms bug
    expect(fileExists(routePath)).toBe(true);
  });
});

// ---------------------------------------------------------------------------
// Bug 10 — Dashboard schedule page sets games = [] without API call
// ---------------------------------------------------------------------------

describe("Bug 10: Dashboard schedule page does not call API", () => {
  /**
   * Counterexample:
   *   Player visits /dashboard/schedule.
   *   fetchSchedule() runs but only executes: setGames([])
   *   No fetch("/api/players/schedule") call is made.
   *   Player always sees empty schedule regardless of their actual games.
   */

  it("source code in dashboard/schedule/page.tsx calls /api/players/schedule (the fix)", () => {
    const source = readSourceFile("src/app/dashboard/schedule/page.tsx");

    // On unfixed code: only setGames([]) with a comment — no actual fetch call
    // After fix: fetch("/api/players/schedule") should be present
    // This test FAILS on unfixed code → confirms bug
    expect(source).toContain("/api/players/schedule");
  });

  it("source code does NOT just set games to empty array without fetching (the bug)", () => {
    const source = readSourceFile("src/app/dashboard/schedule/page.tsx");

    // The buggy pattern: placeholder comment + setGames([]) with no real fetch
    const hasBuggyPlaceholder =
      source.includes("This would need a dedicated API endpoint") &&
      !source.includes("/api/players/schedule");

    // On unfixed code: hasBuggyPlaceholder is true → test FAILS → confirms bug
    expect(hasBuggyPlaceholder).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bug 11 — Dashboard results page sets results = [] without API call
// ---------------------------------------------------------------------------

describe("Bug 11: Dashboard results page does not call API", () => {
  /**
   * Counterexample:
   *   Player visits /dashboard/results.
   *   fetchResults() runs but only executes: setResults([])
   *   No fetch("/api/players/results") call is made.
   *   Player always sees empty results regardless of their actual game history.
   */

  it("source code in dashboard/results/page.tsx calls /api/players/results (the fix)", () => {
    const source = readSourceFile("src/app/dashboard/results/page.tsx");

    // On unfixed code: only setResults([]) with a comment — no actual fetch call
    // After fix: fetch("/api/players/results") should be present
    // This test FAILS on unfixed code → confirms bug
    expect(source).toContain("/api/players/results");
  });

  it("source code does NOT just set results to empty array without fetching (the bug)", () => {
    const source = readSourceFile("src/app/dashboard/results/page.tsx");

    const hasBuggyPlaceholder =
      source.includes("This would need a dedicated API endpoint") &&
      !source.includes("/api/players/results");

    // On unfixed code: hasBuggyPlaceholder is true → test FAILS → confirms bug
    expect(hasBuggyPlaceholder).toBe(false);
  });
});

// ---------------------------------------------------------------------------
// Bugs 12–14 — Missing error handling (only console.error, no UI feedback)
// ---------------------------------------------------------------------------

describe("Bugs 12–14: Missing user-facing error handling", () => {
  /**
   * Counterexample:
   *   Network goes offline. User visits /tournaments.
   *   fetchTournaments() throws a network error.
   *   catch block only calls console.error("Failed to fetch tournaments:", error).
   *   User sees a blank page with no explanation.
   *
   * Affected pages:
   *   - src/app/tournaments/page.tsx
   *   - src/app/tournaments/[id]/page.tsx
   *   - src/app/announcements/page.tsx
   *   - src/app/dashboard/schedule/page.tsx
   *   - src/app/dashboard/results/page.tsx
   *   - src/app/admin/tournaments/page.tsx
   *   - src/app/admin/players/page.tsx
   *   - src/app/admin/users/page.tsx
   *   - src/app/admin/announcements/page.tsx
   *   - src/app/dashboard/profile/page.tsx
   */

  const pagesRequiringErrorHandling = [
    "src/app/tournaments/page.tsx",
    "src/app/tournaments/[id]/page.tsx",
    "src/app/announcements/page.tsx",
    "src/app/dashboard/schedule/page.tsx",
    "src/app/dashboard/results/page.tsx",
  ];

  for (const pagePath of pagesRequiringErrorHandling) {
    it(`${pagePath} has error state and displays error to user (the fix)`, () => {
      const source = readSourceFile(pagePath);

      // After fix: error state and user-visible error message should be present
      // On unfixed code: only console.error is present → test FAILS → confirms bug
      const hasErrorState =
        source.includes("useState<string | null>(null)") ||
        source.includes('useState("")') ||
        source.includes("setError(");

      // The fix requires setError to be called in the catch block
      expect(hasErrorState).toBe(true);
    });
  }

  it("tournaments/[id]/page.tsx catch block only uses console.error — no UI error (the bug)", () => {
    const source = readSourceFile("src/app/tournaments/[id]/page.tsx");

    // On unfixed code: catch block only has console.error, no setError call
    // After fix: setError is called in the catch block
    // This test FAILS on unfixed code → confirms bug
    expect(source).toContain("setError(");
  });

  it("dashboard/schedule/page.tsx catch block only uses console.error — no UI error (the bug)", () => {
    const source = readSourceFile("src/app/dashboard/schedule/page.tsx");

    // On unfixed code: catch block only has console.error, no setError call
    // After fix: setError is called in the catch block
    // This test FAILS on unfixed code → confirms bug
    expect(source).toContain("setError(");
  });

  it("dashboard/results/page.tsx catch block only uses console.error — no UI error (the bug)", () => {
    const source = readSourceFile("src/app/dashboard/results/page.tsx");

    // On unfixed code: catch block only has console.error, no setError call
    // After fix: setError is called in the catch block
    // This test FAILS on unfixed code → confirms bug
    expect(source).toContain("setError(");
  });
});
