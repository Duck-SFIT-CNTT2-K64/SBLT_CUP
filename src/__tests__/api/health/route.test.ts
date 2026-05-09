// Mock next-auth before any imports
jest.mock("next-auth", () => ({
  __esModule: true,
  default: () => ({
    handlers: {},
    signIn: jest.fn(),
    signOut: jest.fn(),
    auth: jest.fn(),
  }),
}));

jest.mock("next-auth/providers/credentials", () => ({
  __esModule: true,
  default: () => ({}),
}));

// Mock prisma with template literal tag function
jest.mock("@/lib/prisma", () => ({
  prisma: {
    $queryRaw: jest.fn(),
  },
}));

// Mock env validation
jest.mock("@/lib/env", () => ({}));

import { GET } from "@/app/api/health/route";
import { prisma } from "@/lib/prisma";

describe("GET /api/health", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns healthy status when DB is accessible", async () => {
    // First call: SELECT 1 (db check)
    // Second call: table verification
    prisma.$queryRaw
      .mockResolvedValueOnce([{ "?column?": 1 }])
      .mockResolvedValueOnce([{ table_name: "Prediction" }, { table_name: "PredictionEntry" }]);

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.status).toBe("healthy");
    expect(data.checks.database.status).toBe("ok");
    expect(data.checks.database.latencyMs).toBeDefined();
  });

  it("returns unhealthy status when DB is down", async () => {
    prisma.$queryRaw.mockRejectedValue(new Error("Connection refused"));

    const response = await GET();
    const data = await response.json();

    expect(response.status).toBe(503);
    expect(data.status).toBe("unhealthy");
    expect(data.checks.database.status).toBe("error");
    expect(data.checks.database.error).toBe("Connection refused");
  });
});
