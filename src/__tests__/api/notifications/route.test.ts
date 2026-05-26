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
import { prisma } from "@/lib/prisma";
import { auth } from "@/lib/auth";
import { markAsRead, markAllAsRead } from "@/lib/notifications";

const mockPrisma = prisma as unknown as {
  notification: { findMany: jest.Mock; count: jest.Mock; update: jest.Mock; updateMany: jest.Mock };
};

describe("GET /api/notifications", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 401 for unauthenticated users", async () => {
    (auth as jest.Mock).mockResolvedValue(null);

    const req = new NextRequest("http://localhost:3000/api/notifications");
    const response = await GET(req);
    const data = await response.json();

    expect(response.status).toBe(401);
    expect(data.error).toBe("Unauthorized");
  });

  it("returns paginated notifications for authenticated users", async () => {
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    mockPrisma.notification.findMany.mockResolvedValue([
      { id: "n1", title: "Test", message: "Hello", read: false },
    ]);
    mockPrisma.notification.count.mockResolvedValue(1);

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
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (markAsRead as jest.Mock).mockResolvedValue(undefined);

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
    (auth as jest.Mock).mockResolvedValue({ user: { id: "user-1" } });
    (markAllAsRead as jest.Mock).mockResolvedValue(undefined);

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
