import type { DailyTargets } from "@/lib/types";

export const BIOLOGICAL_SEXES = ["MALE", "FEMALE"] as const;
export const WEIGHT_UNITS = ["KG", "LB"] as const;
export const HEIGHT_UNITS = ["CM", "IN"] as const;
export const ACTIVITY_LEVELS = [
  "SEDENTARY",
  "LIGHT",
  "MODERATE",
  "ACTIVE",
  "VERY_ACTIVE",
] as const;
export const GOAL_PHASES = ["CUT", "MAINTAIN", "BULK"] as const;
export const MACRO_PREFERENCES = ["LOWER", "STANDARD", "HIGHER"] as const;
export const SETTINGS_MODES = ["MANUAL", "GUIDED"] as const;

export type BiologicalSex = (typeof BIOLOGICAL_SEXES)[number];
export type WeightUnit = (typeof WEIGHT_UNITS)[number];
export type HeightUnit = (typeof HEIGHT_UNITS)[number];
export type ActivityLevel = (typeof ACTIVITY_LEVELS)[number];
export type GoalPhase = (typeof GOAL_PHASES)[number];
export type MacroPreference = (typeof MACRO_PREFERENCES)[number];
export type SettingsMode = (typeof SETTINGS_MODES)[number];

export type GoalPlannerProfile = {
  sex: BiologicalSex;
  ageYears: number;
  activityLevel: ActivityLevel;
  goalPhase: GoalPhase;
  weight: {
    value: number;
    unit: WeightUnit;
  };
  height: {
    value: number;
    unit: HeightUnit;
  };
  macroPreferences: {
    protein: MacroPreference;
    carbs: MacroPreference;
    fat: MacroPreference;
  };
};

export type GoalPlannerRecommendation = {
  maintenanceCalories: number;
  targetCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  proteinPerKg: number;
  dailyTargets: DailyTargets;
  rationale: string[];
};

const ACTIVITY_MULTIPLIERS: Record<ActivityLevel, number> = {
  SEDENTARY: 1.2,
  LIGHT: 1.375,
  MODERATE: 1.55,
  ACTIVE: 1.725,
  VERY_ACTIVE: 1.9,
};

const GOAL_CALORIE_MULTIPLIERS: Record<GoalPhase, number> = {
  CUT: 0.85,
  MAINTAIN: 1,
  BULK: 1.1,
};

const PROTEIN_BASE_BY_GOAL: Record<GoalPhase, number> = {
  CUT: 2.3,
  MAINTAIN: 2,
  BULK: 1.8,
};

const FAT_PERCENT_BASE_BY_GOAL: Record<GoalPhase, number> = {
  CUT: 0.27,
  MAINTAIN: 0.28,
  BULK: 0.26,
};

const PREFERENCE_SHIFT: Record<MacroPreference, number> = {
  LOWER: -1,
  STANDARD: 0,
  HIGHER: 1,
};

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function roundToNearestFive(value: number) {
  return Math.round(value / 5) * 5;
}

function clamp(value: number, min: number, max: number) {
  return Math.min(max, Math.max(min, value));
}

export function kilogramsToUnit(weightKg: number, unit: WeightUnit) {
  return unit === "LB" ? roundToSingleDecimal(weightKg * 2.2046226218) : roundToSingleDecimal(weightKg);
}

export function unitToKilograms(value: number, unit: WeightUnit) {
  return unit === "LB" ? value / 2.2046226218 : value;
}

export function centimetersToUnit(heightCm: number, unit: HeightUnit) {
  return unit === "IN" ? roundToSingleDecimal(heightCm / 2.54) : roundToSingleDecimal(heightCm);
}

export function unitToCentimeters(value: number, unit: HeightUnit) {
  return unit === "IN" ? value * 2.54 : value;
}

export function profileToMetric(profile: GoalPlannerProfile) {
  return {
    weightKg: unitToKilograms(profile.weight.value, profile.weight.unit),
    heightCm: unitToCentimeters(profile.height.value, profile.height.unit),
  };
}

export function calculateGoalRecommendation(
  profile: GoalPlannerProfile
): GoalPlannerRecommendation {
  const { weightKg, heightCm } = profileToMetric(profile);

  const sexConstant = profile.sex === "MALE" ? 5 : -161;
  const bmr = 10 * weightKg + 6.25 * heightCm - 5 * profile.ageYears + sexConstant;
  const maintenanceCalories = Math.round(bmr * ACTIVITY_MULTIPLIERS[profile.activityLevel]);
  const goalCaloriesRaw = maintenanceCalories * GOAL_CALORIE_MULTIPLIERS[profile.goalPhase];
  const calorieFloor = profile.sex === "MALE" ? 1400 : 1200;
  const targetCalories = Math.round(Math.max(calorieFloor, goalCaloriesRaw));

  const proteinPerKg = clamp(
    PROTEIN_BASE_BY_GOAL[profile.goalPhase] +
      PREFERENCE_SHIFT[profile.macroPreferences.protein] * 0.2,
    1.5,
    2.7
  );
  const proteinG = roundToNearestFive(weightKg * proteinPerKg);

  const adjustedFatPercent = clamp(
    FAT_PERCENT_BASE_BY_GOAL[profile.goalPhase] +
      PREFERENCE_SHIFT[profile.macroPreferences.fat] * 0.04 -
      PREFERENCE_SHIFT[profile.macroPreferences.carbs] * 0.03,
    0.18,
    0.4
  );

  const minimumFatG = weightKg * 0.6;
  const fatG = roundToSingleDecimal(
    Math.max(minimumFatG, (targetCalories * adjustedFatPercent) / 9)
  );
  const remainingCaloriesForCarbs = Math.max(0, targetCalories - proteinG * 4 - fatG * 9);
  const carbsG = roundToSingleDecimal(remainingCaloriesForCarbs / 4);

  const carbRangePadding = Math.max(12, Math.round(carbsG * 0.12));
  const fatRangePadding = Math.max(6, Math.round(fatG * 0.12));

  const rationale = [
    `Used the Mifflin-St Jeor formula with a ${ACTIVITY_MULTIPLIERS[profile.activityLevel]} activity multiplier to estimate maintenance calories.`,
    `Applied a ${profile.goalPhase === "CUT" ? "15%" : profile.goalPhase === "BULK" ? "10%" : "0%"} calorie adjustment for a ${profile.goalPhase.toLowerCase()} goal.`,
    `Protein was set around ${roundToSingleDecimal(proteinPerKg)} g per kg bodyweight and then nudged ${profile.macroPreferences.protein.toLowerCase()} based on the protein preference.`,
    `Carbs and fats were balanced from the remaining calories while honoring the ${profile.macroPreferences.carbs.toLowerCase()} carb and ${profile.macroPreferences.fat.toLowerCase()} fat preferences.`,
  ];

  return {
    maintenanceCalories,
    targetCalories,
    proteinG,
    carbsG,
    fatG,
    proteinPerKg: roundToSingleDecimal(proteinPerKg),
    dailyTargets: {
      calories: targetCalories,
      proteinG,
      carbsG: {
        min: Math.max(0, roundToSingleDecimal(carbsG - carbRangePadding)),
        max: roundToSingleDecimal(carbsG + carbRangePadding),
      },
      fatG: {
        min: Math.max(0, roundToSingleDecimal(fatG - fatRangePadding)),
        max: roundToSingleDecimal(fatG + fatRangePadding),
      },
    },
    rationale,
  };
}
