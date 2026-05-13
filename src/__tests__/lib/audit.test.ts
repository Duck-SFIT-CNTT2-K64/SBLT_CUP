jest.mock("@/lib/prisma", () => ({
  prisma: {
    auditLog: {
      create: jest.fn(),
    },
  },
}));

import { prisma } from "@/lib/prisma";
import { auditLog } from "@/lib/audit";

describe("auditLog", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test("creates audit log entry", async () => {
    (prisma.auditLog.create as jest.Mock).mockResolvedValueOnce({});

    await auditLog({
      userId: "u1",
      action: "UPDATE_RESULT",
      entityType: "Game",
      entityId: "g1",
      before: { score: 1 },
      after: { score: 2 },
      ip: "127.0.0.1",
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        action: "UPDATE_RESULT",
        entityType: "Game",
        entityId: "g1",
        before: { score: 1 },
        after: { score: 2 },
        ip: "127.0.0.1",
      },
    });
  });

  test("handles missing optional fields", async () => {
    (prisma.auditLog.create as jest.Mock).mockResolvedValueOnce({});

    await auditLog({
      userId: "u1",
      action: "DELETE",
      entityType: "Tournament",
      entityId: "t1",
    });

    expect(prisma.auditLog.create).toHaveBeenCalledWith({
      data: {
        userId: "u1",
        action: "DELETE",
        entityType: "Tournament",
        entityId: "t1",
        before: undefined,
        after: undefined,
        ip: undefined,
      },
    });
  });

  test("does not throw when prisma fails", async () => {
    (prisma.auditLog.create as jest.Mock).mockRejectedValueOnce(new Error("DB down"));

    await expect(
      auditLog({ userId: "u1", action: "X", entityType: "Y", entityId: "Z" })
    ).resolves.not.toThrow();

    expect(console.error).toHaveBeenCalledWith(expect.stringContaining("[AUDIT LOG ERROR]"), expect.any(Error));
  });
});
