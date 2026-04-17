import { z } from "zod";

import {
  ACTIVITY_LEVELS,
  BIOLOGICAL_SEXES,
  GOAL_PHASES,
  HEIGHT_UNITS,
  MACRO_PREFERENCES,
  WEIGHT_UNITS,
} from "@/lib/goal-planner";
import {
  analyzedMealSchema,
  analysisSourceSchema,
  mealTypeSchema,
} from "@/lib/meal-analysis-schema";

const isoDateTimeSchema = z
  .string()
  .trim()
  .refine((value) => !Number.isNaN(new Date(value).getTime()), "Invalid date/time.");

const biologicalSexSchema = z.enum(BIOLOGICAL_SEXES);
const weightUnitSchema = z.enum(WEIGHT_UNITS);
const heightUnitSchema = z.enum(HEIGHT_UNITS);
const activityLevelSchema = z.enum(ACTIVITY_LEVELS);
const goalPhaseSchema = z.enum(GOAL_PHASES);
const macroPreferenceSchema = z.enum(MACRO_PREFERENCES);

export const authEmailSchema = z
  .string()
  .trim()
  .email("Enter a valid email address.")
  .max(120)
  .transform((value) => value.toLowerCase());

export const authPasswordSchema = z
  .string()
  .min(8, "Password must be at least 8 characters.")
  .max(120, "Password must be 120 characters or less.");

export const signUpSchema = z.object({
  name: z.string().trim().min(1).max(60).optional().or(z.literal("")),
  email: authEmailSchema,
  password: authPasswordSchema,
});

export const signInSchema = z.object({
  email: authEmailSchema,
  password: authPasswordSchema,
});

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

export const goalPlannerSchema = z
  .object({
    sex: biologicalSexSchema,
    ageYears: z.coerce.number().int().min(14).max(100),
    activityLevel: activityLevelSchema,
    goalPhase: goalPhaseSchema,
    weight: z.object({
      value: z.coerce.number().positive().max(900),
      unit: weightUnitSchema,
    }),
    height: z.object({
      value: z.coerce.number().positive().max(300),
      unit: heightUnitSchema,
    }),
    macroPreferences: z.object({
      protein: macroPreferenceSchema,
      carbs: macroPreferenceSchema,
      fat: macroPreferenceSchema,
    }),
  })
  .superRefine((value, context) => {
    if (value.weight.unit === "KG" && value.weight.value > 400) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weight", "value"],
        message: "Weight in kilograms looks too high.",
      });
    }

    if (value.weight.unit === "LB" && value.weight.value > 900) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weight", "value"],
        message: "Weight in pounds looks too high.",
      });
    }

    if (value.height.unit === "CM" && (value.height.value < 100 || value.height.value > 260)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height", "value"],
        message: "Height in centimeters should be between 100 and 260.",
      });
    }

    if (value.height.unit === "IN" && (value.height.value < 40 || value.height.value > 102)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height", "value"],
        message: "Height in inches should be between 40 and 102.",
      });
    }
  });
