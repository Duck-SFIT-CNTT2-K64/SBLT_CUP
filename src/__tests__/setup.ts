import "@testing-library/jest-dom/jest-globals";

// Mock Sentry globally
jest.mock("@sentry/nextjs", () => ({
  init: jest.fn(),
  captureException: jest.fn(),
  captureMessage: jest.fn(),
  withScope: jest.fn((cb) => cb({ setTag: jest.fn(), setExtra: jest.fn() })),
  setTag: jest.fn(),
  setExtra: jest.fn(),
}));

// Mock fetch globally
global.fetch = jest.fn().mockResolvedValue({
  ok: true,
  status: 200,
  json: jest.fn().mockResolvedValue({}),
  text: jest.fn().mockResolvedValue(""),
  headers: new Headers(),
});

// Mock console methods to reduce noise in test output
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Default process.env for tests
Object.defineProperty(process.env, "NODE_ENV", { value: "test", writable: true });
process.env.NEXTAUTH_URL = "http://localhost:3000";
process.env.ADMIN_EMAILS = "admin@test.com";
