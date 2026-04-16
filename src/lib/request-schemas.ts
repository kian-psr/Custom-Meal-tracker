import { z } from "zod";

import {
  analyzedMealSchema,
  analysisSourceSchema,
  mealTypeSchema,
} from "@/lib/meal-analysis-schema";

const isoDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date/time.");

export const createMealLogSchema = z.object({
  description: z.string().trim().min(2).max(300),
  mealType: mealTypeSchema,
  analysis: analyzedMealSchema,
  analysisSource: analysisSourceSchema,
  analysisModel: z.string().trim().min(1).max(100),
  consumedAt: isoDateTimeSchema.optional(),
});

export const updateMealLogSchema = z.object({
  mealName: z.string().trim().min(1).max(80),
  description: z.string().trim().min(2).max(300),
  mealType: mealTypeSchema,
  estimatedCalories: z.coerce.number().int().min(0).max(4000),
  proteinG: z.coerce.number().min(0).max(300),
  carbsG: z.coerce.number().min(0).max(300),
  fatG: z.coerce.number().min(0).max(200),
  assumptions: z.array(z.string().trim().min(1).max(180)).min(1).max(8),
  consumedAt: isoDateTimeSchema,
});

export const updateSettingsSchema = z
  .object({
    calories: z.coerce.number().int().min(900).max(5000),
    proteinG: z.coerce.number().min(40).max(350),
    carbsMinG: z.coerce.number().min(0).max(400),
    carbsMaxG: z.coerce.number().min(0).max(500),
    fatMinG: z.coerce.number().min(0).max(250),
    fatMaxG: z.coerce.number().min(0).max(300),
  })
  .refine((value) => value.carbsMinG <= value.carbsMaxG, {
    message: "Carb minimum must be less than or equal to the maximum.",
    path: ["carbsMaxG"],
  })
  .refine((value) => value.fatMinG <= value.fatMaxG, {
    message: "Fat minimum must be less than or equal to the maximum.",
    path: ["fatMaxG"],
  });
