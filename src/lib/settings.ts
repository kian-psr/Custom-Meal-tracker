import type { UserSettings } from "@prisma/client";

import { prisma } from "@/lib/prisma";
import { DEFAULT_SETTINGS_ID, DEFAULT_DAILY_TARGETS } from "@/lib/targets";
import type { DailyTargets, UserSettingsRecord } from "@/lib/types";

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
  return {
    id: record.id,
    targets: mapTargets(record),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getOrCreateUserSettings(): Promise<UserSettingsRecord> {
  const record = await prisma.userSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: {},
    create: {
      id: DEFAULT_SETTINGS_ID,
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

export async function updateUserSettings(targets: DailyTargets): Promise<UserSettingsRecord> {
  const record = await prisma.userSettings.upsert({
    where: { id: DEFAULT_SETTINGS_ID },
    update: {
      dailyCalories: targets.calories,
      proteinTargetG: targets.proteinG,
      carbTargetMinG: targets.carbsG.min,
      carbTargetMaxG: targets.carbsG.max,
      fatTargetMinG: targets.fatG.min,
      fatTargetMaxG: targets.fatG.max,
    },
    create: {
      id: DEFAULT_SETTINGS_ID,
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
