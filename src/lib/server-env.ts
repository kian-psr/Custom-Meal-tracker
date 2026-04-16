import "server-only";

import { z } from "zod";

const rawEnvSchema = z.object({
  DATABASE_URL: z.string().trim().min(1),
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_MEAL_MODEL: z.string().trim().default("gpt-4.1"),
  MOCK_OPENAI_ANALYSIS: z.enum(["true", "false"]).default("false"),
});

const parsedEnv = rawEnvSchema.parse({
  DATABASE_URL: process.env.DATABASE_URL ?? "file:./dev.db",
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

