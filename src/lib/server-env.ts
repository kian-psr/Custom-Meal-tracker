import "server-only";

import { z } from "zod";

const rawEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  AUTH_SECRET: z.string().trim().min(24),
  ADMIN_EMAILS: z.string().default(""),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MEAL_MODEL: z.string().trim().default("gpt-5.4"),
  MOCK_OPENAI_ANALYSIS: z.enum(["true", "false"]).default("false"),
  SMTP_HOST: z.string().trim().optional(),
  SMTP_PORT: z.coerce.number().int().positive().optional(),
  SMTP_SECURE: z.enum(["true", "false"]).default("false"),
  SMTP_USER: z.string().trim().optional(),
  SMTP_PASS: z.string().trim().optional(),
  SMTP_FROM: z.string().trim().optional(),
});

const defaultAuthSecret =
  process.env.NODE_ENV === "production"
    ? undefined
    : "dev-only-auth-secret-change-me-before-deploying";

const parsedEnv = rawEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
  AUTH_SECRET: process.env.AUTH_SECRET?.trim() || defaultAuthSecret,
  ADMIN_EMAILS: process.env.ADMIN_EMAILS ?? "",
  OPENAI_API_KEY: process.env.OPENAI_API_KEY?.trim() || undefined,
  OPENAI_MEAL_MODEL: process.env.OPENAI_MEAL_MODEL ?? "gpt-5.4",
  MOCK_OPENAI_ANALYSIS: process.env.MOCK_OPENAI_ANALYSIS ?? "false",
  SMTP_HOST: process.env.SMTP_HOST?.trim() || undefined,
  SMTP_PORT: process.env.SMTP_PORT ? Number(process.env.SMTP_PORT) : undefined,
  SMTP_SECURE: process.env.SMTP_SECURE ?? "false",
  SMTP_USER: process.env.SMTP_USER?.trim() || undefined,
  SMTP_PASS: process.env.SMTP_PASS?.trim() || undefined,
  SMTP_FROM: process.env.SMTP_FROM?.trim() || undefined,
});

export const serverEnv = {
  ...parsedEnv,
  hasOpenAIKey: Boolean(parsedEnv.OPENAI_API_KEY),
  hasSmtpConfig: Boolean(
    parsedEnv.SMTP_HOST &&
      parsedEnv.SMTP_PORT &&
      parsedEnv.SMTP_FROM
  ),
  useMockAnalysis:
    parsedEnv.MOCK_OPENAI_ANALYSIS === "true" || !parsedEnv.OPENAI_API_KEY,
};
