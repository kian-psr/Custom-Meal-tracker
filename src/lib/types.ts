import type {
  AnalysisSource,
  AnalyzedMeal,
  ConfidenceLabel,
  MealType,
} from "@/lib/meal-analysis-schema";

export type MacroTotals = {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
};

export type MacroRange = {
  min: number;
  max: number;
};

export type DailyTargets = {
  calories: number;
  proteinG: number;
  carbsG: MacroRange;
  fatG: MacroRange;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
};

export type AuthSessionResponse = {
  authenticated: boolean;
  user: AuthUser | null;
};

export type UserSettingsRecord = {
  id: string;
  targets: DailyTargets;
  createdAt: string;
  updatedAt: string;
};

export type MealLogRecord = {
  id: string;
  mealType: MealType;
  description: string;
  mealName: string;
  photoUrl: string | null;
  sourceImageName: string | null;
  estimatedCalories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
  confidence: {
    score: number;
    label: ConfidenceLabel;
  };
  assumptions: string[];
  estimatedComponents: AnalyzedMeal["estimatedComponents"];
  analysisSource: AnalysisSource;
  analysisModel: string;
  consumedAt: string;
  createdAt: string;
  updatedAt: string;
};

export type CutStatus = {
  label: string;
  tone: "good" | "warn" | "alert";
  reasons: string[];
};

export type DailyHistorySummary = {
  date: string;
  totals: MacroTotals;
  mealCount: number;
  status: CutStatus;
};

export type WeeklyTrend = {
  averageCalories: number;
  averageProteinG: number;
  averageCarbsG: number;
  averageFatG: number;
  daysLogged: number;
  onTrackDays: number;
  overTargetDays: number;
};

export type DailyDashboard = {
  date: string;
  isToday: boolean;
  settings: UserSettingsRecord;
  totals: MacroTotals;
  remaining: {
    calories: number;
    proteinG: number;
    carbsG: MacroRange;
    fatG: MacroRange;
  };
  status: CutStatus;
  meals: MealLogRecord[];
  history: DailyHistorySummary[];
  weeklyTrend: WeeklyTrend;
};

export type MealAnalysisResponse = {
  analysis: AnalyzedMeal;
  source: Extract<AnalysisSource, "openai" | "mock">;
  model: string;
};
