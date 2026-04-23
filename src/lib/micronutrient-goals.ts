import type { Micronutrients } from "@/lib/meal-analysis-schema";
import type {
  MicronutrientDailyGuideItem,
  MicronutrientDailyOverview,
  MicronutrientGoalType,
} from "@/lib/types";

type MicronutrientGuideDefinition = {
  key: keyof Micronutrients;
  label: string;
  unit: "g" | "mg" | "mcg";
  goal: number;
  goalType: MicronutrientGoalType;
};

const MICRONUTRIENT_GUIDES: MicronutrientGuideDefinition[] = [
  { key: "sugarG", label: "Sugar", unit: "g", goal: 50, goalType: "limit" },
  { key: "fiberG", label: "Fiber", unit: "g", goal: 28, goalType: "minimum" },
  { key: "sodiumMg", label: "Sodium", unit: "mg", goal: 2300, goalType: "limit" },
  { key: "potassiumMg", label: "Potassium", unit: "mg", goal: 4700, goalType: "minimum" },
  { key: "calciumMg", label: "Calcium", unit: "mg", goal: 1300, goalType: "minimum" },
  { key: "ironMg", label: "Iron", unit: "mg", goal: 18, goalType: "minimum" },
  { key: "vitaminCMg", label: "Vitamin C", unit: "mg", goal: 90, goalType: "minimum" },
  { key: "vitaminAMcg", label: "Vitamin A", unit: "mcg", goal: 900, goalType: "minimum" },
  { key: "vitaminDMcg", label: "Vitamin D", unit: "mcg", goal: 20, goalType: "minimum" },
  { key: "vitaminB12Mcg", label: "Vitamin B12", unit: "mcg", goal: 2.4, goalType: "minimum" },
];

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function buildMicronutrientDailyOverview(
  totals: Micronutrients
): MicronutrientDailyOverview {
  const items: MicronutrientDailyGuideItem[] = MICRONUTRIENT_GUIDES.map((guide) => ({
    key: guide.key,
    label: guide.label,
    unit: guide.unit,
    total: roundToSingleDecimal(totals[guide.key]),
    goal: guide.goal,
    goalType: guide.goalType,
  }));

  return {
    note:
      "These daily guides use general FDA adult Daily Values. Sugar is shown against the added-sugars guide, while the estimator tracks total sugar, so treat that row as directional.",
    items,
  };
}
