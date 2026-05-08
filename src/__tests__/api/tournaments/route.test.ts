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

// Mock prisma
jest.mock("@/lib/prisma", () => ({
  prisma: {
    tournament: {
      findMany: jest.fn(),
      count: jest.fn(),
    },
  },
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock env validation
jest.mock("@/lib/env", () => ({}));

// Mock next/cache
jest.mock("next/cache", () => ({
  revalidatePath: jest.fn(),
}));

import { GET } from "@/app/api/tournaments/route";
import { NextRequest } from "next/server";

describe("GET /api/tournaments", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns paginated tournaments", async () => {
    const { prisma } = require("@/lib/prisma");
    const mockTournaments = [
      { id: "1", name: "SBLT CUP Mua 1", season: 1, status: "COMPLETED" },
      { id: "2", name: "SBLT CUP Mua 2", season: 2, status: "REGISTRATION_OPEN" },
    ];
    prisma.tournament.findMany.mockResolvedValue(mockTournaments);
    prisma.tournament.count.mockResolvedValue(2);

    const req = new NextRequest("http://localhost:3000/api/tournaments");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(2);
    expect(data.pagination.total).toBe(2);
    expect(data.pagination.page).toBe(1);
  });

  it("handles pagination parameters", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.tournament.findMany.mockResolvedValue([]);
    prisma.tournament.count.mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/tournaments?page=2&limit=5");
    await GET(req);

    expect(prisma.tournament.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        skip: 5,
        take: 5,
      })
    );
  });

  it("caps limit at 100", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.tournament.findMany.mockResolvedValue([]);
    prisma.tournament.count.mockResolvedValue(0);

    const req = new NextRequest("http://localhost:3000/api/tournaments?limit=500");
    await GET(req);

    expect(prisma.tournament.findMany).toHaveBeenCalledWith(
      expect.objectContaining({
        take: 100,
      })
    );
  });
});
