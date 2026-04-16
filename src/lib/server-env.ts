import "server-only";

import { z } from "zod";

const rawEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  AUTH_SECRET: z.string().trim().min(24),
  ADMIN_EMAILS: z.string().default(""),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MEAL_MODEL: z.string().trim().default("gpt-4.1"),
  MOCK_OPENAI_ANALYSIS: z.enum(["true", "false"]).default("false"),
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
  OPENAI_MEAL_MODEL: process.env.OPENAI_MEAL_MODEL ?? "gpt-4.1",
  MOCK_OPENAI_ANALYSIS: process.env.MOCK_OPENAI_ANALYSIS ?? "false",
});

export const serverEnv = {
  ...parsedEnv,
  hasOpenAIKey: Boolean(parsedEnv.OPENAI_API_KEY),
  useMockAnalysis:
    parsedEnv.MOCK_OPENAI_ANALYSIS === "true" || !parsedEnv.OPENAI_API_KEY,
};
