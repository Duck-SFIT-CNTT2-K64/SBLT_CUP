import { z } from "zod";

const envSchema = z.object({
  DATABASE_URL: z.string().url("DATABASE_URL must be a valid URL"),
  NEXTAUTH_SECRET: z.string().min(32, "NEXTAUTH_SECRET must be at least 32 characters"),
  NEXTAUTH_URL: z.string().url("NEXTAUTH_URL must be a valid URL"),
  ADMIN_EMAILS: z
    .string()
    .min(1, "ADMIN_EMAILS is required")
    .refine(
      (val) => {
        const emails = val.split(",").map((e) => e.trim());
        return emails.every((e) => z.string().email().safeParse(e).success);
      },
      "ADMIN_EMAILS must contain valid comma-separated email addresses"
    ),
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  AUTH_TRUST_HOST: z.string().optional().default("true"),

  // Optional — features degrade gracefully if missing
  SMTP_HOST: z.string().optional(),
  SMTP_PORT: z.string().optional(),
  SMTP_USER: z.string().optional(),
  SMTP_PASS: z.string().optional(),
  NEXT_PUBLIC_VAPID_PUBLIC_KEY: z.string().optional(),
  VAPID_PRIVATE_KEY: z.string().optional(),
  VAPID_SUBJECT: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  REDIS_URL: z.string().optional(),
  GOOGLE_CLIENT_ID: z.string().optional(),
  GOOGLE_CLIENT_SECRET: z.string().optional(),
});

export function validateEnv() {
  const parsed = envSchema.safeParse(process.env);
  if (!parsed.success) {
    const errors = parsed.error.issues
      .map((issue) => `  - ${issue.path.join(".")}: ${issue.message}`)
      .join("\n");
    throw new Error(`Environment variable validation failed:\n${errors}`);
  }
  return parsed.data;
}

// Lazy — validates on first access, not at import time (avoids build-time crashes)
let _env: ReturnType<typeof validateEnv> | null = null;

export function getEnv() {
  if (!_env) {
    _env = validateEnv();
  }
  return _env;
}
