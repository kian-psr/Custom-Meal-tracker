import { createEmptyMicronutrients, type Micronutrients } from "@/lib/meal-analysis-schema";

export const SUPPLEMENT_KEYS = [
  "VITAMIN_D",
  "VITAMIN_C",
  "ZINC",
  "IRON",
  "CALCIUM",
  "VITAMIN_B12",
  "CREATINE",
] as const;

export const SUPPLEMENT_UNITS = ["MG", "MCG", "G", "IU"] as const;

export type SupplementKey = (typeof SUPPLEMENT_KEYS)[number];
export type SupplementUnit = (typeof SUPPLEMENT_UNITS)[number];

export type SupplementQuickDose = {
  amount: number;
  unit: SupplementUnit;
  label: string;
};

export type SupplementDefinition = {
  key: SupplementKey;
  label: string;
  description: string;
  units: SupplementUnit[];
  defaultAmount: number;
  defaultUnit: SupplementUnit;
  quickDoses: SupplementQuickDose[];
  trackingHint: string;
  category: "micronutrient" | "performance";
};

export type SupplementImpact = {
  micronutrients: Micronutrients;
  creatineG: number;
};

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function buildImpact(
  partialMicronutrients: Partial<Micronutrients>,
  creatineG = 0
): SupplementImpact {
  return {
    micronutrients: {
      ...createEmptyMicronutrients(),
      ...partialMicronutrients,
    },
    creatineG: roundToSingleDecimal(creatineG),
  };
}

export const SUPPLEMENT_CATALOG: SupplementDefinition[] = [
  {
    key: "VITAMIN_D",
    label: "Vitamin D",
    description: "Useful for quickly logging common daily vitamin D doses.",
    units: ["MCG", "IU"],
    defaultAmount: 25,
    defaultUnit: "MCG",
    quickDoses: [
      { amount: 25, unit: "MCG", label: "25 mcg" },
      { amount: 50, unit: "MCG", label: "50 mcg" },
      { amount: 5000, unit: "IU", label: "5000 IU" },
    ],
    trackingHint: "Counts toward your daily vitamin D total.",
    category: "micronutrient",
  },
  {
    key: "VITAMIN_C",
    label: "Vitamin C",
    description: "Great for powders, tablets, and recovery-focused vitamin C doses.",
    units: ["MG"],
    defaultAmount: 500,
    defaultUnit: "MG",
    quickDoses: [
      { amount: 500, unit: "MG", label: "500 mg" },
      { amount: 1000, unit: "MG", label: "1000 mg" },
    ],
    trackingHint: "Counts toward your daily vitamin C total.",
    category: "micronutrient",
  },
  {
    key: "ZINC",
    label: "Zinc",
    description: "Logs common zinc capsules or tablets alongside the rest of the day.",
    units: ["MG"],
    defaultAmount: 15,
    defaultUnit: "MG",
    quickDoses: [
      { amount: 15, unit: "MG", label: "15 mg" },
      { amount: 30, unit: "MG", label: "30 mg" },
    ],
    trackingHint: "Counts toward your daily zinc total.",
    category: "micronutrient",
  },
  {
    key: "IRON",
    label: "Iron",
    description: "Designed for supplement-label doses rather than food estimates.",
    units: ["MG"],
    defaultAmount: 18,
    defaultUnit: "MG",
    quickDoses: [
      { amount: 18, unit: "MG", label: "18 mg" },
      { amount: 65, unit: "MG", label: "65 mg" },
    ],
    trackingHint: "Counts toward your daily iron total.",
    category: "micronutrient",
  },
  {
    key: "CALCIUM",
    label: "Calcium",
    description: "Useful for tablets, chews, or powdered calcium servings.",
    units: ["MG"],
    defaultAmount: 500,
    defaultUnit: "MG",
    quickDoses: [
      { amount: 500, unit: "MG", label: "500 mg" },
      { amount: 1000, unit: "MG", label: "1000 mg" },
    ],
    trackingHint: "Counts toward your daily calcium total.",
    category: "micronutrient",
  },
  {
    key: "VITAMIN_B12",
    label: "Vitamin B12",
    description: "Handy for drops, tablets, or weekly B12 routines.",
    units: ["MCG"],
    defaultAmount: 500,
    defaultUnit: "MCG",
    quickDoses: [
      { amount: 500, unit: "MCG", label: "500 mcg" },
      { amount: 1000, unit: "MCG", label: "1000 mcg" },
    ],
    trackingHint: "Counts toward your daily B12 total.",
    category: "micronutrient",
  },
  {
    key: "CREATINE",
    label: "Creatine",
    description: "Track creatine in grams without forcing it into the vitamin rows.",
    units: ["G"],
    defaultAmount: 5,
    defaultUnit: "G",
    quickDoses: [
      { amount: 3, unit: "G", label: "3 g" },
      { amount: 5, unit: "G", label: "5 g" },
    ],
    trackingHint: "Tracked separately as creatine grams for the day.",
    category: "performance",
  },
];

export const SUPPLEMENT_CATALOG_BY_KEY = Object.fromEntries(
  SUPPLEMENT_CATALOG.map((definition) => [definition.key, definition])
) as Record<SupplementKey, SupplementDefinition>;

export function getSupplementDefinition(key: SupplementKey) {
  return SUPPLEMENT_CATALOG_BY_KEY[key];
}

export function isSupplementUnitAllowed(key: SupplementKey, unit: SupplementUnit) {
  return getSupplementDefinition(key).units.includes(unit);
}

export function formatSupplementAmount(amount: number, unit: SupplementUnit) {
  const roundedAmount = Number.isInteger(amount)
    ? String(amount)
    : roundToSingleDecimal(amount).toFixed(1);
  const label = unit === "MCG" ? "mcg" : unit === "MG" ? "mg" : unit === "G" ? "g" : "IU";
  return `${roundedAmount} ${label}`;
}

export function deriveSupplementImpact(
  key: SupplementKey,
  amount: number,
  unit: SupplementUnit
): SupplementImpact {
  const normalizedAmount = Number.isFinite(amount) ? Math.max(0, amount) : 0;

  switch (key) {
    case "VITAMIN_D":
      return buildImpact({
        vitaminDMcg: unit === "IU" ? normalizedAmount / 40 : normalizedAmount,
      });
    case "VITAMIN_C":
      return buildImpact({
        vitaminCMg: normalizedAmount,
      });
    case "ZINC":
      return buildImpact({
        zincMg: normalizedAmount,
      });
    case "IRON":
      return buildImpact({
        ironMg: normalizedAmount,
      });
    case "CALCIUM":
      return buildImpact({
        calciumMg: normalizedAmount,
      });
    case "VITAMIN_B12":
      return buildImpact({
        vitaminB12Mcg: normalizedAmount,
      });
    case "CREATINE":
      return buildImpact({}, normalizedAmount);
  }
}
