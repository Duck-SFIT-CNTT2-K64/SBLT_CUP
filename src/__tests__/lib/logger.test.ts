jest.mock("@sentry/nextjs", () => ({
  captureException: jest.fn(),
  captureMessage: jest.fn(),
}));

import * as Sentry from "@sentry/nextjs";
import { logger } from "@/lib/logger";

describe("logger", () => {
  const originalEnv = process.env.NODE_ENV;

  beforeEach(() => {
    jest.clearAllMocks();
    jest.spyOn(console, "error").mockImplementation(() => {});
    jest.spyOn(console, "warn").mockImplementation(() => {});
    jest.spyOn(console, "info").mockImplementation(() => {});
    jest.spyOn(console, "debug").mockImplementation(() => {});
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(process.env, "NODE_ENV", { value: originalEnv, writable: true });
  });

  describe("in test/development mode", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
    });

    test("error logs to console and captures exception in Sentry", () => {
      const err = new Error("test error");
      logger.error("something failed", err, { userId: "u1" });

      expect(console.error).toHaveBeenCalled();
      expect(Sentry.captureException).toHaveBeenCalledWith(err, { extra: { userId: "u1" } });
    });

    test("error without Error object does not call Sentry", () => {
      logger.error("message only");

      expect(console.error).toHaveBeenCalled();
      expect(Sentry.captureException).not.toHaveBeenCalled();
    });

    test("warn logs to console", () => {
      logger.warn("warning message", { path: "/api/test" });
      expect(console.warn).toHaveBeenCalled();
    });

    test("info logs to console", () => {
      logger.info("info message");
      expect(console.info).toHaveBeenCalled();
    });

    test("debug logs to console", () => {
      logger.debug("debug message");
      expect(console.debug).toHaveBeenCalled();
    });
  });

  describe("in production mode", () => {
    beforeEach(() => {
      Object.defineProperty(process.env, "NODE_ENV", { value: "production", writable: true });
    });

    test("error still logs", () => {
      logger.error("prod error");
      expect(console.error).toHaveBeenCalled();
    });

    test("warn still logs", () => {
      logger.warn("prod warn");
      expect(console.warn).toHaveBeenCalled();
    });

    test("info is suppressed", () => {
      logger.info("prod info");
      expect(console.info).not.toHaveBeenCalled();
    });

    test("debug is suppressed", () => {
      logger.debug("prod debug");
      expect(console.debug).not.toHaveBeenCalled();
    });
  });
});
