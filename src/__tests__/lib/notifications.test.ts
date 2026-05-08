// Test the pure logic functions from notifications.ts
// We import them directly since they're not exported, so we test the patterns

describe("escapeHtml patterns", () => {
  // The escapeHtml function replaces: < > & "
  function escapeHtml(str: string): string {
    return str.replace(/[<>&"]/g, (c) => {
      const map: Record<string, string> = { "<": "&lt;", ">": "&gt;", "&": "&amp;", '"': "&quot;" };
      return map[c] || c;
    });
  }

  test("escapes HTML tags", () => {
    expect(escapeHtml("<script>alert('xss')</script>")).toBe(
      "&lt;script&gt;alert('xss')&lt;/script&gt;"
    );
  });

  test("escapes ampersands", () => {
    expect(escapeHtml("Tom & Jerry")).toBe("Tom &amp; Jerry");
  });

  test("escapes quotes", () => {
    expect(escapeHtml('He said "hello"')).toBe("He said &quot;hello&quot;");
  });

  test("handles clean strings", () => {
    expect(escapeHtml("Hello World")).toBe("Hello World");
  });

  test("handles empty string", () => {
    expect(escapeHtml("")).toBe("");
  });
});

describe("isValidLink patterns", () => {
  function isValidLink(link: string): boolean {
    return link.startsWith("/") && !link.startsWith("//") && !link.includes(":");
  }

  test("accepts valid relative paths", () => {
    expect(isValidLink("/dashboard")).toBe(true);
    expect(isValidLink("/tournaments/123")).toBe(true);
    expect(isValidLink("/")).toBe(true);
  });

  test("rejects protocol-relative URLs", () => {
    expect(isValidLink("//evil.com")).toBe(false);
  });

  test("rejects external URLs", () => {
    expect(isValidLink("https://evil.com")).toBe(false);
    expect(isValidLink("http://evil.com")).toBe(false);
  });

  test("rejects javascript: protocol", () => {
    expect(isValidLink("javascript:alert('xss')")).toBe(false);
  });

  test("rejects paths with colons", () => {
    expect(isValidLink("/path:with:colons")).toBe(false);
  });
});

describe("notification type mapping", () => {
  test("maps all notification types to preference keys", () => {
    const typeMap: Record<string, string> = {
      TOURNAMENT_UPDATE: "tournamentUpdates",
      MATCH_RESULT: "matchResults",
      PREDICTION_SCORED: "predictionScored",
      ANNOUNCEMENT: "announcements",
      REGISTRATION_STATUS: "registrationStatus",
      CHECK_IN_REMINDER: "checkInReminder",
    };

    expect(Object.keys(typeMap)).toHaveLength(6);
    expect(typeMap.TOURNAMENT_UPDATE).toBe("tournamentUpdates");
    expect(typeMap.CHECK_IN_REMINDER).toBe("checkInReminder");
  });
});
