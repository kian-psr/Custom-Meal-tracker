import {
  createEmptyMicronutrients,
  normalizeAnalysis,
  type Micronutrients,
  type MealType,
} from "@/lib/meal-analysis-schema";

type MacroSet = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
};

type ComponentEstimate = {
  name: string;
  estimatedAmount: string;
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  micronutrients: Micronutrients;
  notes: string;
};

type FoodRule = {
  keywords: string[];
  defaultAmount: string;
  unit: "default" | "count" | "grams" | "tsp";
  defaultUnits: number;
  macros: MacroSet;
  notes: string;
  assumption: string;
};

function buildMicronutrients(partial: Partial<Micronutrients>): Micronutrients {
  return {
    ...createEmptyMicronutrients(),
    ...partial,
  };
}

const FOOD_MICRONUTRIENTS: Record<string, Micronutrients> = {
  steak: buildMicronutrients({
    sodiumMg: 115,
    potassiumMg: 620,
    calciumMg: 25,
    ironMg: 3.8,
    vitaminDMcg: 0.2,
    vitaminB12Mcg: 2.2,
  }),
  "chicken breast": buildMicronutrients({
    sodiumMg: 125,
    potassiumMg: 460,
    calciumMg: 18,
    ironMg: 1,
    vitaminAMcg: 6,
    vitaminDMcg: 0.1,
    vitaminB12Mcg: 0.4,
  }),
  salmon: buildMicronutrients({
    sodiumMg: 95,
    potassiumMg: 620,
    calciumMg: 18,
    ironMg: 0.7,
    vitaminDMcg: 13,
    vitaminB12Mcg: 5.3,
  }),
  eggs: buildMicronutrients({
    sugarG: 0.8,
    sodiumMg: 140,
    potassiumMg: 138,
    calciumMg: 56,
    ironMg: 1.8,
    vitaminAMcg: 160,
    vitaminDMcg: 2,
    vitaminB12Mcg: 1.1,
  }),
  rice: buildMicronutrients({
    sugarG: 0.1,
    fiberG: 0.6,
    sodiumMg: 2,
    potassiumMg: 50,
    calciumMg: 12,
    ironMg: 0.3,
  }),
  potato: buildMicronutrients({
    sugarG: 2,
    fiberG: 4,
    sodiumMg: 14,
    potassiumMg: 840,
    calciumMg: 24,
    ironMg: 1.3,
    vitaminCMg: 20,
    vitaminAMcg: 2,
  }),
  oats: buildMicronutrients({
    sugarG: 0.4,
    fiberG: 4.2,
    sodiumMg: 2,
    potassiumMg: 140,
    calciumMg: 22,
    ironMg: 1.7,
  }),
  "greek yogurt": buildMicronutrients({
    sugarG: 9,
    sodiumMg: 90,
    potassiumMg: 350,
    calciumMg: 275,
    vitaminB12Mcg: 1.1,
  }),
  banana: buildMicronutrients({
    sugarG: 14,
    fiberG: 3.1,
    sodiumMg: 1,
    potassiumMg: 422,
    calciumMg: 6,
    ironMg: 0.3,
    vitaminCMg: 10.3,
    vitaminAMcg: 4,
  }),
  berries: buildMicronutrients({
    sugarG: 5.5,
    fiberG: 2.8,
    sodiumMg: 1,
    potassiumMg: 120,
    calciumMg: 14,
    ironMg: 0.4,
    vitaminCMg: 32,
    vitaminAMcg: 8,
  }),
  mozzarella: buildMicronutrients({
    sugarG: 0.7,
    sodiumMg: 190,
    potassiumMg: 24,
    calciumMg: 220,
    ironMg: 0.2,
    vitaminAMcg: 95,
    vitaminB12Mcg: 0.6,
  }),
  cheese: buildMicronutrients({
    sugarG: 0.3,
    sodiumMg: 180,
    potassiumMg: 22,
    calciumMg: 180,
    ironMg: 0.2,
    vitaminAMcg: 100,
    vitaminB12Mcg: 0.4,
  }),
  "olive oil": buildMicronutrients({}),
  avocado: buildMicronutrients({
    sugarG: 0.5,
    fiberG: 4.7,
    sodiumMg: 5,
    potassiumMg: 340,
    calciumMg: 10,
    ironMg: 0.4,
    vitaminCMg: 7,
    vitaminAMcg: 5,
  }),
  peppers: buildMicronutrients({
    sugarG: 4.2,
    fiberG: 2.1,
    sodiumMg: 3,
    potassiumMg: 210,
    calciumMg: 10,
    ironMg: 0.3,
    vitaminCMg: 120,
    vitaminAMcg: 160,
  }),
  broccoli: buildMicronutrients({
    sugarG: 1.7,
    fiberG: 3.3,
    sodiumMg: 33,
    potassiumMg: 316,
    calciumMg: 47,
    ironMg: 0.7,
    vitaminCMg: 89,
    vitaminAMcg: 31,
  }),
  salad: buildMicronutrients({
    sugarG: 1.2,
    fiberG: 2,
    sodiumMg: 28,
    potassiumMg: 210,
    calciumMg: 70,
    ironMg: 1.2,
    vitaminCMg: 10,
    vitaminAMcg: 250,
  }),
  bread: buildMicronutrients({
    sugarG: 3,
    fiberG: 2,
    sodiumMg: 280,
    potassiumMg: 80,
    calciumMg: 60,
    ironMg: 1.5,
  }),
  tortilla: buildMicronutrients({
    sugarG: 1.4,
    fiberG: 1.5,
    sodiumMg: 330,
    potassiumMg: 80,
    calciumMg: 90,
    ironMg: 1.4,
  }),
  beans: buildMicronutrients({
    sugarG: 0.5,
    fiberG: 9,
    sodiumMg: 5,
    potassiumMg: 430,
    calciumMg: 46,
    ironMg: 2.5,
    vitaminCMg: 2,
  }),
};

const FOOD_RULES: FoodRule[] = [
  {
    keywords: ["steak", "sirloin", "ribeye"],
    defaultAmount: "180 g cooked steak",
    unit: "grams",
    defaultUnits: 180,
    macros: { calories: 380, protein: 48, carbs: 0, fat: 19 },
    notes: "Lean steak estimate rounded for a cooked portion.",
    assumption: "Assumed a cooked steak portion around 180 g.",
  },
  {
    keywords: ["chicken breast", "chicken"],
    defaultAmount: "180 g cooked chicken breast",
    unit: "grams",
    defaultUnits: 180,
    macros: { calories: 300, protein: 54, carbs: 0, fat: 7 },
    notes: "Skinless chicken breast assumption.",
    assumption: "Assumed a cooked chicken portion near 180 g.",
  },
  {
    keywords: ["salmon"],
    defaultAmount: "170 g cooked salmon",
    unit: "grams",
    defaultUnits: 170,
    macros: { calories: 350, protein: 38, carbs: 0, fat: 22 },
    notes: "Atlantic salmon estimate.",
    assumption: "Assumed a cooked salmon fillet around 170 g.",
  },
  {
    keywords: ["eggs", "egg"],
    defaultAmount: "2 large eggs",
    unit: "count",
    defaultUnits: 2,
    macros: { calories: 144, protein: 12, carbs: 1, fat: 10 },
    notes: "Large whole eggs.",
    assumption: "Assumed standard large eggs.",
  },
  {
    keywords: ["rice"],
    defaultAmount: "150 g cooked rice",
    unit: "grams",
    defaultUnits: 150,
    macros: { calories: 190, protein: 4, carbs: 41, fat: 1 },
    notes: "Cooked white rice estimate.",
    assumption: "Assumed a moderate serving of cooked rice.",
  },
  {
    keywords: ["potato", "potatoes"],
    defaultAmount: "200 g potato",
    unit: "grams",
    defaultUnits: 200,
    macros: { calories: 170, protein: 4, carbs: 39, fat: 0 },
    notes: "Plain baked or roasted potato estimate.",
    assumption: "Potatoes were treated as plain unless oil was listed separately.",
  },
  {
    keywords: ["oats", "oatmeal"],
    defaultAmount: "40 g oats",
    unit: "grams",
    defaultUnits: 40,
    macros: { calories: 155, protein: 5, carbs: 27, fat: 3 },
    notes: "Dry rolled oats.",
    assumption: "Assumed dry oats before cooking.",
  },
  {
    keywords: ["greek yogurt", "yogurt"],
    defaultAmount: "250 g Greek yogurt",
    unit: "grams",
    defaultUnits: 250,
    macros: { calories: 145, protein: 26, carbs: 10, fat: 0 },
    notes: "Nonfat plain Greek yogurt estimate.",
    assumption: "Assumed plain Greek yogurt without granola or sweetener.",
  },
  {
    keywords: ["banana"],
    defaultAmount: "1 medium banana",
    unit: "count",
    defaultUnits: 1,
    macros: { calories: 105, protein: 1, carbs: 27, fat: 0 },
    notes: "Fresh banana estimate.",
    assumption: "Assumed a medium banana.",
  },
  {
    keywords: ["berries", "berry", "blueberries", "strawberries"],
    defaultAmount: "80 g berries",
    unit: "grams",
    defaultUnits: 80,
    macros: { calories: 40, protein: 1, carbs: 9, fat: 0 },
    notes: "Mixed berry estimate.",
    assumption: "Assumed a small handful of berries.",
  },
  {
    keywords: ["mozzarella"],
    defaultAmount: "30 g mozzarella",
    unit: "grams",
    defaultUnits: 30,
    macros: { calories: 85, protein: 6, carbs: 1, fat: 6 },
    notes: "Part-skim mozzarella estimate.",
    assumption: "Assumed a light mozzarella serving around 30 g.",
  },
  {
    keywords: ["cheese", "cheddar", "parmesan"],
    defaultAmount: "25 g cheese",
    unit: "grams",
    defaultUnits: 25,
    macros: { calories: 100, protein: 6, carbs: 1, fat: 8 },
    notes: "Generic cheese estimate.",
    assumption: "Cheese can vary a lot, so fat may move higher or lower.",
  },
  {
    keywords: ["olive oil", "oil"],
    defaultAmount: "1 tsp olive oil",
    unit: "tsp",
    defaultUnits: 1,
    macros: { calories: 40, protein: 0, carbs: 0, fat: 4.5 },
    notes: "Pure added cooking oil.",
    assumption: "Oil was counted conservatively because hidden oil is common.",
  },
  {
    keywords: ["avocado"],
    defaultAmount: "70 g avocado",
    unit: "grams",
    defaultUnits: 70,
    macros: { calories: 112, protein: 1, carbs: 6, fat: 10 },
    notes: "Fresh avocado estimate.",
    assumption: "Assumed about half a medium avocado.",
  },
  {
    keywords: ["peppers", "pepper", "bell pepper"],
    defaultAmount: "100 g peppers",
    unit: "grams",
    defaultUnits: 100,
    macros: { calories: 30, protein: 1, carbs: 7, fat: 0 },
    notes: "Bell pepper estimate.",
    assumption: "Peppers were treated as non-starchy vegetables.",
  },
  {
    keywords: ["broccoli"],
    defaultAmount: "100 g broccoli",
    unit: "grams",
    defaultUnits: 100,
    macros: { calories: 34, protein: 3, carbs: 7, fat: 0 },
    notes: "Steamed broccoli estimate.",
    assumption: "No butter or sauce was assumed unless listed separately.",
  },
  {
    keywords: ["salad", "spinach", "lettuce"],
    defaultAmount: "90 g salad greens",
    unit: "grams",
    defaultUnits: 90,
    macros: { calories: 20, protein: 2, carbs: 3, fat: 0 },
    notes: "Leafy greens only.",
    assumption: "Dressings were not included unless explicitly listed.",
  },
  {
    keywords: ["bread", "toast"],
    defaultAmount: "2 slices bread",
    unit: "count",
    defaultUnits: 2,
    macros: { calories: 160, protein: 6, carbs: 28, fat: 2 },
    notes: "Standard sliced bread estimate.",
    assumption: "Assumed standard sandwich bread rather than a bakery loaf.",
  },
  {
    keywords: ["tortilla", "wrap"],
    defaultAmount: "1 tortilla wrap",
    unit: "count",
    defaultUnits: 1,
    macros: { calories: 150, protein: 5, carbs: 24, fat: 4 },
    notes: "Medium flour tortilla estimate.",
    assumption: "Wrap size can meaningfully shift calories.",
  },
  {
    keywords: ["beans", "black beans", "kidney beans"],
    defaultAmount: "130 g beans",
    unit: "grams",
    defaultUnits: 130,
    macros: { calories: 150, protein: 9, carbs: 27, fat: 1 },
    notes: "Cooked beans estimate.",
    assumption: "Beans were treated as drained and cooked.",
  },
];

function escapePattern(pattern: string) {
  return pattern.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractNumber(
  description: string,
  keyword: string,
  unitPattern: string,
  fallback: number
) {
  const expression = new RegExp(
    `(\\d+(?:\\.\\d+)?)\\s*(?:${unitPattern})\\s+(?:of\\s+)?${escapePattern(keyword)}`,
    "i"
  );
  const matched = description.match(expression);

  if (!matched) {
    return fallback;
  }

  return Number(matched[1]);
}

function resolveUnits(description: string, rule: FoodRule) {
  const keyword = rule.keywords[0];

  if (rule.unit === "count") {
    const directMatch = description.match(
      new RegExp(`(\\d+(?:\\.\\d+)?)\\s*(?:x\\s*)?(?:large\\s+)?${escapePattern(keyword)}`, "i")
    );

    if (directMatch) {
      return Number(directMatch[1]);
    }

    return extractNumber(
      description,
      keyword,
      "count|piece|pieces|slice|slices",
      rule.defaultUnits
    );
  }

  if (rule.unit === "grams") {
    return extractNumber(description, keyword, "g|gram|grams", rule.defaultUnits);
  }

  if (rule.unit === "tsp") {
    const tbspMatch = extractNumber(description, keyword, "tbsp|tablespoon|tablespoons", 0);

    if (tbspMatch > 0) {
      return tbspMatch * 3;
    }

    return extractNumber(description, keyword, "tsp|teaspoon|teaspoons", rule.defaultUnits);
  }

  return rule.defaultUnits;
}

function formatAmount(units: number, rule: FoodRule) {
  if (rule.unit === "count") {
    if (rule.keywords.includes("eggs") || rule.keywords.includes("egg")) {
      return `${units} large egg${units === 1 ? "" : "s"}`;
    }

    if (rule.keywords.includes("bread") || rule.keywords.includes("toast")) {
      return `${units} slice${units === 1 ? "" : "s"} bread`;
    }

    if (rule.keywords.includes("tortilla") || rule.keywords.includes("wrap")) {
      return `${units} tortilla wrap${units === 1 ? "" : "s"}`;
    }

    if (rule.keywords.includes("banana")) {
      return `${units} medium banana${units === 1 ? "" : "s"}`;
    }

    return `${units} serving${units === 1 ? "" : "s"}`;
  }

  if (rule.unit === "grams") {
    return `${Math.round(units)} g ${rule.keywords[0]}`;
  }

  if (rule.unit === "tsp") {
    return `${units} tsp ${rule.keywords[0]}`;
  }

  return rule.defaultAmount;
}

function roundToSingleDecimal(value: number) {
  return Math.round(value * 10) / 10;
}

function scaleMicronutrients(micronutrients: Micronutrients, multiplier: number): Micronutrients {
  return {
    sugarG: roundToSingleDecimal(micronutrients.sugarG * multiplier),
    fiberG: roundToSingleDecimal(micronutrients.fiberG * multiplier),
    sodiumMg: roundToSingleDecimal(micronutrients.sodiumMg * multiplier),
    potassiumMg: roundToSingleDecimal(micronutrients.potassiumMg * multiplier),
    calciumMg: roundToSingleDecimal(micronutrients.calciumMg * multiplier),
    ironMg: roundToSingleDecimal(micronutrients.ironMg * multiplier),
    vitaminCMg: roundToSingleDecimal(micronutrients.vitaminCMg * multiplier),
    vitaminAMcg: roundToSingleDecimal(micronutrients.vitaminAMcg * multiplier),
    vitaminDMcg: roundToSingleDecimal(micronutrients.vitaminDMcg * multiplier),
    vitaminB12Mcg: roundToSingleDecimal(micronutrients.vitaminB12Mcg * multiplier),
  };
}

function addMicronutrients(
  current: Micronutrients,
  addition: Micronutrients
): Micronutrients {
  return {
    sugarG: roundToSingleDecimal(current.sugarG + addition.sugarG),
    fiberG: roundToSingleDecimal(current.fiberG + addition.fiberG),
    sodiumMg: roundToSingleDecimal(current.sodiumMg + addition.sodiumMg),
    potassiumMg: roundToSingleDecimal(current.potassiumMg + addition.potassiumMg),
    calciumMg: roundToSingleDecimal(current.calciumMg + addition.calciumMg),
    ironMg: roundToSingleDecimal(current.ironMg + addition.ironMg),
    vitaminCMg: roundToSingleDecimal(current.vitaminCMg + addition.vitaminCMg),
    vitaminAMcg: roundToSingleDecimal(current.vitaminAMcg + addition.vitaminAMcg),
    vitaminDMcg: roundToSingleDecimal(current.vitaminDMcg + addition.vitaminDMcg),
    vitaminB12Mcg: roundToSingleDecimal(
      current.vitaminB12Mcg + addition.vitaminB12Mcg
    ),
  };
}

function titleCase(input: string) {
  return input
    .split(/\s+/)
    .filter(Boolean)
    .map((part) => part.charAt(0).toUpperCase() + part.slice(1))
    .join(" ");
}

function buildFallbackMealName(description: string, mealType: MealType) {
  const cleaned = description
    .split(",")
    .map((piece) => piece.trim())
    .filter(Boolean)
    .slice(0, 3)
    .join(" ");

  if (cleaned) {
    return titleCase(cleaned);
  }

  return `${titleCase(mealType.toLowerCase())} Meal`;
}

export function createMockMealAnalysis(input: {
  description: string;
  mealType: MealType;
}) {
  const description = input.description.toLowerCase();
  const assumptions = new Set<string>([
    "Demo mode is enabled, so this estimate uses text heuristics instead of live image analysis.",
    "Micronutrient detail is best-effort and usually less reliable than calories and macros in demo mode.",
  ]);

  const estimatedComponents: ComponentEstimate[] = FOOD_RULES.flatMap((rule) => {
    const matchedKeyword = rule.keywords.find((keyword) => description.includes(keyword));

    if (!matchedKeyword) {
      return [];
    }

    const units = resolveUnits(description, rule);
    const multiplier = units / rule.defaultUnits;

    assumptions.add(rule.assumption);

    return [
      {
        name: titleCase(matchedKeyword),
        estimatedAmount: formatAmount(units, rule),
        calories: Math.round(rule.macros.calories * multiplier),
        proteinG: roundToSingleDecimal(rule.macros.protein * multiplier),
        carbsG: roundToSingleDecimal(rule.macros.carbs * multiplier),
        fatG: roundToSingleDecimal(rule.macros.fat * multiplier),
        micronutrients: scaleMicronutrients(
          FOOD_MICRONUTRIENTS[rule.keywords[0]] ?? createEmptyMicronutrients(),
          multiplier
        ),
        notes: rule.notes,
      },
    ];
  });

  if (estimatedComponents.length === 0) {
    assumptions.add("No food keywords matched strongly, so a generic balanced meal estimate was used.");
  }

  const components =
    estimatedComponents.length > 0
      ? estimatedComponents
      : [
          {
            name: "Mixed meal",
            estimatedAmount: "1 plate",
            calories: 520,
            proteinG: 35,
            carbsG: 35,
            fatG: 22,
            micronutrients: buildMicronutrients({
              sugarG: 6,
              fiberG: 5,
              sodiumMg: 620,
              potassiumMg: 620,
              calciumMg: 120,
              ironMg: 2.4,
              vitaminCMg: 18,
              vitaminAMcg: 120,
              vitaminDMcg: 0.6,
              vitaminB12Mcg: 1.1,
            }),
            notes: "Fallback estimate for an unrecognized mixed meal.",
          },
        ];

  if (!description.includes("oil") && !description.includes("butter") && !description.includes("sauce")) {
    assumptions.add("Any unlisted cooking oil, butter, or sauce could increase calories and fat.");
  }

  const totals = components.reduce(
    (accumulator, component) => ({
      calories: accumulator.calories + component.calories,
      proteinG: accumulator.proteinG + component.proteinG,
      carbsG: accumulator.carbsG + component.carbsG,
      fatG: accumulator.fatG + component.fatG,
      micronutrients: addMicronutrients(accumulator.micronutrients, component.micronutrients),
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
      micronutrients: createEmptyMicronutrients(),
    }
  );

  const explicitQuantityMentions = (description.match(/\d+(?:\.\d+)?/g) ?? []).length;
  const confidenceLabel =
    components.length >= 3 && explicitQuantityMentions >= 1
      ? "high"
      : components.length >= 2
        ? "medium"
        : "low";

  const confidenceScore =
    confidenceLabel === "high" ? 0.78 : confidenceLabel === "medium" ? 0.62 : 0.45;

  return normalizeAnalysis({
    meal_name: buildFallbackMealName(input.description, input.mealType),
    estimated_calories: totals.calories,
    protein_g: totals.proteinG,
    carbs_g: totals.carbsG,
    fat_g: totals.fatG,
    micronutrients: {
      sugar_g: totals.micronutrients.sugarG,
      fiber_g: totals.micronutrients.fiberG,
      sodium_mg: totals.micronutrients.sodiumMg,
      potassium_mg: totals.micronutrients.potassiumMg,
      calcium_mg: totals.micronutrients.calciumMg,
      iron_mg: totals.micronutrients.ironMg,
      vitamin_c_mg: totals.micronutrients.vitaminCMg,
      vitamin_a_mcg: totals.micronutrients.vitaminAMcg,
      vitamin_d_mcg: totals.micronutrients.vitaminDMcg,
      vitamin_b12_mcg: totals.micronutrients.vitaminB12Mcg,
    },
    confidence: {
      score: confidenceScore,
      label: confidenceLabel,
    },
    assumptions: Array.from(assumptions).slice(0, 8),
    estimated_components: components.map((component) => ({
      name: component.name,
      estimated_amount: component.estimatedAmount,
      calories: component.calories,
      protein_g: component.proteinG,
      carbs_g: component.carbsG,
      fat_g: component.fatG,
      notes: component.notes,
    })),
  });
}
