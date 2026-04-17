import type {
  AnalysisSource,
  AnalyzedMeal,
  ConfidenceLabel,
  MealType,
} from "@/lib/meal-analysis-schema";
import type {
  GoalPlannerProfile,
  GoalPlannerRecommendation,
  SettingsMode,
} from "@/lib/goal-planner";

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

export type AdminUserSummary = {
  id: string;
  email: string;
  name: string | null;
  createdAt: string;
  mealCount: number;
  lastActivityAt: string;
};

export type AdminUsersResponse = {
  summary: {
    signedUpUsers: number;
    totalMeals: number;
    activeLast7Days: number;
  };
  users: AdminUserSummary[];
};

export type AdminSystemDiagnosticsResponse = {
  environment: {
    nodeEnv: string;
    isRailway: boolean;
    railwayEnvironmentName: string | null;
  };
  persistence: {
    databaseUrlKind: "sqlite" | "other";
    databaseTarget: string;
    databaseFilePath: string | null;
    railwayVolumeMountPath: string | null;
    usesRailwayVolumeForDatabase: boolean;
    mealPhotoStorageDir: string;
  };
  auth: {
    adminEmailsConfigured: boolean;
    adminEmailCount: number;
    authSecretFingerprint: string;
    sessionTtlDays: number;
  };
  openAI: {
    hasApiKey: boolean;
    useMockAnalysis: boolean;
    model: string;
  };
  databaseCounts: {
    users: number;
    meals: number;
    sessions: number;
    activeSessions: number;
    settings: number;
  };
  warnings: string[];
};

export type StoredGoalPlannerProfile = GoalPlannerProfile & {
  metricValues: {
    weightKg: number;
    heightCm: number;
  };
};

export type UserGoalPlannerRecord = {
  mode: SettingsMode;
  profile: StoredGoalPlannerProfile;
  recommendation: GoalPlannerRecommendation;
};

export type UserSettingsRecord = {
  id: string;
  targets: DailyTargets;
  mode: SettingsMode;
  planner: UserGoalPlannerRecord | null;
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

export type GoalPlannerPreviewResponse = {
  profile: GoalPlannerProfile;
  recommendation: GoalPlannerRecommendation;
};
