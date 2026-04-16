import { z } from "zod";

export const confidenceLabelSchema = z.enum(["low", "medium", "high"]);
export const mealTypeSchema = z.enum(["BREAKFAST", "LUNCH", "DINNER", "SNACK"]);
export const analysisSourceSchema = z.enum(["openai", "mock", "seed"]);

const rawEstimatedComponentSchema = z.object({
  name: z.string().min(1).max(60),
  estimated_amount: z.string().min(1).max(80),
  calories: z.number().min(0).max(2500),
  protein_g: z.number().min(0).max(300),
  carbs_g: z.number().min(0).max(300),
  fat_g: z.number().min(0).max(200),
  notes: z.string().min(1).max(180),
});

export const rawMealAnalysisSchema = z.object({
  meal_name: z.string().min(1).max(80),
  estimated_calories: z.number().int().min(0).max(4000),
  protein_g: z.number().min(0).max(300),
  carbs_g: z.number().min(0).max(300),
  fat_g: z.number().min(0).max(200),
  confidence: z.object({
    score: z.number().min(0).max(1),
    label: confidenceLabelSchema,
  }),
  assumptions: z.array(z.string().min(1).max(180)).min(1).max(8),
  estimated_components: z.array(rawEstimatedComponentSchema).min(1).max(10),
});

const estimatedComponentSchema = z.object({
  name: z.string().min(1).max(60),
  estimatedAmount: z.string().min(1).max(80),
  calories: z.number().min(0).max(2500),
  proteinG: z.number().min(0).max(300),
  carbsG: z.number().min(0).max(300),
  fatG: z.number().min(0).max(200),
  notes: z.string().min(1).max(180),
});

export const analyzedMealSchema = z.object({
  mealName: z.string().min(1).max(80),
  estimatedCalories: z.number().int().min(0).max(4000),
  proteinG: z.number().min(0).max(300),
  carbsG: z.number().min(0).max(300),
  fatG: z.number().min(0).max(200),
  confidence: z.object({
    score: z.number().min(0).max(1),
    label: confidenceLabelSchema,
  }),
  assumptions: z.array(z.string().min(1).max(180)).min(1).max(8),
  estimatedComponents: z.array(estimatedComponentSchema).min(1).max(10),
});

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function normalizeAnalysis(raw: z.infer<typeof rawMealAnalysisSchema>) {
  return analyzedMealSchema.parse({
    mealName: raw.meal_name.trim(),
    estimatedCalories: Math.round(raw.estimated_calories),
    proteinG: roundToSingleDecimal(raw.protein_g),
    carbsG: roundToSingleDecimal(raw.carbs_g),
    fatG: roundToSingleDecimal(raw.fat_g),
    confidence: {
      score: roundToSingleDecimal(raw.confidence.score),
      label: raw.confidence.label,
    },
    assumptions: raw.assumptions.map((assumption) => assumption.trim()),
    estimatedComponents: raw.estimated_components.map((component) => ({
      name: component.name.trim(),
      estimatedAmount: component.estimated_amount.trim(),
      calories: Math.round(component.calories),
      proteinG: roundToSingleDecimal(component.protein_g),
      carbsG: roundToSingleDecimal(component.carbs_g),
      fatG: roundToSingleDecimal(component.fat_g),
      notes: component.notes.trim(),
    })),
  });
}

export const mealAnalysisJsonSchema = {
  type: "object",
  additionalProperties: false,
  properties: {
    meal_name: {
      type: "string",
      description: "A concise name for the meal as eaten.",
    },
    estimated_calories: {
      type: "integer",
      description: "Estimated total calories for the whole meal.",
    },
    protein_g: {
      type: "number",
      description: "Estimated grams of protein in the meal.",
    },
    carbs_g: {
      type: "number",
      description: "Estimated grams of carbohydrate in the meal.",
    },
    fat_g: {
      type: "number",
      description: "Estimated grams of fat in the meal.",
    },
    confidence: {
      type: "object",
      additionalProperties: false,
      properties: {
        score: {
          type: "number",
          minimum: 0,
          maximum: 1,
          description: "A confidence score between 0 and 1.",
        },
        label: {
          type: "string",
          enum: ["low", "medium", "high"],
          description: "A plain-English confidence band.",
        },
      },
      required: ["score", "label"],
    },
    assumptions: {
      type: "array",
      description:
        "Key assumptions, especially portion size, hidden fats, and ambiguity from the photo.",
      items: {
        type: "string",
      },
      minItems: 1,
      maxItems: 8,
    },
    estimated_components: {
      type: "array",
      description:
        "Main components that drove the estimate with human-readable portion assumptions.",
      minItems: 1,
      maxItems: 10,
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: {
            type: "string",
          },
          estimated_amount: {
            type: "string",
          },
          calories: {
            type: "integer",
          },
          protein_g: {
            type: "number",
          },
          carbs_g: {
            type: "number",
          },
          fat_g: {
            type: "number",
          },
          notes: {
            type: "string",
          },
        },
        required: [
          "name",
          "estimated_amount",
          "calories",
          "protein_g",
          "carbs_g",
          "fat_g",
          "notes",
        ],
      },
    },
  },
  required: [
    "meal_name",
    "estimated_calories",
    "protein_g",
    "carbs_g",
    "fat_g",
    "confidence",
    "assumptions",
    "estimated_components",
  ],
} as const;

export type MealType = z.infer<typeof mealTypeSchema>;
export type ConfidenceLabel = z.infer<typeof confidenceLabelSchema>;
export type AnalysisSource = z.infer<typeof analysisSourceSchema>;
export type AnalyzedMeal = z.infer<typeof analyzedMealSchema>;

