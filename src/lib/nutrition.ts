import type { Micronutrients } from "@/lib/meal-analysis-schema";
import type {
  CutStatus,
  DailyHistorySummary,
  DailyTargets,
  MacroTotals,
  MealLogRecord,
  WeeklyTrend,
} from "@/lib/types";

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

export function sumMeals(meals: MealLogRecord[]): MacroTotals {
  return meals.reduce<MacroTotals>(
    (totals, meal) => ({
      calories: totals.calories + meal.estimatedCalories,
      proteinG: totals.proteinG + meal.proteinG,
      carbsG: totals.carbsG + meal.carbsG,
      fatG: totals.fatG + meal.fatG,
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
    }
  );
}

export function normalizeTotals(totals: MacroTotals): MacroTotals {
  return {
    calories: Math.round(totals.calories),
    proteinG: roundToSingleDecimal(totals.proteinG),
    carbsG: roundToSingleDecimal(totals.carbsG),
    fatG: roundToSingleDecimal(totals.fatG),
  };
}

export function addMicronutrientTotals(
  current: Micronutrients,
  addition: Micronutrients
): Micronutrients {
  return {
    sugarG: current.sugarG + addition.sugarG,
    fiberG: current.fiberG + addition.fiberG,
    sodiumMg: current.sodiumMg + addition.sodiumMg,
    potassiumMg: current.potassiumMg + addition.potassiumMg,
    calciumMg: current.calciumMg + addition.calciumMg,
    magnesiumMg: current.magnesiumMg + addition.magnesiumMg,
    ironMg: current.ironMg + addition.ironMg,
    zincMg: current.zincMg + addition.zincMg,
    omega3Mg: current.omega3Mg + addition.omega3Mg,
    vitaminCMg: current.vitaminCMg + addition.vitaminCMg,
    vitaminAMcg: current.vitaminAMcg + addition.vitaminAMcg,
    vitaminDMcg: current.vitaminDMcg + addition.vitaminDMcg,
    vitaminB12Mcg: current.vitaminB12Mcg + addition.vitaminB12Mcg,
  };
}

export function sumMicronutrients<T extends { micronutrients: Micronutrients }>(records: T[]) {
  return records.reduce<Micronutrients>(
    (totals, record) => addMicronutrientTotals(totals, record.micronutrients),
    {
      sugarG: 0,
      fiberG: 0,
      sodiumMg: 0,
      potassiumMg: 0,
      calciumMg: 0,
      magnesiumMg: 0,
      ironMg: 0,
      zincMg: 0,
      omega3Mg: 0,
      vitaminCMg: 0,
      vitaminAMcg: 0,
      vitaminDMcg: 0,
      vitaminB12Mcg: 0,
    }
  );
}

export function normalizeMicronutrients(totals: Micronutrients): Micronutrients {
  return {
    sugarG: roundToSingleDecimal(totals.sugarG),
    fiberG: roundToSingleDecimal(totals.fiberG),
    sodiumMg: roundToSingleDecimal(totals.sodiumMg),
    potassiumMg: roundToSingleDecimal(totals.potassiumMg),
    calciumMg: roundToSingleDecimal(totals.calciumMg),
    magnesiumMg: roundToSingleDecimal(totals.magnesiumMg),
    ironMg: roundToSingleDecimal(totals.ironMg),
    zincMg: roundToSingleDecimal(totals.zincMg),
    omega3Mg: roundToSingleDecimal(totals.omega3Mg),
    vitaminCMg: roundToSingleDecimal(totals.vitaminCMg),
    vitaminAMcg: roundToSingleDecimal(totals.vitaminAMcg),
    vitaminDMcg: roundToSingleDecimal(totals.vitaminDMcg),
    vitaminB12Mcg: roundToSingleDecimal(totals.vitaminB12Mcg),
  };
}

export function buildCutStatus(totals: MacroTotals, targets: DailyTargets): CutStatus {
  const reasons: string[] = [];
  const caloriesRemaining = targets.calories - totals.calories;
  const proteinRemaining = targets.proteinG - totals.proteinG;

  if (totals.calories > targets.calories) {
    reasons.push(`Calories are above the ${targets.calories} kcal goal.`);
  }

  if (totals.carbsG > targets.carbsG.max) {
    reasons.push(`Carbs are above the ${targets.carbsG.max} g ceiling for the day.`);
  }

  if (totals.fatG > targets.fatG.max) {
    reasons.push(`Fat is above the ${targets.fatG.max} g ceiling for the day.`);
  }

  if (proteinRemaining > 0 && caloriesRemaining <= 0) {
    reasons.push("There is no calorie room left to close the remaining protein gap.");
  }

  if (reasons.length === 0) {
    const proteinGap = Math.max(0, proteinRemaining);

    return {
      label: proteinGap <= 20 ? "Strong finish available" : "On track",
      tone: "good",
      reasons: [
        proteinGap <= 20
          ? "Calories and macros are still in range, and the remaining protein gap is manageable."
          : "Calories are inside target and your current macros still fit the rest of the day.",
      ],
    };
  }

  if (totals.calories > targets.calories) {
    return {
      label: "Over target",
      tone: "alert",
      reasons,
    };
  }

  return {
    label: "Needs attention",
    tone: "warn",
    reasons,
  };
}

export function buildDailyHistorySummary(
  date: string,
  meals: MealLogRecord[],
  targets: DailyTargets
): DailyHistorySummary {
  const totals = normalizeTotals(sumMeals(meals));

  return {
    date,
    totals,
    mealCount: meals.length,
    status: buildCutStatus(totals, targets),
  };
}

export function buildWeeklyTrend(
  summaries: DailyHistorySummary[]
): WeeklyTrend {
  const loggedDays = summaries.filter((summary) => summary.mealCount > 0);

  if (loggedDays.length === 0) {
    return {
      averageCalories: 0,
      averageProteinG: 0,
      averageCarbsG: 0,
      averageFatG: 0,
      daysLogged: 0,
      onTrackDays: 0,
      overTargetDays: 0,
    };
  }

  const aggregate = loggedDays.reduce(
    (accumulator, summary) => ({
      calories: accumulator.calories + summary.totals.calories,
      proteinG: accumulator.proteinG + summary.totals.proteinG,
      carbsG: accumulator.carbsG + summary.totals.carbsG,
      fatG: accumulator.fatG + summary.totals.fatG,
      onTrackDays:
        accumulator.onTrackDays + (summary.status.tone === "good" ? 1 : 0),
      overTargetDays:
        accumulator.overTargetDays + (summary.status.tone === "alert" ? 1 : 0),
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      onTrackDays: 0,
      overTargetDays: 0,
    }
  );

  return {
    averageCalories: Math.round(aggregate.calories / loggedDays.length),
    averageProteinG: roundToSingleDecimal(aggregate.proteinG / loggedDays.length),
    averageCarbsG: roundToSingleDecimal(aggregate.carbsG / loggedDays.length),
    averageFatG: roundToSingleDecimal(aggregate.fatG / loggedDays.length),
    daysLogged: loggedDays.length,
    onTrackDays: aggregate.onTrackDays,
    overTargetDays: aggregate.overTargetDays,
  };
}
