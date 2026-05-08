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
    notification: {
      findMany: jest.fn(),
      count: jest.fn(),
      update: jest.fn(),
      updateMany: jest.fn(),
    },
  },
}));

// Mock notifications lib
jest.mock("@/lib/notifications", () => ({
  markAsRead: jest.fn(),
  markAllAsRead: jest.fn(),
}));

// Mock auth
jest.mock("@/lib/auth", () => ({
  auth: jest.fn(),
}));

// Mock env validation
jest.mock("@/lib/env", () => ({}));

import { GET, POST } from "@/app/api/notifications/route";
import { NextRequest } from "next/server";

describe("GET /api/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    const { auth } = require("@/lib/auth");
    auth.mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/notifications");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns paginated notifications for authenticated users", async () => {
    const { auth } = require("@/lib/auth");
    const { prisma } = require("@/lib/prisma");

    auth.mockResolvedValue({ user: { id: "user-1" } });
    prisma.notification.findMany.mockResolvedValue([
      { id: "n1", title: "Test", message: "Hello", read: false },
    ]);
    prisma.notification.count.mockResolvedValue(1);

    const req = new NextRequest("http://localhost:3000/api/notifications");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.data).toHaveLength(1);
    expect(data.pagination.total).toBe(1);
  });
});

describe("POST /api/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("marks single notification as read", async () => {
    const { auth } = require("@/lib/auth");
    const { markAsRead } = require("@/lib/notifications");

    auth.mockResolvedValue({ user: { id: "user-1" } });
    markAsRead.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost:3000/api/notifications", {
      method: "POST",
      body: JSON.stringify({ action: "read", notificationId: "n1" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });

  it("marks all notifications as read", async () => {
    const { auth } = require("@/lib/auth");
    const { markAllAsRead } = require("@/lib/notifications");

    auth.mockResolvedValue({ user: { id: "user-1" } });
    markAllAsRead.mockResolvedValue(undefined);

    const req = new NextRequest("http://localhost:3000/api/notifications", {
      method: "POST",
      body: JSON.stringify({ action: "read-all" }),
      headers: { "Content-Type": "application/json" },
    });

    const response = await POST(req);
    const data = await response.json();

    expect(response.status).toBe(200);
    expect(data.success).toBe(true);
  });
});
