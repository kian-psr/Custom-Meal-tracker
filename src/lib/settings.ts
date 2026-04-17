import type { UserSettings } from "@prisma/client";

import {
  calculateGoalRecommendation,
  centimetersToUnit,
  kilogramsToUnit,
  profileToMetric,
  type GoalPlannerProfile,
} from "@/lib/goal-planner";
import { prisma } from "@/lib/prisma";
import { DEFAULT_DAILY_TARGETS } from "@/lib/targets";
import type { DailyTargets, StoredGoalPlannerProfile, UserSettingsRecord } from "@/lib/types";

function mapTargets(record: UserSettings): DailyTargets {
  return {
    calories: record.dailyCalories,
    proteinG: record.proteinTargetG,
    carbsG: {
      min: record.carbTargetMinG,
      max: record.carbTargetMaxG,
    },
    fatG: {
      min: record.fatTargetMinG,
      max: record.fatTargetMaxG,
    },
  };
}

function mapSettingsRecord(record: UserSettings): UserSettingsRecord {
  const planner = mapGoalPlannerRecord(record);

  return {
    id: record.id,
    targets: mapTargets(record),
    mode: record.targetMode,
    planner,
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

function mapGoalPlannerRecord(record: UserSettings) {
  if (
    !record.goalSex ||
    !record.ageYears ||
    !record.activityLevel ||
    !record.goalPhase ||
    !record.weightUnit ||
    record.weightKg == null ||
    !record.heightUnit ||
    record.heightCm == null ||
    !record.proteinPreference ||
    !record.carbPreference ||
    !record.fatPreference
  ) {
    return null;
  }

  const profile: StoredGoalPlannerProfile = {
    sex: record.goalSex,
    ageYears: record.ageYears,
    activityLevel: record.activityLevel,
    goalPhase: record.goalPhase,
    weight: {
      value: kilogramsToUnit(record.weightKg, record.weightUnit),
      unit: record.weightUnit,
    },
    height: {
      value: centimetersToUnit(record.heightCm, record.heightUnit),
      unit: record.heightUnit,
    },
    macroPreferences: {
      protein: record.proteinPreference,
      carbs: record.carbPreference,
      fat: record.fatPreference,
    },
    metricValues: {
      weightKg: record.weightKg,
      heightCm: record.heightCm,
    },
  };

  return {
    mode: record.targetMode,
    profile,
    recommendation: calculateGoalRecommendation(profile),
  };
}

export async function getOrCreateUserSettings(userId: string): Promise<UserSettingsRecord> {
  const record = await prisma.userSettings.upsert({
    where: { userId },
    update: {},
    create: {
      userId,
      targetMode: "MANUAL",
      dailyCalories: DEFAULT_DAILY_TARGETS.calories,
      proteinTargetG: DEFAULT_DAILY_TARGETS.proteinG,
      carbTargetMinG: DEFAULT_DAILY_TARGETS.carbsG.min,
      carbTargetMaxG: DEFAULT_DAILY_TARGETS.carbsG.max,
      fatTargetMinG: DEFAULT_DAILY_TARGETS.fatG.min,
      fatTargetMaxG: DEFAULT_DAILY_TARGETS.fatG.max,
    },
  });

  return mapSettingsRecord(record);
}

export async function updateUserSettings(
  userId: string,
  targets: DailyTargets
): Promise<UserSettingsRecord> {
  const record = await prisma.userSettings.upsert({
    where: { userId },
    update: {
      targetMode: "MANUAL",
      dailyCalories: targets.calories,
      proteinTargetG: targets.proteinG,
      carbTargetMinG: targets.carbsG.min,
      carbTargetMaxG: targets.carbsG.max,
      fatTargetMinG: targets.fatG.min,
      fatTargetMaxG: targets.fatG.max,
    },
    create: {
      userId,
      targetMode: "MANUAL",
      dailyCalories: targets.calories,
      proteinTargetG: targets.proteinG,
      carbTargetMinG: targets.carbsG.min,
      carbTargetMaxG: targets.carbsG.max,
      fatTargetMinG: targets.fatG.min,
      fatTargetMaxG: targets.fatG.max,
    },
  });

  return mapSettingsRecord(record);
}

export async function applyGoalPlannerSettings(
  userId: string,
  profile: GoalPlannerProfile
): Promise<UserSettingsRecord> {
  const recommendation = calculateGoalRecommendation(profile);
  const metricValues = profileToMetric(profile);

  const record = await prisma.userSettings.upsert({
    where: { userId },
    update: {
      targetMode: "GUIDED",
      dailyCalories: recommendation.dailyTargets.calories,
      proteinTargetG: recommendation.dailyTargets.proteinG,
      carbTargetMinG: recommendation.dailyTargets.carbsG.min,
      carbTargetMaxG: recommendation.dailyTargets.carbsG.max,
      fatTargetMinG: recommendation.dailyTargets.fatG.min,
      fatTargetMaxG: recommendation.dailyTargets.fatG.max,
      goalSex: profile.sex,
      ageYears: profile.ageYears,
      activityLevel: profile.activityLevel,
      goalPhase: profile.goalPhase,
      weightUnit: profile.weight.unit,
      heightUnit: profile.height.unit,
      weightKg: metricValues.weightKg,
      heightCm: metricValues.heightCm,
      proteinPreference: profile.macroPreferences.protein,
      carbPreference: profile.macroPreferences.carbs,
      fatPreference: profile.macroPreferences.fat,
    },
    create: {
      userId,
      targetMode: "GUIDED",
      dailyCalories: recommendation.dailyTargets.calories,
      proteinTargetG: recommendation.dailyTargets.proteinG,
      carbTargetMinG: recommendation.dailyTargets.carbsG.min,
      carbTargetMaxG: recommendation.dailyTargets.carbsG.max,
      fatTargetMinG: recommendation.dailyTargets.fatG.min,
      fatTargetMaxG: recommendation.dailyTargets.fatG.max,
      goalSex: profile.sex,
      ageYears: profile.ageYears,
      activityLevel: profile.activityLevel,
      goalPhase: profile.goalPhase,
      weightUnit: profile.weight.unit,
      heightUnit: profile.height.unit,
      weightKg: metricValues.weightKg,
      heightCm: metricValues.heightCm,
      proteinPreference: profile.macroPreferences.protein,
      carbPreference: profile.macroPreferences.carbs,
      fatPreference: profile.macroPreferences.fat,
    },
  });

  return mapSettingsRecord(record);
}
