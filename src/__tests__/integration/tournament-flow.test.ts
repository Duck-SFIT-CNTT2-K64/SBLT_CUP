// Mock next-auth
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

// Mock env validation
jest.mock("@/lib/env", () => ({}));

// Mock rate limiter
jest.mock("@/lib/rate-limit", () => ({
  checkRateLimit: jest.fn().mockResolvedValue({ allowed: true, remaining: 99 }),
  RATE_LIMITS: {
    AUTH: { limit: 3, windowSeconds: 900 },
    API: { limit: 60, windowSeconds: 60 },
    PUBLIC: { limit: 100, windowSeconds: 60 },
    ADMIN: { limit: 30, windowSeconds: 60 },
  },
}));

// Mock prisma with chainable queries
const mockPrisma = {
  user: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  player: {
    findFirst: jest.fn(),
    findUnique: jest.fn(),
  },
  tournament: {
    findMany: jest.fn(),
    findUnique: jest.fn(),
    count: jest.fn(),
  },
  registration: {
    findUnique: jest.fn(),
    create: jest.fn(),
  },
  prediction: {
    findFirst: jest.fn(),
    create: jest.fn(),
  },
  predictionEntry: {
    create: jest.fn(),
  },
  dispute: {
    findMany: jest.fn(),
    create: jest.fn(),
    findUnique: jest.fn(),
  },
  auditLog: {
    create: jest.fn(),
  },
  $queryRaw: jest.fn(),
};

jest.mock("@/lib/prisma", () => ({
  prisma: mockPrisma,
}));

import { POST as registerPost } from "@/app/api/auth/register/route";
import { GET as tournamentsGet } from "@/app/api/tournaments/route";
import { NextRequest } from "next/server";

function createPostRequest(url: string, body: Record<string, unknown>) {
  return new NextRequest(url, {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

function createGetRequest(url: string) {
  return new NextRequest(url);
}

describe("Integration: Tournament Flow", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe("Register → List Tournaments", () => {
    it("registers a user then lists tournaments", async () => {
      // Step 1: Register
      mockPrisma.user.findUnique.mockResolvedValueOnce(null);
      mockPrisma.player.findFirst.mockResolvedValueOnce(null);
      mockPrisma.user.create.mockResolvedValueOnce({
        id: "user-1",
        email: "player@test.com",
        name: "Test Player",
        role: "PLAYER",
        player: { id: "player-1", ign: "TestIGN" },
      });

      const registerReq = createPostRequest(
        "http://localhost:3000/api/auth/register",
        {
          email: "player@test.com",
          password: "Password1",
          name: "Test Player",
          ign: "TestIGN",
        }
      );

      const registerRes = await registerPost(registerReq);
      const registerData = await registerRes.json();

      expect(registerRes.status).toBe(201);
      expect(registerData.user.email).toBe("player@test.com");

      // Step 2: List tournaments
      mockPrisma.tournament.findMany.mockResolvedValueOnce([
        {
          id: "tournament-1",
          name: "SBLT Season 1",
          season: 1,
          description: "First tournament",
          status: "REGISTRATION_OPEN",
          regStart: new Date().toISOString(),
          regEnd: new Date(Date.now() + 86400000).toISOString(),
          startDate: new Date(Date.now() + 172800000).toISOString(),
          endDate: new Date(Date.now() + 259200000).toISOString(),
          maxPlayers: 32,
          prizePool: 5000000,
          _count: { registrations: 8, stages: 3 },
        },
      ]);
      mockPrisma.tournament.count.mockResolvedValueOnce(1);

      const tournamentsReq = createGetRequest(
        "http://localhost:3000/api/tournaments"
      );
      const tournamentsRes = await tournamentsGet(tournamentsReq);
      const tournamentsData = await tournamentsRes.json();

      expect(tournamentsRes.status).toBe(200);
      expect(tournamentsData.data).toHaveLength(1);
      expect(tournamentsData.data[0].name).toBe("SBLT Season 1");
    });
  });

  describe("Tournament Registration Flow", () => {
    it("validates tournament registration prerequisites", async () => {
      // List available tournaments
      mockPrisma.tournament.findMany.mockResolvedValueOnce([
        {
          id: "tournament-1",
          name: "SBLT Season 1",
          status: "REGISTRATION_OPEN",
          maxPlayers: 32,
          _count: { registrations: 8, stages: 3 },
        },
      ]);
      mockPrisma.tournament.count.mockResolvedValueOnce(1);

      const res = await tournamentsGet(
        createGetRequest("http://localhost:3000/api/tournaments")
      );
      const data = await res.json();

      expect(data.data[0].status).toBe("REGISTRATION_OPEN");
      expect(data.data[0]._count.registrations).toBeLessThan(32);
    });
  });

  describe("Health Check", () => {
    it("returns healthy status when database is accessible", async () => {
      mockPrisma.$queryRaw
        .mockResolvedValueOnce([{ "?column?": 1 }]) // DB check
        .mockResolvedValueOnce([
          { table_name: "Prediction" },
          { table_name: "PredictionEntry" },
        ]); // Schema check

      const { GET: healthGet } = await import("@/app/api/health/route");
      const res = await healthGet();
      const data = await res.json();

      expect(res.status).toBe(200);
      expect(data.status).toBe("healthy");
      expect(data.checks.database.status).toBe("ok");
      expect(data.checks.schema.status).toBe("ok");
    });

    it("returns unhealthy when database is down", async () => {
      mockPrisma.$queryRaw.mockRejectedValueOnce(
        new Error("Connection refused")
      );

      const { GET: healthGet } = await import("@/app/api/health/route");
      const res = await healthGet();
      const data = await res.json();

      expect(res.status).toBe(503);
      expect(data.status).toBe("unhealthy");
      expect(data.checks.database.status).toBe("error");
    });
  });
});
