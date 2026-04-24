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
import {
  SUPPLEMENT_KEYS,
  SUPPLEMENT_UNITS,
  getSupplementDefinition,
  isSupplementUnitAllowed,
} from "@/lib/supplement-catalog";

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
const supplementKeySchema = z.enum(SUPPLEMENT_KEYS);
const supplementUnitSchema = z.enum(SUPPLEMENT_UNITS);

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

export const forgotPasswordSchema = z.object({
  email: authEmailSchema,
});

export const resetPasswordSchema = z.object({
  token: z.string().trim().min(20, "The reset link is missing a valid token."),
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

const supplementCreateBaseSchema = z.object({
  supplementKey: supplementKeySchema,
  amount: z.coerce.number().positive("Enter a dose greater than 0."),
  unit: supplementUnitSchema,
  note: z.string().trim().max(140).optional().or(z.literal("")),
  consumedAt: isoDateTimeSchema,
});

function validateSupplementAmount(
  value: z.infer<typeof supplementCreateBaseSchema>,
  context: z.RefinementCtx
) {
  if (!isSupplementUnitAllowed(value.supplementKey, value.unit)) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["unit"],
      message: `${getSupplementDefinition(value.supplementKey).label} cannot be logged in ${value.unit.toLowerCase()}.`,
    });
  }

  const unitMaximums = {
    G: 50,
    MG: 5000,
    MCG: 5000,
    IU: 50000,
  } as const;

  if (value.amount > unitMaximums[value.unit]) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ["amount"],
      message: "That dose looks unusually high for the selected unit. Double-check the value.",
    });
  }
}

export const createSupplementLogSchema = supplementCreateBaseSchema.superRefine(
  validateSupplementAmount
);

export const updateSupplementLogSchema = supplementCreateBaseSchema.superRefine(
  validateSupplementAmount
);

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
    ageYears: z.coerce
      .number()
      .int("Age should be a whole number.")
      .min(14, "Enter an age between 14 and 100.")
      .max(100, "Enter an age between 14 and 100."),
    activityLevel: activityLevelSchema,
    goalPhase: goalPhaseSchema,
    weight: z.object({
      value: z.coerce
        .number()
        .positive("Enter a weight greater than 0.")
        .max(900, "Weight looks too high. Double-check the number and unit."),
      unit: weightUnitSchema,
    }),
    height: z.object({
      value: z.coerce
        .number()
        .positive("Enter a height greater than 0.")
        .max(300, "Height looks too high. Double-check the number and unit."),
      unit: heightUnitSchema,
    }),
    macroPreferences: z.object({
      protein: macroPreferenceSchema,
      carbs: macroPreferenceSchema,
      fat: macroPreferenceSchema,
    }),
  })
  .superRefine((value, context) => {
    if (value.weight.unit === "KG" && (value.weight.value < 30 || value.weight.value > 400)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weight", "value"],
        message:
          "Weight in kilograms should usually be between 30 and 400. If you entered pounds, switch the unit to lb.",
      });
    }

    if (value.weight.unit === "LB" && (value.weight.value < 66 || value.weight.value > 900)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["weight", "value"],
        message:
          "Weight in pounds should usually be between 66 and 900. If you entered kilograms, switch the unit to kg.",
      });
    }

    if (value.height.unit === "CM" && (value.height.value < 100 || value.height.value > 260)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height", "value"],
        message:
          "Height in centimeters should usually be between 100 and 260. If you entered inches, switch the unit to in.",
      });
    }

    if (value.height.unit === "IN" && (value.height.value < 40 || value.height.value > 102)) {
      context.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["height", "value"],
        message:
          "Height in inches should usually be between 40 and 102. If you entered centimeters, switch the unit to cm.",
      });
    }
  });
