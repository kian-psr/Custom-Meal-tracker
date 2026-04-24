import type { SupplementLog } from "@prisma/client";

import { createEmptyMicronutrients, type Micronutrients } from "@/lib/meal-analysis-schema";
import { prisma } from "@/lib/prisma";
import {
  deriveSupplementImpact,
  formatSupplementAmount,
  getSupplementDefinition,
  getSupplementStackPreset,
  type SupplementKey,
  type SupplementStackKey,
  type SupplementUnit,
} from "@/lib/supplement-catalog";
import type { SupplementLogRecord, SupplementSummary } from "@/lib/types";

function parseJson<T>(value: string): T {
  return JSON.parse(value) as T;
}

function parseMicronutrients(value: string): Micronutrients {
  return {
    ...createEmptyMicronutrients(),
    ...parseJson<Partial<Micronutrients>>(value),
  };
}

function mapSupplementLogRecord(record: SupplementLog): SupplementLogRecord {
  return {
    id: record.id,
    supplementKey: record.supplementKey as SupplementKey,
    supplementLabel: record.supplementLabel,
    amount: record.amountValue,
    unit: record.amountUnit as SupplementUnit,
    amountLabel: formatSupplementAmount(record.amountValue, record.amountUnit as SupplementUnit),
    note: record.note,
    micronutrients: parseMicronutrients(record.micronutrientsJson),
    creatineG: record.creatineG,
    consumedAt: record.consumedAt.toISOString(),
    createdAt: record.createdAt.toISOString(),
    updatedAt: record.updatedAt.toISOString(),
  };
}

export function buildSupplementDailySummary(
  supplements: SupplementLogRecord[]
): SupplementSummary {
  return {
    count: supplements.length,
    creatineG: Math.round(
      supplements.reduce((total, supplement) => total + supplement.creatineG, 0) * 10
    ) / 10,
  };
}

function buildSupplementLogPayload(input: {
  supplementKey: SupplementKey;
  amount: number;
  unit: SupplementUnit;
  note?: string | null;
  consumedAt: string;
}) {
  const definition = getSupplementDefinition(input.supplementKey);
  const derived = deriveSupplementImpact(input.supplementKey, input.amount, input.unit);

  return {
    supplementKey: input.supplementKey,
    supplementLabel: definition.label,
    amountValue: input.amount,
    amountUnit: input.unit,
    note: input.note?.trim() || null,
    micronutrientsJson: JSON.stringify(derived.micronutrients),
    creatineG: derived.creatineG,
    consumedAt: new Date(input.consumedAt),
  };
}

export async function listDailySupplementLogs(userId: string, start: Date, end: Date) {
  const records = await prisma.supplementLog.findMany({
    where: {
      userId,
      consumedAt: {
        gte: start,
        lt: end,
      },
    },
    orderBy: {
      consumedAt: "desc",
    },
  });

  return records.map(mapSupplementLogRecord);
}

export async function createSupplementLog(input: {
  userId: string;
  supplementKey: SupplementKey;
  amount: number;
  unit: SupplementUnit;
  note?: string;
  consumedAt: string;
}) {
  const createdRecord = await prisma.supplementLog.create({
    data: {
      userId: input.userId,
      ...buildSupplementLogPayload(input),
    },
  });

  return mapSupplementLogRecord(createdRecord);
}

export async function createSupplementStackLogs(input: {
  userId: string;
  stackKey: SupplementStackKey;
  consumedAt: string;
}) {
  const preset = getSupplementStackPreset(input.stackKey);
  const consumedAt = new Date(input.consumedAt);
  const createdRecords = await prisma.$transaction(
    preset.items.map((item) =>
      prisma.supplementLog.create({
        data: {
          userId: input.userId,
          ...buildSupplementLogPayload({
            ...item,
            consumedAt: consumedAt.toISOString(),
          }),
        },
      })
    )
  );

  return createdRecords.map(mapSupplementLogRecord);
}

export async function updateSupplementLog(
  userId: string,
  id: string,
  input: {
    supplementKey: SupplementKey;
    amount: number;
    unit: SupplementUnit;
    note?: string;
    consumedAt: string;
  }
) {
  const existing = await prisma.supplementLog.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return null;
  }

  const updatedRecord = await prisma.supplementLog.update({
    where: { id },
    data: buildSupplementLogPayload(input),
  });

  return mapSupplementLogRecord(updatedRecord);
}

export async function deleteSupplementLog(userId: string, id: string) {
  const existing = await prisma.supplementLog.findFirst({
    where: { id, userId },
    select: { id: true },
  });

  if (!existing) {
    return false;
  }

  await prisma.supplementLog.delete({
    where: { id },
  });

  return true;
}
