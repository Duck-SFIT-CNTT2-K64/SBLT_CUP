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
    user: {
      findUnique: jest.fn(),
      create: jest.fn(),
    },
    player: {
      findFirst: jest.fn(),
    },
  },
}));

// Mock env validation
jest.mock("@/lib/env", () => ({}));

import { POST } from "@/app/api/auth/register/route";
import { NextRequest } from "next/server";

function createRequest(body: Record<string, unknown>) {
  return new NextRequest("http://localhost:3000/api/auth/register", {
    method: "POST",
    body: JSON.stringify(body),
    headers: { "Content-Type": "application/json" },
  });
}

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("registers a new user successfully", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.player.findFirst.mockResolvedValue(null);
    prisma.user.create.mockResolvedValue({
      id: "user-1",
      email: "test@example.com",
      name: "Test User",
      role: "PLAYER",
      player: { id: "player-1", ign: "TestIGN" },
    });

    const req = createRequest({
      email: "test@example.com",
      password: "Password1",
      name: "Test User",
      ign: "TestIGN",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(201);
    expect(data.message).toBe("Đăng ký thành công");
    expect(data.user.email).toBe("test@example.com");
  });

  it("rejects duplicate email", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.user.findUnique.mockResolvedValue({ id: "existing" });

    const req = createRequest({
      email: "existing@example.com",
      password: "Password1",
      name: "Test User",
      ign: "TestIGN",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Email đã được sử dụng");
  });

  it("rejects duplicate IGN", async () => {
    const { prisma } = require("@/lib/prisma");
    prisma.user.findUnique.mockResolvedValue(null);
    prisma.player.findFirst.mockResolvedValue({ id: "existing-player" });

    const req = createRequest({
      email: "new@example.com",
      password: "Password1",
      name: "Test User",
      ign: "ExistingIGN",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toBe("Tên ingame đã được sử dụng");
  });

  it("rejects weak password (no uppercase)", async () => {
    const req = createRequest({
      email: "test@example.com",
      password: "password1",
      name: "Test User",
      ign: "TestIGN",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("chữ hoa");
  });

  it("rejects weak password (no digit)", async () => {
    const req = createRequest({
      email: "test@example.com",
      password: "Password",
      name: "Test User",
      ign: "TestIGN",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("chữ số");
  });

  it("rejects invalid email", async () => {
    const req = createRequest({
      email: "not-an-email",
      password: "Password1",
      name: "Test User",
      ign: "TestIGN",
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(400);
    expect(data.error).toContain("Email");
  });
});
