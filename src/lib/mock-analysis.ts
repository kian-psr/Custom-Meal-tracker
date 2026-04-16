import { normalizeAnalysis, type MealType } from "@/lib/meal-analysis-schema";

type MacroSet = {
  calories: number;
  protein: number;
  carbs: number;
  fat: number;
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
  ]);

  const estimatedComponents = FOOD_RULES.flatMap((rule) => {
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
    }),
    {
      calories: 0,
      proteinG: 0,
      carbsG: 0,
      fatG: 0,
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
