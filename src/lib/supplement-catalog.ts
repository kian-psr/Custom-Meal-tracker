import { createEmptyMicronutrients, type Micronutrients } from "@/lib/meal-analysis-schema";

export const SUPPLEMENT_KEYS = [
  "VITAMIN_D",
  "VITAMIN_C",
  "ZINC",
  "IRON",
  "CALCIUM",
  "MAGNESIUM",
  "VITAMIN_B12",
  "OMEGA_3",
  "ELECTROLYTES",
  "MULTIVITAMIN",
  "CREATINE",
] as const;

export const SUPPLEMENT_UNITS = ["MG", "MCG", "G", "IU", "SERVING"] as const;
export const SUPPLEMENT_STACK_KEYS = [
  "CUTTING_BASICS",
  "MORNING_MICROS",
  "TRAINING_SUPPORT",
] as const;

export type SupplementKey = (typeof SUPPLEMENT_KEYS)[number];
export type SupplementUnit = (typeof SUPPLEMENT_UNITS)[number];
export type SupplementStackKey = (typeof SUPPLEMENT_STACK_KEYS)[number];

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

export type SupplementStackItem = {
  supplementKey: SupplementKey;
  amount: number;
  unit: SupplementUnit;
  note?: string;
};

export type SupplementStackPreset = {
  key: SupplementStackKey;
  label: string;
  description: string;
  items: SupplementStackItem[];
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
    key: "MAGNESIUM",
    label: "Magnesium",
    description: "Useful for glycinate, citrate, or other magnesium supplement doses.",
    units: ["MG"],
    defaultAmount: 200,
    defaultUnit: "MG",
    quickDoses: [
      { amount: 200, unit: "MG", label: "200 mg" },
      { amount: 300, unit: "MG", label: "300 mg" },
      { amount: 400, unit: "MG", label: "400 mg" },
    ],
    trackingHint: "Counts toward your daily magnesium total.",
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
    key: "OMEGA_3",
    label: "Omega-3",
    description: "Track fish oil, algae oil, or omega-3 capsules in milligrams or grams.",
    units: ["MG", "G"],
    defaultAmount: 1000,
    defaultUnit: "MG",
    quickDoses: [
      { amount: 1000, unit: "MG", label: "1000 mg" },
      { amount: 2, unit: "G", label: "2 g" },
      { amount: 3, unit: "G", label: "3 g" },
    ],
    trackingHint: "Counts toward the omega-3 row in your daily overview.",
    category: "micronutrient",
  },
  {
    key: "ELECTROLYTES",
    label: "Electrolytes",
    description:
      "For electrolyte powders or tablets when the label is not entered ingredient-by-ingredient.",
    units: ["SERVING"],
    defaultAmount: 1,
    defaultUnit: "SERVING",
    quickDoses: [
      { amount: 1, unit: "SERVING", label: "1 serving" },
      { amount: 2, unit: "SERVING", label: "2 servings" },
    ],
    trackingHint:
      "Adds a typical electrolyte serving: sodium, potassium, and magnesium.",
    category: "micronutrient",
  },
  {
    key: "MULTIVITAMIN",
    label: "Multivitamin",
    description:
      "A broad one-serving placeholder for a standard daily multivitamin. Edit individual entries if your label differs.",
    units: ["SERVING"],
    defaultAmount: 1,
    defaultUnit: "SERVING",
    quickDoses: [{ amount: 1, unit: "SERVING", label: "1 serving" }],
    trackingHint:
      "Adds a typical adult multivitamin blend across vitamins and minerals.",
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

export const SUPPLEMENT_STACK_PRESETS: SupplementStackPreset[] = [
  {
    key: "CUTTING_BASICS",
    label: "Cutting basics",
    description: "Vitamin D, magnesium, omega-3, and creatine in one tap.",
    items: [
      {
        supplementKey: "VITAMIN_D",
        amount: 25,
        unit: "MCG",
        note: "From Cutting basics stack.",
      },
      {
        supplementKey: "MAGNESIUM",
        amount: 200,
        unit: "MG",
        note: "From Cutting basics stack.",
      },
      {
        supplementKey: "OMEGA_3",
        amount: 1000,
        unit: "MG",
        note: "From Cutting basics stack.",
      },
      {
        supplementKey: "CREATINE",
        amount: 5,
        unit: "G",
        note: "From Cutting basics stack.",
      },
    ],
  },
  {
    key: "MORNING_MICROS",
    label: "Morning micros",
    description: "Multivitamin, vitamin C, zinc, and B12 for a fast morning log.",
    items: [
      {
        supplementKey: "MULTIVITAMIN",
        amount: 1,
        unit: "SERVING",
        note: "From Morning micros stack.",
      },
      {
        supplementKey: "VITAMIN_C",
        amount: 500,
        unit: "MG",
        note: "From Morning micros stack.",
      },
      {
        supplementKey: "ZINC",
        amount: 15,
        unit: "MG",
        note: "From Morning micros stack.",
      },
      {
        supplementKey: "VITAMIN_B12",
        amount: 500,
        unit: "MCG",
        note: "From Morning micros stack.",
      },
    ],
  },
  {
    key: "TRAINING_SUPPORT",
    label: "Training support",
    description: "Electrolytes, creatine, and omega-3 for training days.",
    items: [
      {
        supplementKey: "ELECTROLYTES",
        amount: 1,
        unit: "SERVING",
        note: "From Training support stack.",
      },
      {
        supplementKey: "CREATINE",
        amount: 5,
        unit: "G",
        note: "From Training support stack.",
      },
      {
        supplementKey: "OMEGA_3",
        amount: 1000,
        unit: "MG",
        note: "From Training support stack.",
      },
    ],
  },
];

export const SUPPLEMENT_STACK_PRESETS_BY_KEY = Object.fromEntries(
  SUPPLEMENT_STACK_PRESETS.map((preset) => [preset.key, preset])
) as Record<SupplementStackKey, SupplementStackPreset>;

export const SUPPLEMENT_CATALOG_BY_KEY = Object.fromEntries(
  SUPPLEMENT_CATALOG.map((definition) => [definition.key, definition])
) as Record<SupplementKey, SupplementDefinition>;

export function getSupplementDefinition(key: SupplementKey) {
  return SUPPLEMENT_CATALOG_BY_KEY[key];
}

export function getSupplementStackPreset(key: SupplementStackKey) {
  return SUPPLEMENT_STACK_PRESETS_BY_KEY[key];
}

export function isSupplementUnitAllowed(key: SupplementKey, unit: SupplementUnit) {
  return getSupplementDefinition(key).units.includes(unit);
}

export function formatSupplementAmount(amount: number, unit: SupplementUnit) {
  const roundedAmount = Number.isInteger(amount)
    ? String(amount)
    : roundToSingleDecimal(amount).toFixed(1);
  const label =
    unit === "MCG"
      ? "mcg"
      : unit === "MG"
        ? "mg"
        : unit === "G"
          ? "g"
          : unit === "SERVING"
            ? amount === 1
              ? "serving"
              : "servings"
            : "IU";
  return `${roundedAmount} ${label}`;
}

function amountAsMg(amount: number, unit: SupplementUnit) {
  if (unit === "G") {
    return amount * 1000;
  }

  return unit === "MG" ? amount : 0;
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
    case "MAGNESIUM":
      return buildImpact({
        magnesiumMg: normalizedAmount,
      });
    case "VITAMIN_B12":
      return buildImpact({
        vitaminB12Mcg: normalizedAmount,
      });
    case "OMEGA_3":
      return buildImpact({
        omega3Mg: amountAsMg(normalizedAmount, unit),
      });
    case "ELECTROLYTES":
      return buildImpact({
        sodiumMg: normalizedAmount * 500,
        potassiumMg: normalizedAmount * 200,
        magnesiumMg: normalizedAmount * 60,
      });
    case "MULTIVITAMIN":
      return buildImpact({
        calciumMg: normalizedAmount * 200,
        magnesiumMg: normalizedAmount * 50,
        ironMg: normalizedAmount * 8,
        zincMg: normalizedAmount * 11,
        vitaminCMg: normalizedAmount * 90,
        vitaminAMcg: normalizedAmount * 900,
        vitaminDMcg: normalizedAmount * 20,
        vitaminB12Mcg: normalizedAmount * 2.4,
      });
    case "CREATINE":
      return buildImpact({}, normalizedAmount);
  }
}
