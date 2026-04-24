import type { BiologicalSex } from "@/lib/goal-planner";
import type { Micronutrients } from "@/lib/meal-analysis-schema";
import type {
  MicronutrientDailyGuideItem,
  MicronutrientDailyOverview,
  MicronutrientGoalType,
} from "@/lib/types";

export type MicronutrientGoalProfile = {
  sex: BiologicalSex;
  ageYears: number;
} | null;

type MicronutrientGuideDefinition = {
  key: keyof Micronutrients;
  label: string;
  unit: "g" | "mg" | "mcg";
  goal: (profile: MicronutrientGoalProfile) => number;
  goalType: MicronutrientGoalType;
};

const MICRONUTRIENT_GUIDES: MicronutrientGuideDefinition[] = [
  { key: "sugarG", label: "Sugar", unit: "g", goal: () => 50, goalType: "limit" },
  { key: "fiberG", label: "Fiber", unit: "g", goal: fiberGoal, goalType: "minimum" },
  { key: "sodiumMg", label: "Sodium", unit: "mg", goal: () => 2300, goalType: "limit" },
  { key: "potassiumMg", label: "Potassium", unit: "mg", goal: potassiumGoal, goalType: "minimum" },
  { key: "calciumMg", label: "Calcium", unit: "mg", goal: calciumGoal, goalType: "minimum" },
  { key: "magnesiumMg", label: "Magnesium", unit: "mg", goal: magnesiumGoal, goalType: "minimum" },
  { key: "ironMg", label: "Iron", unit: "mg", goal: ironGoal, goalType: "minimum" },
  { key: "zincMg", label: "Zinc", unit: "mg", goal: zincGoal, goalType: "minimum" },
  { key: "omega3Mg", label: "Omega-3", unit: "mg", goal: omega3Goal, goalType: "minimum" },
  { key: "vitaminCMg", label: "Vitamin C", unit: "mg", goal: vitaminCGoal, goalType: "minimum" },
  { key: "vitaminAMcg", label: "Vitamin A", unit: "mcg", goal: vitaminAGoal, goalType: "minimum" },
  { key: "vitaminDMcg", label: "Vitamin D", unit: "mcg", goal: vitaminDGoal, goalType: "minimum" },
  { key: "vitaminB12Mcg", label: "Vitamin B12", unit: "mcg", goal: () => 2.4, goalType: "minimum" },
];

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function hasPersonalProfile(profile: MicronutrientGoalProfile): profile is Exclude<MicronutrientGoalProfile, null> {
  return Boolean(
    profile &&
      (profile.sex === "MALE" || profile.sex === "FEMALE") &&
      Number.isFinite(profile.ageYears)
  );
}

function isFemale(profile: MicronutrientGoalProfile) {
  return hasPersonalProfile(profile) && profile.sex === "FEMALE";
}

function age(profile: MicronutrientGoalProfile) {
  return hasPersonalProfile(profile) ? profile.ageYears : 30;
}

function fiberGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 28;
  }

  if (profile.sex === "MALE") {
    return profile.ageYears > 50 ? 30 : 38;
  }

  return profile.ageYears > 50 ? 21 : 25;
}

function potassiumGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 4700;
  }

  if (profile.ageYears < 19) {
    return profile.sex === "MALE" ? 3000 : 2300;
  }

  return profile.sex === "MALE" ? 3400 : 2600;
}

function calciumGoal(profile: MicronutrientGoalProfile) {
  const years = age(profile);

  if (!hasPersonalProfile(profile)) {
    return 1300;
  }

  if (years < 19) {
    return 1300;
  }

  if (years > 70) {
    return 1200;
  }

  if (years > 50 && isFemale(profile)) {
    return 1200;
  }

  return 1000;
}

function magnesiumGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 420;
  }

  if (profile.ageYears < 19) {
    return profile.sex === "MALE" ? 410 : 360;
  }

  if (profile.sex === "MALE") {
    return profile.ageYears <= 30 ? 400 : 420;
  }

  return profile.ageYears <= 30 ? 310 : 320;
}

function ironGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 18;
  }

  if (profile.ageYears < 19) {
    return profile.sex === "MALE" ? 11 : 15;
  }

  if (profile.sex === "FEMALE" && profile.ageYears <= 50) {
    return 18;
  }

  return 8;
}

function zincGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 11;
  }

  if (profile.ageYears < 19) {
    return profile.sex === "MALE" ? 11 : 9;
  }

  return profile.sex === "MALE" ? 11 : 8;
}

function omega3Goal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 1600;
  }

  return profile.sex === "MALE" ? 1600 : 1100;
}

function vitaminCGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 90;
  }

  if (profile.ageYears < 19) {
    return profile.sex === "MALE" ? 75 : 65;
  }

  return profile.sex === "MALE" ? 90 : 75;
}

function vitaminAGoal(profile: MicronutrientGoalProfile) {
  if (!hasPersonalProfile(profile)) {
    return 900;
  }

  return profile.sex === "MALE" ? 900 : 700;
}

function vitaminDGoal(profile: MicronutrientGoalProfile) {
  return age(profile) >= 71 ? 20 : 15;
}

export function buildMicronutrientDailyOverview(
  totals: Micronutrients,
  profile: MicronutrientGoalProfile = null
): MicronutrientDailyOverview {
  const items: MicronutrientDailyGuideItem[] = MICRONUTRIENT_GUIDES.map((guide) => ({
    key: guide.key,
    label: guide.label,
    unit: guide.unit,
    total: roundToSingleDecimal(totals[guide.key]),
    goal: guide.goal(profile),
    goalType: guide.goalType,
  }));

  return {
    note: hasPersonalProfile(profile)
      ? `Daily guides are personalized from your saved sex and age profile (${profile.sex.toLowerCase()}, ${profile.ageYears}). Logged supplements are included. This does not adjust for pregnancy, lactation, or medical conditions. Sugar uses the added-sugars guide while the estimator tracks total sugar, so treat that row as directional.`
      : "Daily guides use general adult reference values until you save the goal calculator profile. Logged supplements are included too. This does not adjust for pregnancy, lactation, or medical conditions. Sugar uses the added-sugars guide while the estimator tracks total sugar, so treat that row as directional.",
    items,
  };
}
