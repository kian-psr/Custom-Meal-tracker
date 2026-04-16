import "server-only";

import OpenAI from "openai";

import {
  mealAnalysisJsonSchema,
  normalizeAnalysis,
  rawMealAnalysisSchema,
  type AnalyzedMeal,
  type MealType,
} from "@/lib/meal-analysis-schema";
import { createMockMealAnalysis } from "@/lib/mock-analysis";
import { serverEnv } from "@/lib/server-env";
import type { DailyTargets } from "@/lib/types";

type AnalyzeMealInput = {
  imageDataUrl: string;
  description: string;
  mealType: MealType;
  targets: DailyTargets;
};

let openAIClient: OpenAI | null = null;

function getOpenAIClient() {
  if (!serverEnv.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is missing.");
  }

  if (!openAIClient) {
    openAIClient = new OpenAI({
      apiKey: serverEnv.OPENAI_API_KEY,
    });
  }

  return openAIClient;
}

function buildPrompt(input: AnalyzeMealInput) {
  return [
    `Meal type: ${input.mealType}.`,
    `Description: ${input.description}.`,
    `Daily targets for context: ${input.targets.calories} kcal, ${input.targets.proteinG} g protein, ${input.targets.carbsG.min}-${input.targets.carbsG.max} g carbs, ${input.targets.fatG.min}-${input.targets.fatG.max} g fat.`,
    "Estimate the meal conservatively for a cutting phase and prioritize protein accuracy.",
  ].join(" ");
}

function extractResponseText(response: Awaited<ReturnType<OpenAI["responses"]["create"]>>) {
  if (
    "output_text" in response &&
    typeof response.output_text === "string" &&
    response.output_text.trim()
  ) {
    return response.output_text.trim();
  }

  if (!("output" in response) || !Array.isArray(response.output)) {
    throw new Error("The model returned a streaming response when JSON output was expected.");
  }

  const outputText = response.output
    .flatMap((item) => ("content" in item ? item.content : []))
    .filter((item) => item.type === "output_text")
    .map((item) => item.text)
    .join("")
    .trim();

  if (!outputText) {
    throw new Error("The model returned an empty structured response.");
  }

  return outputText;
}

async function analyzeWithOpenAI(input: AnalyzeMealInput): Promise<{
  analysis: AnalyzedMeal;
  source: "openai";
  model: string;
}> {
  const response = await getOpenAIClient().responses.create({
    model: serverEnv.OPENAI_MEAL_MODEL,
    input: [
      {
        role: "system",
        content: [
          {
            type: "input_text",
            text:
              "You are a sports nutrition analyst estimating calories and macros from a meal image plus a short ingredient description. Be conservative with hidden fats from oil, butter, cheese, dressings, and sauces. Prioritize protein estimation accuracy. Never pretend to be exact. The assumptions array must call out portion estimates, hidden ingredient risks, and ambiguity from the image. The estimated_components array should list the key ingredients that drove the estimate and use practical amount strings like 180 g chicken breast or 1 tsp olive oil.",
          },
        ],
      },
      {
        role: "user",
        content: [
          {
            type: "input_text",
            text: buildPrompt(input),
          },
          {
            type: "input_image",
            image_url: input.imageDataUrl,
            detail: "high",
          },
        ],
      },
    ],
    text: {
      format: {
        type: "json_schema",
        name: "meal_macro_estimate",
        strict: true,
        schema: mealAnalysisJsonSchema,
      },
    },
  });

  const responseText = extractResponseText(response);
  const parsed = rawMealAnalysisSchema.parse(JSON.parse(responseText));

  return {
    analysis: normalizeAnalysis(parsed),
    source: "openai",
    model: serverEnv.OPENAI_MEAL_MODEL,
  };
}

export async function analyzeMeal(input: AnalyzeMealInput): Promise<{
  analysis: AnalyzedMeal;
  source: "openai" | "mock";
  model: string;
}> {
  if (serverEnv.useMockAnalysis) {
    return {
      analysis: createMockMealAnalysis({
        description: input.description,
        mealType: input.mealType,
      }),
      source: "mock",
      model: "local-heuristic-v1",
    };
  }

  try {
    return await analyzeWithOpenAI(input);
  } catch (error) {
    console.error("OpenAI meal analysis failed, falling back to local heuristic mode.", error);

    return {
      analysis: createMockMealAnalysis({
        description: input.description,
        mealType: input.mealType,
      }),
      source: "mock",
      model: "local-heuristic-v1-fallback",
    };
  }
}
