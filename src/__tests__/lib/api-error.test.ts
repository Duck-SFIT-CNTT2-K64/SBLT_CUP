import { apiError, handleApiError } from "@/lib/api-error";

// Mock NextResponse
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number }) => ({
      body,
      status: init?.status || 200,
    }),
  },
}));

describe("apiError", () => {
  test("returns correct JSON shape", () => {
    const result = apiError("Test error", 400);
    expect(result.body).toEqual({ error: "Test error" });
    expect(result.status).toBe(400);
  });

  test("includes code when provided", () => {
    const result = apiError("Test error", 400, "TEST_CODE");
    expect(result.body).toEqual({ error: "Test error", code: "TEST_CODE" });
  });

  test("omits code when not provided", () => {
    const result = apiError("Test error", 500);
    expect(result.body).not.toHaveProperty("code");
  });
});

describe("handleApiError", () => {
  test("handles P2025 (not found)", () => {
    const err = { code: "P2025", message: "Record not found" };
    const result = handleApiError(err);
    expect(result.status).toBe(404);
    expect(result.body).toHaveProperty("code", "NOT_FOUND");
  });

  test("handles P2002 (duplicate)", () => {
    const err = { code: "P2002", message: "Unique constraint failed" };
    const result = handleApiError(err);
    expect(result.status).toBe(409);
    expect(result.body).toHaveProperty("code", "DUPLICATE");
  });

  test("handles unknown Prisma errors", () => {
    const err = { code: "P9999", message: "Unknown Prisma error" };
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = handleApiError(err);
    expect(result.status).toBe(500);
    expect(result.body).toHaveProperty("code", "DATABASE_ERROR");
    consoleSpy.mockRestore();
  });

  test("handles non-Prisma errors", () => {
    const consoleSpy = jest.spyOn(console, "error").mockImplementation();
    const result = handleApiError(new Error("Generic error"));
    expect(result.status).toBe(500);
    expect(result.body).toHaveProperty("code", "INTERNAL_ERROR");
    consoleSpy.mockRestore();
  });
});
