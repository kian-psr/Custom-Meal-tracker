import type { MealLog } from "@prisma/client";

import { getDayRange, getDateKey, isToday, listDateKeysEndingAt } from "@/lib/date";
import { deleteMealPhoto } from "@/lib/file-storage";
import {
  type AnalysisSource,
  type AnalyzedMeal,
  type MealType,
} from "@/lib/meal-analysis-schema";
import {
  buildCutStatus,
  buildDailyHistorySummary,
  buildWeeklyTrend,
  normalizeTotals,
  sumMeals,
} from "@/lib/nutrition";
import { prisma } from "@/lib/prisma";
import { getOrCreateUserSettings } from "@/lib/settings";
import type { DailyDashboard, MealLogRecord } from "@/lib/types";

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function mapMealLogRecord(record: MealLog): MealLogRecord {
  return {
    id: record.id,
    mealType: record.mealType as MealType,
    description: record.description,
    mealName: record.mealName,
    photoUrl: record.photoUrl,
    sourceImageName: record.sourceImageName,
    estimatedCalories: record.estimatedCalories,
    proteinG: record.proteinG,
    carbsG: record.carbsG,
    fatG: record.fatG,
    confidence: {
      score: record.confidenceScore,
      label: record.confidenceLabel as MealLogRecord["confidence"]["label"],
    },
    assumptions: parseJson<string[]>(record.assumptionsJson),
    estimatedComponents: parseJson<AnalyzedMeal["estimatedComponents"]>(
      record.estimatedComponentsJson
    ),
    analysisSource: record.analysisSource as AnalysisSource,
    analysisModel: record.analysisModel,
    consumedAt: record.consumedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export async function getDailyDashboard(userId: string, dateKey?: string): Promise<DailyDashboard> {
  const settings = await getOrCreateUserSettings(userId);
  const targets = settings.targets;
  const range = getDayRange(dateKey);
  const historyKeys = listDateKeysEndingAt(range.key, 7);
  const historyStart = getDayRange(historyKeys[0]).start;

  const records = await prisma.mealLog.findMany({
    where: {
      userId,
      consumedAt: {
        gte: historyStart,
        lt: range.end,
      },
    },
    orderBy: {
      consumedAt: "desc",
    },
  });

  const meals = records.map(mapMealLogRecord);
  const mealsByDate = new Map<string, MealLogRecord[]>();

  for (const meal of meals) {
    const key = getDateKey(new Date(meal.consumedAt));
    const existing = mealsByDate.get(key) ?? [];
    existing.push(meal);
    mealsByDate.set(key, existing);
  }

  const selectedMeals = mealsByDate.get(range.key) ?? [];
  const totals = normalizeTotals(sumMeals(selectedMeals));
  const history = historyKeys.map((historyKey) =>
    buildDailyHistorySummary(historyKey, mealsByDate.get(historyKey) ?? [], targets)
  );

  return {
    date: range.key,
    isToday: isToday(range.key),
    settings,
    totals,
    remaining: {
      calories: Math.round(targets.calories - totals.calories),
      proteinG: Math.max(0, Math.round((targets.proteinG - totals.proteinG) * 10) / 10),
      carbsG: {
        min: Math.round((targets.carbsG.min - totals.carbsG) * 10) / 10,
        max: Math.round((targets.carbsG.max - totals.carbsG) * 10) / 10,
      },
      fatG: {
        min: Math.round((targets.fatG.min - totals.fatG) * 10) / 10,
        max: Math.round((targets.fatG.max - totals.fatG) * 10) / 10,
      },
    },
    status: buildCutStatus(totals, targets),
    meals: selectedMeals,
    history,
    weeklyTrend: buildWeeklyTrend(history),
  };
}

export async function createMealLog(input: {
  userId: string;
  description: string;
  mealType: MealType;
  analysis: AnalyzedMeal;
  analysisSource: AnalysisSource;
  analysisModel: string;
  consumedAt?: string;
  photoUrl?: string | null;
  sourceImageName?: string | null;
}) {
  const createdRecord = await prisma.mealLog.create({
    data: {
      userId: input.userId,
      mealType: input.mealType,
      description: input.description,
      mealName: input.analysis.mealName,
      photoUrl: input.photoUrl,
      sourceImageName: input.sourceImageName,
      estimatedCalories: input.analysis.estimatedCalories,
      proteinG: input.analysis.proteinG,
      carbsG: input.analysis.carbsG,
      fatG: input.analysis.fatG,
      confidenceScore: input.analysis.confidence.score,
      confidenceLabel: input.analysis.confidence.label,
      assumptionsJson: JSON.stringify(input.analysis.assumptions),
      estimatedComponentsJson: JSON.stringify(input.analysis.estimatedComponents),
      analysisSource: input.analysisSource,
      analysisModel: input.analysisModel,
      consumedAt: input.consumedAt ? new Date(input.consumedAt) : new Date(),
    },
  });

  return mapMealLogRecord(createdRecord);
}

export async function updateMealLog(
  userId: string,
  id: string,
  input: {
    mealName: string;
    description: string;
    mealType: MealType;
    estimatedCalories: number;
    proteinG: number;
    carbsG: number;
    fatG: number;
    assumptions: string[];
    consumedAt: string;
  }
) {
  const existing = await prisma.mealLog.findFirst({
    where: { id, userId },
  });

  if (!existing) {
    return null;
  }

  const updatedRecord = await prisma.mealLog.update({
    where: { id },
    data: {
      mealName: input.mealName,
      description: input.description,
      mealType: input.mealType,
      estimatedCalories: input.estimatedCalories,
      proteinG: input.proteinG,
      carbsG: input.carbsG,
      fatG: input.fatG,
      assumptionsJson: JSON.stringify(input.assumptions),
      consumedAt: new Date(input.consumedAt),
    },
  });

  return mapMealLogRecord(updatedRecord);
}

export async function deleteMealLog(userId: string, id: string) {
  const existing = await prisma.mealLog.findFirst({
    where: { id, userId },
    select: { id: true, photoUrl: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.mealLog.delete({
    where: { id },
  });

  await deleteMealPhoto(existing.photoUrl);

  return true;
}

export async function canUserAccessMealPhoto(userId: string, fileName: string) {
  const record = await prisma.mealLog.findFirst({
    where: {
      userId,
      photoUrl: `/api/photos/${fileName}`,
    },
    select: {
      id: true,
    },
  });

  return Boolean(record);
}
