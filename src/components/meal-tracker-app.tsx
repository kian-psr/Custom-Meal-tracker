"use client";

import { clsx } from "clsx";
import { useEffect, useState } from "react";

import {
  addDays,
  dateTimeLocalForDay,
  formatDisplayDate,
  formatShortDate,
  getDateKey,
  isToday,
  toDateTimeLocalValue,
} from "@/lib/date";
import type { MealType } from "@/lib/meal-analysis-schema";
import type {
  AuthSessionResponse,
  AuthUser,
  DailyDashboard,
  DailyHistorySummary,
  MealAnalysisResponse,
  MealLogRecord,
  UserSettingsRecord,
} from "@/lib/types";

const MEAL_TYPE_OPTIONS: Array<{ value: MealType; label: string }> = [
  { value: "BREAKFAST", label: "Breakfast" },
  { value: "LUNCH", label: "Lunch" },
  { value: "DINNER", label: "Dinner" },
  { value: "SNACK", label: "Snack" },
];

const SOURCE_LABELS = {
  openai: "OpenAI vision",
  mock: "Demo mode",
  seed: "Seeded sample",
} as const;

type ReviewDraft = {
  mealName: string;
  estimatedCalories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  assumptions: string;
  consumedAt: string;
};

type EditDraft = {
  mealName: string;
  description: string;
  mealType: MealType;
  estimatedCalories: string;
  proteinG: string;
  carbsG: string;
  fatG: string;
  assumptions: string;
  consumedAt: string;
};

type SettingsDraft = {
  calories: string;
  proteinG: string;
  carbsMinG: string;
  carbsMaxG: string;
  fatMinG: string;
  fatMaxG: string;
};

type AuthMode = "sign-in" | "sign-up";

type AuthDraft = {
  name: string;
  email: string;
  password: string;
};

class UnauthorizedRequestError extends Error {}

function formatMacroValue(value: number) {
  return Number.isInteger(value) ? String(value) : value.toFixed(1);
}

function mealTypeLabel(mealType: MealType) {
  return (
    MEAL_TYPE_OPTIONS.find((option) => option.value === mealType)?.label ?? mealType
  );
}

function progressWidth(value: number, target: number) {
  if (target <= 0) {
    return 0;
  }

  return Math.min(100, Math.round((value / target) * 100));
}

function rangeSummary(range: { min: number; max: number }) {
  if (range.max < 0) {
    return `${Math.abs(range.max).toFixed(1)} g over the ceiling`;
  }

  if (range.min > 0) {
    return `${range.min.toFixed(1)} g to the floor, ${range.max.toFixed(1)} g before the ceiling`;
  }

  return `Floor hit, ${range.max.toFixed(1)} g left before the ceiling`;
}

function timeLabel(isoString: string) {
  return new Intl.DateTimeFormat("en-US", {
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(isoString));
}

function toneClassName(tone: DailyDashboard["status"]["tone"]) {
  if (tone === "good") {
    return "border-sage-200 bg-sage-50 text-sage-800";
  }

  if (tone === "warn") {
    return "border-amber-200 bg-amber-50 text-amber-900";
  }

  return "border-rose-200 bg-rose-50 text-rose-900";
}

function createReviewDraft(
  analysis: MealAnalysisResponse["analysis"],
  selectedDate: string
): ReviewDraft {
  return {
    mealName: analysis.mealName,
    estimatedCalories: String(analysis.estimatedCalories),
    proteinG: String(analysis.proteinG),
    carbsG: String(analysis.carbsG),
    fatG: String(analysis.fatG),
    assumptions: analysis.assumptions.join("\n"),
    consumedAt: dateTimeLocalForDay(selectedDate),
  };
}

function createEditDraft(meal: MealLogRecord): EditDraft {
  return {
    mealName: meal.mealName,
    description: meal.description,
    mealType: meal.mealType,
    estimatedCalories: String(meal.estimatedCalories),
    proteinG: String(meal.proteinG),
    carbsG: String(meal.carbsG),
    fatG: String(meal.fatG),
    assumptions: meal.assumptions.join("\n"),
    consumedAt: toDateTimeLocalValue(new Date(meal.consumedAt)),
  };
}

function createSettingsDraft(settings: UserSettingsRecord): SettingsDraft {
  return {
    calories: String(settings.targets.calories),
    proteinG: String(settings.targets.proteinG),
    carbsMinG: String(settings.targets.carbsG.min),
    carbsMaxG: String(settings.targets.carbsG.max),
    fatMinG: String(settings.targets.fatG.min),
    fatMaxG: String(settings.targets.fatG.max),
  };
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

async function fetchDashboardPayload(date: string) {
  const response = await fetch(`/api/meals?date=${date}`, { cache: "no-store" });

  if (response.status === 401) {
    throw new UnauthorizedRequestError(await readErrorMessage(response));
  }

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as DailyDashboard;
}

async function fetchSessionPayload() {
  const response = await fetch("/api/auth/session", { cache: "no-store" });

  if (!response.ok) {
    throw new Error(await readErrorMessage(response));
  }

  return (await response.json()) as AuthSessionResponse;
}

function createEmptyAuthDraft(): AuthDraft {
  return {
    name: "",
    email: "",
    password: "",
  };
}

function AuthFeature({
  title,
  detail,
}: {
  title: string;
  detail: string;
}) {
  return (
    <div className="rounded-[20px] border border-white/70 bg-white/70 px-4 py-4">
      <p className="text-sm font-semibold text-clay-900">{title}</p>
      <p className="mt-2 text-sm leading-6 text-clay-500">{detail}</p>
    </div>
  );
}

function AuthPanel({
  mode,
  draft,
  error,
  isSubmitting,
  onModeChange,
  onDraftChange,
  onSubmit,
}: {
  mode: AuthMode;
  draft: AuthDraft;
  error: string | null;
  isSubmitting: boolean;
  onModeChange: (mode: AuthMode) => void;
  onDraftChange: (field: keyof AuthDraft, value: string) => void;
  onSubmit: (event: React.FormEvent<HTMLFormElement>) => void;
}) {
  return (
    <section className="glass-panel animate-rise grid gap-6 p-5 sm:p-6 lg:grid-cols-[0.95fr_1.05fr]">
      <div className="rounded-[28px] bg-gradient-to-br from-clay-900 via-clay-900 to-sage-900 p-6 text-white">
        <p className="section-label !text-clay-200">Private Tracking</p>
        <h2 className="mt-3 text-3xl leading-tight">
          Create an account so every meal log, target, and photo stays yours.
        </h2>
        <p className="mt-4 max-w-xl text-sm leading-7 text-clay-100">
          This app now keeps data per user instead of sharing one public log. Sign in
          from your phone or laptop and you’ll land in the same private dashboard.
        </p>

        <div className="mt-6 grid gap-3 sm:grid-cols-3">
          <AuthFeature
            detail="Each account gets its own meals, photos, targets, and trend history."
            title="User-specific data"
          />
          <AuthFeature
            detail="Sessions stay signed in with a secure cookie, so logging remains fast."
            title="Quick return"
          />
          <AuthFeature
            detail="Railway can keep serving the same app link while users see only their own dashboard."
            title="Ready for sharing"
          />
        </div>
      </div>

      <div className="rounded-[28px] border border-clay-100 bg-white/80 p-6">
        <div className="flex gap-2 rounded-full border border-clay-200 bg-clay-50 p-1">
          <button
            className={clsx(
              "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition",
              mode === "sign-in"
                ? "bg-clay-900 text-white"
                : "text-clay-600 hover:text-clay-900"
            )}
            onClick={() => onModeChange("sign-in")}
            type="button"
          >
            Sign in
          </button>
          <button
            className={clsx(
              "flex-1 rounded-full px-4 py-3 text-sm font-semibold transition",
              mode === "sign-up"
                ? "bg-clay-900 text-white"
                : "text-clay-600 hover:text-clay-900"
            )}
            onClick={() => onModeChange("sign-up")}
            type="button"
          >
            Create account
          </button>
        </div>

        <form className="mt-6 space-y-4" onSubmit={onSubmit}>
          {mode === "sign-up" ? (
            <label className="block">
              <span className="text-sm font-medium text-clay-700">Name</span>
              <input
                className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none transition focus:border-ember-500"
                onChange={(event) => onDraftChange("name", event.target.value)}
                placeholder="Optional display name"
                value={draft.name}
              />
            </label>
          ) : null}

          <label className="block">
            <span className="text-sm font-medium text-clay-700">Email</span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none transition focus:border-ember-500"
              onChange={(event) => onDraftChange("email", event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={draft.email}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-clay-700">Password</span>
            <input
              autoComplete={mode === "sign-up" ? "new-password" : "current-password"}
              className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none transition focus:border-ember-500"
              onChange={(event) => onDraftChange("password", event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={draft.password}
            />
          </label>

          {error ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-full bg-clay-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting
              ? mode === "sign-up"
                ? "Creating account..."
                : "Signing in..."
              : mode === "sign-up"
                ? "Create account"
                : "Sign in"}
          </button>
        </form>

        <p className="mt-4 text-sm leading-6 text-clay-500">
          {mode === "sign-up"
            ? "Your account starts with the current cut defaults and an empty private meal log."
            : "Use the same email and password from any device to reach your personal dashboard."}
        </p>
      </div>
    </section>
  );
}

function SummaryCard({
  label,
  value,
  suffix,
  progress,
}: {
  label: string;
  value: string;
  suffix: string;
  progress: number;
}) {
  return (
    <div className="rounded-[24px] border border-clay-100 bg-white/80 p-4">
      <p className="section-label">{label}</p>
      <div className="mt-3 flex items-baseline gap-2">
        <span className="text-3xl font-semibold text-clay-900">{value}</span>
        <span className="text-sm text-clay-500">{suffix}</span>
      </div>
      <div className="mt-4 h-2 rounded-full bg-clay-100">
        <div
          className="h-full rounded-full bg-gradient-to-r from-ember-500 to-sage-500"
          style={{ width: `${progress}%` }}
        />
      </div>
    </div>
  );
}

function MetricChip({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-clay-100 bg-clay-50/80 px-4 py-3">
      <p className="text-xs uppercase tracking-[0.22em] text-clay-500">{label}</p>
      <p className="mt-2 text-2xl font-semibold text-clay-900">{value}</p>
      <p className="mt-1 text-sm text-clay-500">{helper}</p>
    </div>
  );
}

function MacroStrip({
  calories,
  proteinG,
  carbsG,
  fatG,
}: {
  calories: number;
  proteinG: number;
  carbsG: number;
  fatG: number;
}) {
  return (
    <div className="grid gap-3 sm:grid-cols-4">
      <MetricChip label="Calories" value={String(calories)} helper="kcal" />
      <MetricChip label="Protein" value={formatMacroValue(proteinG)} helper="grams" />
      <MetricChip label="Carbs" value={formatMacroValue(carbsG)} helper="grams" />
      <MetricChip label="Fat" value={formatMacroValue(fatG)} helper="grams" />
    </div>
  );
}

function PhotoFrame({
  photoUrl,
  alt,
  sourceImageName,
  heightClassName = "h-44",
}: {
  photoUrl?: string | null;
  alt: string;
  sourceImageName?: string | null;
  heightClassName?: string;
}) {
  return (
    <div
      className={clsx(
        "overflow-hidden rounded-[20px] border border-white bg-white/70",
        heightClassName
      )}
    >
      {photoUrl ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img alt={alt} className="h-full w-full object-cover" src={photoUrl} />
      ) : (
        <div className="flex h-full items-center justify-center bg-[radial-gradient(circle_at_top,_rgba(209,100,55,0.14),_transparent_45%)] px-6 text-center text-sm text-clay-500">
          {sourceImageName ?? "No stored image for this meal yet."}
        </div>
      )}
    </div>
  );
}

function HistoryDayButton({
  summary,
  isSelected,
  onSelect,
}: {
  summary: DailyHistorySummary;
  isSelected: boolean;
  onSelect: (date: string) => void;
}) {
  const barHeight = Math.min(100, Math.max(12, Math.round(summary.totals.calories / 18)));

  return (
    <button
      className={clsx(
        "flex flex-col items-center gap-3 rounded-[22px] border px-3 py-4 text-left transition",
        isSelected
          ? "border-sage-400 bg-sage-50"
          : "border-clay-100 bg-white/70 hover:border-clay-300"
      )}
      onClick={() => onSelect(summary.date)}
      type="button"
    >
      <div className="flex h-28 items-end">
        <div
          className={clsx(
            "w-10 rounded-full bg-gradient-to-t",
            summary.status.tone === "good"
              ? "from-sage-500 to-sage-300"
              : summary.status.tone === "warn"
                ? "from-amber-500 to-amber-300"
                : "from-rose-500 to-rose-300"
          )}
          style={{ height: `${barHeight}%` }}
        />
      </div>
      <div className="text-center">
        <p className="text-sm font-semibold text-clay-900">{formatShortDate(summary.date)}</p>
        <p className="mt-1 text-xs text-clay-500">
          {summary.mealCount} meal{summary.mealCount === 1 ? "" : "s"}
        </p>
        <p className="mt-1 text-xs text-clay-500">{summary.totals.calories} kcal</p>
      </div>
    </button>
  );
}

export function MealTrackerApp() {
  const [selectedDate, setSelectedDate] = useState(getDateKey());
  const [sessionUser, setSessionUser] = useState<AuthUser | null>(null);
  const [isLoadingSession, setIsLoadingSession] = useState(true);
  const [authMode, setAuthMode] = useState<AuthMode>("sign-in");
  const [authDraft, setAuthDraft] = useState<AuthDraft>(createEmptyAuthDraft);
  const [authError, setAuthError] = useState<string | null>(null);
  const [isSubmittingAuth, setIsSubmittingAuth] = useState(false);

  const [dashboard, setDashboard] = useState<DailyDashboard | null>(null);
  const [isLoadingDashboard, setIsLoadingDashboard] = useState(true);
  const [dashboardError, setDashboardError] = useState<string | null>(null);

  const [description, setDescription] = useState("");
  const [mealType, setMealType] = useState<MealType>("LUNCH");
  const [selectedImage, setSelectedImage] = useState<File | null>(null);
  const [imagePreviewUrl, setImagePreviewUrl] = useState<string | null>(null);

  const [analysisResponse, setAnalysisResponse] = useState<MealAnalysisResponse | null>(null);
  const [reviewDraft, setReviewDraft] = useState<ReviewDraft | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);

  const [isSaving, setIsSaving] = useState(false);
  const [mutationError, setMutationError] = useState<string | null>(null);
  const [editingMealId, setEditingMealId] = useState<string | null>(null);
  const [editDraft, setEditDraft] = useState<EditDraft | null>(null);
  const [busyMealId, setBusyMealId] = useState<string | null>(null);

  const [settingsDraft, setSettingsDraft] = useState<SettingsDraft | null>(null);
  const [isSavingSettings, setIsSavingSettings] = useState(false);

  async function loadDashboard(date = selectedDate) {
    setDashboardError(null);
    setIsLoadingDashboard(true);

    try {
      const payload = await fetchDashboardPayload(date);
      setDashboard(payload);
      setSettingsDraft(createSettingsDraft(payload.settings));
    } catch (error) {
      if (error instanceof UnauthorizedRequestError) {
        handleSignedOut(error.message);
        return;
      }

      setDashboardError(
        error instanceof Error ? error.message : "Unable to load the dashboard."
      );
    } finally {
      setIsLoadingDashboard(false);
    }
  }

  function handleSignedOut(message?: string) {
    setSessionUser(null);
    setDashboard(null);
    setSettingsDraft(null);
    setDashboardError(null);
    setEditingMealId(null);
    setEditDraft(null);
    setBusyMealId(null);
    setMutationError(null);
    setAnalysisError(null);
    setReviewDraft(null);
    setAnalysisResponse(null);
    setSelectedImage(null);
    setDescription("");
    setMealType("LUNCH");
    setAuthError(message ?? null);
    setIsLoadingDashboard(false);
  }

  async function loadSession() {
    setIsLoadingSession(true);

    try {
      const payload = await fetchSessionPayload();
      setSessionUser(payload.user);
      setAuthError(null);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to load the session.");
      setSessionUser(null);
    } finally {
      setIsLoadingSession(false);
    }
  }

  function updateAuthDraft(field: keyof AuthDraft, value: string) {
    setAuthDraft((current) => ({
      ...current,
      [field]: value,
    }));
  }

  async function handleAuthSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAuthError(null);
    setMutationError(null);
    setIsSubmittingAuth(true);

    try {
      const response = await fetch(
        authMode === "sign-up" ? "/api/auth/sign-up" : "/api/auth/sign-in",
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: authDraft.name.trim(),
            email: authDraft.email.trim(),
            password: authDraft.password,
          }),
        }
      );

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as AuthSessionResponse;
      const today = getDateKey();

      setSessionUser(payload.user);
      setSelectedDate(today);
      setAuthDraft(createEmptyAuthDraft());
      setAuthError(null);
      await loadDashboard(today);
    } catch (error) {
      setAuthError(error instanceof Error ? error.message : "Unable to authenticate.");
    } finally {
      setIsSubmittingAuth(false);
    }
  }

  async function handleSignOut() {
    setMutationError(null);

    try {
      const response = await fetch("/api/auth/sign-out", {
        method: "POST",
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      setAuthMode("sign-in");
      setAuthDraft(createEmptyAuthDraft());
      handleSignedOut();
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to sign out.");
    }
  }

  useEffect(() => {
    void loadSession();
  }, []);

  useEffect(() => {
    let active = true;

    async function syncDashboard() {
      if (isLoadingSession) {
        return;
      }

      if (!sessionUser) {
        if (active) {
          setDashboard(null);
          setSettingsDraft(null);
          setDashboardError(null);
          setIsLoadingDashboard(false);
        }
        return;
      }

      setDashboardError(null);
      setIsLoadingDashboard(true);

      try {
        const payload = await fetchDashboardPayload(selectedDate);

        if (!active) {
          return;
        }

        setDashboard(payload);
        setSettingsDraft(createSettingsDraft(payload.settings));
      } catch (error) {
        if (!active) {
          return;
        }

        if (error instanceof UnauthorizedRequestError) {
          handleSignedOut(error.message);
          return;
        }

        setDashboardError(
          error instanceof Error ? error.message : "Unable to load the dashboard."
        );
      } finally {
        if (active) {
          setIsLoadingDashboard(false);
        }
      }
    }

    void syncDashboard();

    return () => {
      active = false;
    };
  }, [isLoadingSession, selectedDate, sessionUser]);

  useEffect(() => {
    if (!selectedImage) {
      setImagePreviewUrl(null);
      return;
    }

    const previewUrl = URL.createObjectURL(selectedImage);
    setImagePreviewUrl(previewUrl);

    return () => {
      URL.revokeObjectURL(previewUrl);
    };
  }, [selectedImage]);

  async function handleAnalyzeMeal(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setAnalysisError(null);
    setMutationError(null);

    if (!selectedImage) {
      setAnalysisError("Upload a meal photo before analyzing.");
      return;
    }

    if (!description.trim()) {
      setAnalysisError("Add a short description to guide the estimate.");
      return;
    }

    setIsAnalyzing(true);

    try {
      const formData = new FormData();
      formData.append("image", selectedImage);
      formData.append("description", description.trim());
      formData.append("mealType", mealType);

      const response = await fetch("/api/meals/analyze", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        const message = await readErrorMessage(response);
        handleSignedOut(message);
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as MealAnalysisResponse;
      setAnalysisResponse(payload);
      setReviewDraft(createReviewDraft(payload.analysis, selectedDate));
    } catch (error) {
      setAnalysisError(
        error instanceof Error ? error.message : "Unable to analyze the meal."
      );
    } finally {
      setIsAnalyzing(false);
    }
  }

  function resetComposer() {
    setDescription("");
    setMealType("LUNCH");
    setSelectedImage(null);
    setAnalysisResponse(null);
    setReviewDraft(null);
    setAnalysisError(null);
  }

  async function handleSaveMeal() {
    if (!analysisResponse || !reviewDraft) {
      return;
    }

    const assumptions = reviewDraft.assumptions
      .split("\n")
      .map((assumption) => assumption.trim())
      .filter(Boolean);

    if (assumptions.length === 0) {
      setMutationError("Keep at least one assumption before saving the meal.");
      return;
    }

    setIsSaving(true);
    setMutationError(null);

    try {
      const formData = new FormData();

      if (selectedImage) {
        formData.append("image", selectedImage);
      }

      formData.append("description", description.trim());
      formData.append("mealType", mealType);
      formData.append(
        "analysis",
        JSON.stringify({
          mealName: reviewDraft.mealName.trim(),
          estimatedCalories: Number(reviewDraft.estimatedCalories),
          proteinG: Number(reviewDraft.proteinG),
          carbsG: Number(reviewDraft.carbsG),
          fatG: Number(reviewDraft.fatG),
          confidence: analysisResponse.analysis.confidence,
          assumptions,
          estimatedComponents: analysisResponse.analysis.estimatedComponents,
        })
      );
      formData.append("analysisSource", analysisResponse.source);
      formData.append("analysisModel", analysisResponse.model);
      formData.append("consumedAt", new Date(reviewDraft.consumedAt).toISOString());

      const response = await fetch("/api/meals", {
        method: "POST",
        body: formData,
      });

      if (response.status === 401) {
        const message = await readErrorMessage(response);
        handleSignedOut(message);
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      resetComposer();
      await loadDashboard(selectedDate);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to save the meal.");
    } finally {
      setIsSaving(false);
    }
  }

  function startEditMeal(meal: MealLogRecord) {
    setEditingMealId(meal.id);
    setEditDraft(createEditDraft(meal));
  }

  function cancelEditing() {
    setEditingMealId(null);
    setEditDraft(null);
  }

  async function handleUpdateMeal(mealId: string) {
    if (!editDraft) {
      return;
    }

    setBusyMealId(mealId);
    setMutationError(null);

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          mealName: editDraft.mealName.trim(),
          description: editDraft.description.trim(),
          mealType: editDraft.mealType,
          estimatedCalories: Number(editDraft.estimatedCalories),
          proteinG: Number(editDraft.proteinG),
          carbsG: Number(editDraft.carbsG),
          fatG: Number(editDraft.fatG),
          assumptions: editDraft.assumptions
            .split("\n")
            .map((assumption) => assumption.trim())
            .filter(Boolean),
          consumedAt: new Date(editDraft.consumedAt).toISOString(),
        }),
      });

      if (response.status === 401) {
        const message = await readErrorMessage(response);
        handleSignedOut(message);
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      cancelEditing();
      await loadDashboard(selectedDate);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to update the meal.");
    } finally {
      setBusyMealId(null);
    }
  }

  async function handleDeleteMeal(mealId: string) {
    const confirmed = window.confirm("Delete this meal from the log?");

    if (!confirmed) {
      return;
    }

    setBusyMealId(mealId);
    setMutationError(null);

    try {
      const response = await fetch(`/api/meals/${mealId}`, {
        method: "DELETE",
      });

      if (response.status === 401) {
        const message = await readErrorMessage(response);
        handleSignedOut(message);
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      if (editingMealId === mealId) {
        cancelEditing();
      }

      await loadDashboard(selectedDate);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to delete the meal.");
    } finally {
      setBusyMealId(null);
    }
  }

  async function handleSaveSettings() {
    if (!settingsDraft) {
      return;
    }

    setIsSavingSettings(true);
    setMutationError(null);

    try {
      const response = await fetch("/api/settings", {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          calories: Number(settingsDraft.calories),
          proteinG: Number(settingsDraft.proteinG),
          carbsMinG: Number(settingsDraft.carbsMinG),
          carbsMaxG: Number(settingsDraft.carbsMaxG),
          fatMinG: Number(settingsDraft.fatMinG),
          fatMaxG: Number(settingsDraft.fatMaxG),
        }),
      });

      if (response.status === 401) {
        const message = await readErrorMessage(response);
        handleSignedOut(message);
        throw new Error(message);
      }

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      await loadDashboard(selectedDate);
    } catch (error) {
      setMutationError(error instanceof Error ? error.message : "Unable to save targets.");
    } finally {
      setIsSavingSettings(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="glass-panel animate-rise overflow-hidden bg-halo p-6 sm:p-8">
        <div className="flex flex-col gap-6 xl:flex-row xl:items-end xl:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Full Meal Tracker</p>
            <h1 className="mt-3 max-w-2xl text-4xl leading-tight text-clay-900 sm:text-5xl">
              Log meals with saved photos, adjustable targets, and a rolling cut dashboard.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-clay-600 sm:text-lg">
              Analyze from a photo, review the estimate before saving, jump across days,
              and keep a clearer view of where your calories and macros are trending.
            </p>
          </div>

          <div className="w-full xl:max-w-xl">
            <div className="rounded-[22px] border border-white/60 bg-white/70 p-4">
              {isLoadingSession ? (
                <p className="text-sm text-clay-500">Checking your account session...</p>
              ) : sessionUser ? (
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
                  <div>
                    <p className="section-label">Signed In</p>
                    <p className="mt-2 text-lg font-semibold text-clay-900">
                      {sessionUser.name || sessionUser.email}
                    </p>
                    <p className="mt-1 text-sm text-clay-500">{sessionUser.email}</p>
                  </div>
                  <button
                    className="rounded-full border border-clay-200 bg-white px-4 py-2 text-sm font-semibold text-clay-700 transition hover:border-clay-400"
                    onClick={() => void handleSignOut()}
                    type="button"
                  >
                    Sign out
                  </button>
                </div>
              ) : (
                <div>
                  <p className="section-label">Private Accounts</p>
                  <p className="mt-2 text-lg font-semibold text-clay-900">
                    One shared link, separate dashboards.
                  </p>
                  <p className="mt-1 text-sm text-clay-500">
                    Sign in below to keep meals, targets, and saved photos attached to
                    your own account.
                  </p>
                </div>
              )}
            </div>

            <div className="mt-3 grid gap-3 sm:grid-cols-2">
              <div className="rounded-[22px] border border-white/60 bg-white/70 p-4">
                <p className="section-label">Selected Day</p>
                <p className="mt-3 text-3xl font-semibold text-clay-900">
                  {formatDisplayDate(selectedDate)}
                </p>
                <p className="mt-1 text-sm text-clay-500">
                  {isToday(selectedDate) ? "Today’s live log." : "Reviewing a past day."}
                </p>
              </div>
              <div className="rounded-[22px] border border-white/60 bg-white/70 p-4">
                <p className="section-label">
                  {sessionUser ? "Photo Memory" : "Account Access"}
                </p>
                <p className="mt-3 text-3xl font-semibold text-clay-900">
                  {sessionUser
                    ? dashboard?.meals.filter((meal) => meal.photoUrl).length ?? 0
                    : "24/7"}
                </p>
                <p className="mt-1 text-sm text-clay-500">
                  {sessionUser
                    ? "Saved meal photos on the selected day."
                    : "Log in from any device and open your own private dashboard."}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {isLoadingSession ? (
        <section className="glass-panel animate-rise rounded-[28px] p-6 text-sm text-clay-500">
          Loading your secure session...
        </section>
      ) : !sessionUser ? (
        <AuthPanel
          draft={authDraft}
          error={authError}
          isSubmitting={isSubmittingAuth}
          mode={authMode}
          onDraftChange={updateAuthDraft}
          onModeChange={(mode) => {
            setAuthMode(mode);
            setAuthError(null);
          }}
          onSubmit={handleAuthSubmit}
        />
      ) : (
        <>
          {mutationError ? (
            <div className="rounded-[22px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {mutationError}
            </div>
          ) : null}

      <section className="glass-panel animate-rise p-5 sm:p-6">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-end lg:justify-between">
          <div>
            <p className="section-label">Date Navigation</p>
            <h2 className="mt-3 text-2xl text-clay-900">Move through your log by day</h2>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              className="rounded-full border border-clay-200 bg-white px-4 py-3 text-sm font-semibold text-clay-700 transition hover:border-clay-400"
              onClick={() => setSelectedDate((current) => addDays(current, -1))}
              type="button"
            >
              Previous day
            </button>
            <input
              className="rounded-full border border-clay-200 bg-white px-4 py-3 text-sm font-semibold text-clay-700 outline-none focus:border-ember-500"
              onChange={(event) => setSelectedDate(event.target.value)}
              type="date"
              value={selectedDate}
            />
            <button
              className="rounded-full border border-clay-200 bg-white px-4 py-3 text-sm font-semibold text-clay-700 transition hover:border-clay-400 disabled:cursor-not-allowed disabled:text-clay-300"
              disabled={isToday(selectedDate)}
              onClick={() => setSelectedDate(getDateKey())}
              type="button"
            >
              Jump to today
            </button>
          </div>
        </div>
      </section>

      <div className="grid gap-6 xl:grid-cols-[1.08fr_0.92fr]">
        <section className="glass-panel animate-rise p-5 sm:p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <p className="section-label">Meal Capture</p>
              <h2 className="mt-3 text-2xl text-clay-900">Analyze, review, then log</h2>
            </div>
            <span className="rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-medium uppercase tracking-[0.18em] text-clay-600">
              Photo saved
            </span>
          </div>

          <form className="mt-6 space-y-5" onSubmit={handleAnalyzeMeal}>
            <div className="grid gap-5 md:grid-cols-[0.9fr_1.1fr]">
              <label className="flex min-h-64 cursor-pointer flex-col justify-between rounded-[24px] border border-dashed border-clay-300 bg-clay-50/70 p-4 transition hover:border-ember-500 hover:bg-white">
                <div>
                  <p className="section-label">Meal Image</p>
                  <p className="mt-3 text-lg font-medium text-clay-900">
                    {selectedImage ? selectedImage.name : "Tap to upload a plate shot"}
                  </p>
                  <p className="mt-2 text-sm leading-6 text-clay-500">
                    JPG, PNG, or WebP up to 8 MB. Saved meals keep the original image.
                  </p>
                </div>

                <div className="mt-4">
                  <PhotoFrame
                    alt="Meal preview"
                    heightClassName="h-44"
                    photoUrl={imagePreviewUrl}
                    sourceImageName={selectedImage?.name ?? null}
                  />
                </div>

                <input
                  accept="image/jpeg,image/png,image/webp"
                  className="sr-only"
                  onChange={(event) => setSelectedImage(event.target.files?.[0] ?? null)}
                  type="file"
                />
              </label>

              <div className="space-y-5">
                <div>
                  <label className="section-label" htmlFor="mealType">
                    Meal Type
                  </label>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    {MEAL_TYPE_OPTIONS.map((option) => (
                      <button
                        key={option.value}
                        className={clsx(
                          "rounded-[18px] border px-4 py-3 text-sm font-medium transition",
                          mealType === option.value
                            ? "border-sage-500 bg-sage-500 text-white"
                            : "border-clay-200 bg-white text-clay-700 hover:border-sage-300"
                        )}
                        onClick={() => setMealType(option.value)}
                        type="button"
                      >
                        {option.label}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="section-label" htmlFor="description">
                    Short Description
                  </label>
                  <textarea
                    className="mt-3 min-h-40 w-full rounded-[24px] border border-clay-200 bg-white px-4 py-4 text-base text-clay-900 outline-none transition placeholder:text-clay-400 focus:border-ember-500"
                    id="description"
                    onChange={(event) => setDescription(event.target.value)}
                    placeholder="steak, peppers, mozzarella, 1 tsp olive oil"
                    value={description}
                  />
                  <p className="mt-2 text-sm text-clay-500">
                    Ingredients, fats, sauces, and portion clues all help the estimate.
                  </p>
                </div>
              </div>
            </div>

            {analysisError ? (
              <div className="rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {analysisError}
              </div>
            ) : null}

            <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
              <button
                className="inline-flex items-center justify-center rounded-full bg-clay-900 px-6 py-3 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
                disabled={isAnalyzing}
                type="submit"
              >
                {isAnalyzing ? "Analyzing meal..." : "Estimate macros"}
              </button>

              <button
                className="inline-flex items-center justify-center rounded-full border border-clay-200 bg-white px-6 py-3 text-sm font-semibold text-clay-700 transition hover:border-clay-400"
                onClick={resetComposer}
                type="button"
              >
                Reset
              </button>
            </div>
          </form>

          {analysisResponse && reviewDraft ? (
            <div className="mt-6 rounded-[26px] border border-sage-100 bg-gradient-to-br from-white to-sage-50 p-5">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
                <div>
                  <div className="flex flex-wrap items-center gap-2">
                    <span className="rounded-full border border-sage-200 bg-white px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-sage-700">
                      {SOURCE_LABELS[analysisResponse.source]}
                    </span>
                    <span className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs text-clay-600">
                      {analysisResponse.model}
                    </span>
                  </div>
                  <h3 className="mt-4 text-2xl text-clay-900">Review before save</h3>
                  <p className="mt-2 text-sm text-clay-600">
                    Confidence:{" "}
                    <span className="font-semibold capitalize text-clay-900">
                      {analysisResponse.analysis.confidence.label}
                    </span>{" "}
                    ({Math.round(analysisResponse.analysis.confidence.score * 100)}%)
                  </p>
                </div>

                <button
                  className="inline-flex items-center justify-center rounded-full bg-sage-600 px-5 py-3 text-sm font-semibold text-white transition hover:bg-sage-700 disabled:cursor-not-allowed disabled:bg-sage-300"
                  disabled={isSaving}
                  onClick={handleSaveMeal}
                  type="button"
                >
                  {isSaving ? "Saving..." : `Save to ${formatShortDate(selectedDate)}`}
                </button>
              </div>

              <div className="mt-5 grid gap-5 lg:grid-cols-[0.9fr_1.1fr]">
                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-clay-700">Meal name</span>
                    <input
                      className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                      onChange={(event) =>
                        setReviewDraft((current) =>
                          current ? { ...current, mealName: event.target.value } : current
                        )
                      }
                      value={reviewDraft.mealName}
                    />
                  </label>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <label className="block">
                      <span className="text-sm font-medium text-clay-700">Calories</span>
                      <input
                        className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                        inputMode="numeric"
                        onChange={(event) =>
                          setReviewDraft((current) =>
                            current
                              ? { ...current, estimatedCalories: event.target.value }
                              : current
                          )
                        }
                        value={reviewDraft.estimatedCalories}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-clay-700">Protein</span>
                      <input
                        className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                        inputMode="decimal"
                        onChange={(event) =>
                          setReviewDraft((current) =>
                            current ? { ...current, proteinG: event.target.value } : current
                          )
                        }
                        value={reviewDraft.proteinG}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-clay-700">Carbs</span>
                      <input
                        className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                        inputMode="decimal"
                        onChange={(event) =>
                          setReviewDraft((current) =>
                            current ? { ...current, carbsG: event.target.value } : current
                          )
                        }
                        value={reviewDraft.carbsG}
                      />
                    </label>
                    <label className="block">
                      <span className="text-sm font-medium text-clay-700">Fat</span>
                      <input
                        className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                        inputMode="decimal"
                        onChange={(event) =>
                          setReviewDraft((current) =>
                            current ? { ...current, fatG: event.target.value } : current
                          )
                        }
                        value={reviewDraft.fatG}
                      />
                    </label>
                  </div>

                  <label className="block">
                    <span className="text-sm font-medium text-clay-700">Log time</span>
                    <input
                      className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                      onChange={(event) =>
                        setReviewDraft((current) =>
                          current ? { ...current, consumedAt: event.target.value } : current
                        )
                      }
                      type="datetime-local"
                      value={reviewDraft.consumedAt}
                    />
                  </label>
                </div>

                <div className="space-y-4">
                  <label className="block">
                    <span className="text-sm font-medium text-clay-700">
                      Assumptions (one per line)
                    </span>
                    <textarea
                      className="mt-2 min-h-48 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                      onChange={(event) =>
                        setReviewDraft((current) =>
                          current
                            ? { ...current, assumptions: event.target.value }
                            : current
                        )
                      }
                      value={reviewDraft.assumptions}
                    />
                  </label>

                  <div>
                    <p className="section-label">Component Breakdown</p>
                    <div className="mt-3 space-y-3">
                      {analysisResponse.analysis.estimatedComponents.map((component) => (
                        <div
                          key={`${component.name}-${component.estimatedAmount}`}
                          className="rounded-[20px] border border-clay-100 bg-white/80 px-4 py-4"
                        >
                          <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
                            <div>
                              <p className="text-lg font-semibold text-clay-900">
                                {component.name}
                              </p>
                              <p className="text-sm text-clay-500">
                                {component.estimatedAmount}
                              </p>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm text-clay-600 sm:text-right">
                              <span>{component.calories} kcal</span>
                              <span>{formatMacroValue(component.proteinG)} P</span>
                              <span>{formatMacroValue(component.carbsG)} C</span>
                              <span>{formatMacroValue(component.fatG)} F</span>
                            </div>
                          </div>
                          <p className="mt-3 text-sm leading-6 text-clay-500">
                            {component.notes}
                          </p>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-5">
                <MacroStrip
                  calories={Number(reviewDraft.estimatedCalories) || 0}
                  carbsG={Number(reviewDraft.carbsG) || 0}
                  fatG={Number(reviewDraft.fatG) || 0}
                  proteinG={Number(reviewDraft.proteinG) || 0}
                />
              </div>
            </div>
          ) : null}
        </section>

        <aside className="space-y-6">
          <section className="glass-panel animate-rise p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
              <div>
                <p className="section-label">Daily Dashboard</p>
                <h2 className="mt-3 text-2xl text-clay-900">
                  {dashboard ? formatDisplayDate(dashboard.date) : formatDisplayDate(selectedDate)}
                </h2>
              </div>

              {dashboard ? (
                <span
                  className={clsx(
                    "rounded-full border px-4 py-2 text-xs font-semibold uppercase tracking-[0.18em]",
                    toneClassName(dashboard.status.tone)
                  )}
                >
                  {dashboard.status.label}
                </span>
              ) : null}
            </div>

            {dashboardError ? (
              <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
                {dashboardError}
              </div>
            ) : null}

            {isLoadingDashboard && !dashboard ? (
              <div className="mt-6 rounded-[24px] border border-clay-100 bg-white/80 p-6 text-sm text-clay-500">
                Loading the selected day...
              </div>
            ) : null}

            {dashboard ? (
              <div className="mt-6 space-y-5">
                <div className="grid gap-3 sm:grid-cols-2">
                  <SummaryCard
                    label="Calories"
                    progress={progressWidth(
                      dashboard.totals.calories,
                      dashboard.settings.targets.calories
                    )}
                    suffix={`/ ${dashboard.settings.targets.calories} kcal`}
                    value={String(dashboard.totals.calories)}
                  />
                  <SummaryCard
                    label="Protein"
                    progress={progressWidth(
                      dashboard.totals.proteinG,
                      dashboard.settings.targets.proteinG
                    )}
                    suffix={`/ ${dashboard.settings.targets.proteinG} g`}
                    value={formatMacroValue(dashboard.totals.proteinG)}
                  />
                  <SummaryCard
                    label="Carbs"
                    progress={progressWidth(
                      dashboard.totals.carbsG,
                      dashboard.settings.targets.carbsG.max
                    )}
                    suffix={`range ${dashboard.settings.targets.carbsG.min}-${dashboard.settings.targets.carbsG.max} g`}
                    value={formatMacroValue(dashboard.totals.carbsG)}
                  />
                  <SummaryCard
                    label="Fat"
                    progress={progressWidth(
                      dashboard.totals.fatG,
                      dashboard.settings.targets.fatG.max
                    )}
                    suffix={`range ${dashboard.settings.targets.fatG.min}-${dashboard.settings.targets.fatG.max} g`}
                    value={formatMacroValue(dashboard.totals.fatG)}
                  />
                </div>

                <div className="rounded-[24px] border border-clay-100 bg-white/70 p-5">
                  <p className="section-label">Remaining Today</p>
                  <div className="mt-4 grid gap-3">
                    <div className="flex items-baseline justify-between gap-3 rounded-[18px] bg-clay-50 px-4 py-3">
                      <span className="text-sm text-clay-500">Calories</span>
                      <span className="text-base font-semibold text-clay-900">
                        {dashboard.remaining.calories} kcal
                      </span>
                    </div>
                    <div className="flex items-baseline justify-between gap-3 rounded-[18px] bg-clay-50 px-4 py-3">
                      <span className="text-sm text-clay-500">Protein</span>
                      <span className="text-base font-semibold text-clay-900">
                        {formatMacroValue(dashboard.remaining.proteinG)} g to goal
                      </span>
                    </div>
                    <div className="rounded-[18px] bg-clay-50 px-4 py-3">
                      <p className="text-sm text-clay-500">Carbs</p>
                      <p className="mt-1 text-base font-semibold text-clay-900">
                        {rangeSummary(dashboard.remaining.carbsG)}
                      </p>
                    </div>
                    <div className="rounded-[18px] bg-clay-50 px-4 py-3">
                      <p className="text-sm text-clay-500">Fat</p>
                      <p className="mt-1 text-base font-semibold text-clay-900">
                        {rangeSummary(dashboard.remaining.fatG)}
                      </p>
                    </div>
                  </div>
                </div>

                <div className="rounded-[24px] border border-clay-100 bg-gradient-to-br from-clay-900 to-sage-900 p-5 text-white">
                  <p className="section-label !text-clay-200">Cut Status</p>
                  <h3 className="mt-3 text-2xl">{dashboard.status.label}</h3>
                  <ul className="mt-4 space-y-2 text-sm leading-6 text-clay-100">
                    {dashboard.status.reasons.map((reason) => (
                      <li key={reason} className="rounded-[16px] bg-white/10 px-4 py-3">
                        {reason}
                      </li>
                    ))}
                  </ul>
                </div>
              </div>
            ) : null}
          </section>

          <section className="glass-panel animate-rise p-5 sm:p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="section-label">Saved Targets</p>
                <h2 className="mt-3 text-2xl text-clay-900">Adjust your cut plan</h2>
              </div>
              <button
                className="rounded-full bg-clay-900 px-4 py-2 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
                disabled={!settingsDraft || isSavingSettings}
                onClick={handleSaveSettings}
                type="button"
              >
                {isSavingSettings ? "Saving..." : "Save targets"}
              </button>
            </div>

            {settingsDraft ? (
              <div className="mt-5 grid gap-3 sm:grid-cols-2">
                <label className="block">
                  <span className="text-sm font-medium text-clay-700">Calories</span>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                    inputMode="numeric"
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, calories: event.target.value } : current
                      )
                    }
                    value={settingsDraft.calories}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-clay-700">Protein target</span>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                    inputMode="decimal"
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, proteinG: event.target.value } : current
                      )
                    }
                    value={settingsDraft.proteinG}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-clay-700">Carbs min</span>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                    inputMode="decimal"
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, carbsMinG: event.target.value } : current
                      )
                    }
                    value={settingsDraft.carbsMinG}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-clay-700">Carbs max</span>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                    inputMode="decimal"
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, carbsMaxG: event.target.value } : current
                      )
                    }
                    value={settingsDraft.carbsMaxG}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-clay-700">Fat min</span>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                    inputMode="decimal"
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, fatMinG: event.target.value } : current
                      )
                    }
                    value={settingsDraft.fatMinG}
                  />
                </label>
                <label className="block">
                  <span className="text-sm font-medium text-clay-700">Fat max</span>
                  <input
                    className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                    inputMode="decimal"
                    onChange={(event) =>
                      setSettingsDraft((current) =>
                        current ? { ...current, fatMaxG: event.target.value } : current
                      )
                    }
                    value={settingsDraft.fatMaxG}
                  />
                </label>
              </div>
            ) : null}
          </section>
        </aside>
      </div>

      <section className="glass-panel animate-rise p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Seven-Day View</p>
            <h2 className="mt-3 text-2xl text-clay-900">Recent history and trendline</h2>
          </div>
          {dashboard ? (
            <p className="text-sm text-clay-500">
              {dashboard.weeklyTrend.daysLogged} logged day
              {dashboard.weeklyTrend.daysLogged === 1 ? "" : "s"} in the last week
            </p>
          ) : null}
        </div>

        {dashboard ? (
          <div className="mt-6 grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
            <div className="grid gap-3 sm:grid-cols-3 lg:grid-cols-7">
              {dashboard.history.map((summary) => (
                <HistoryDayButton
                  isSelected={summary.date === selectedDate}
                  key={summary.date}
                  onSelect={setSelectedDate}
                  summary={summary}
                />
              ))}
            </div>

            <div className="rounded-[24px] border border-clay-100 bg-clay-50/70 p-5">
              <p className="section-label">Weekly Trend</p>
              <div className="mt-4 grid gap-3 sm:grid-cols-2">
                <MetricChip
                  helper="avg kcal"
                  label="Calories"
                  value={String(dashboard.weeklyTrend.averageCalories)}
                />
                <MetricChip
                  helper="avg grams"
                  label="Protein"
                  value={formatMacroValue(dashboard.weeklyTrend.averageProteinG)}
                />
                <MetricChip
                  helper="on-track days"
                  label="Green Days"
                  value={String(dashboard.weeklyTrend.onTrackDays)}
                />
                <MetricChip
                  helper="over-target days"
                  label="Red Days"
                  value={String(dashboard.weeklyTrend.overTargetDays)}
                />
              </div>
            </div>
          </div>
        ) : null}
      </section>

      <section className="glass-panel animate-rise p-5 sm:p-6">
        <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <p className="section-label">Meal Library</p>
            <h2 className="mt-3 text-2xl text-clay-900">Meals for {formatDisplayDate(selectedDate)}</h2>
          </div>
          {dashboard ? (
            <p className="text-sm text-clay-500">
              {dashboard.meals.length} meal{dashboard.meals.length === 1 ? "" : "s"} on this
              day
            </p>
          ) : null}
        </div>

        {dashboard && dashboard.meals.length === 0 ? (
          <div className="mt-6 rounded-[24px] border border-dashed border-clay-200 bg-white/60 px-6 py-10 text-center text-sm text-clay-500">
            No meals are logged for this day yet. Analyze a meal and save it here.
          </div>
        ) : null}

        <div className="mt-6 space-y-4">
          {dashboard?.meals.map((meal) => {
            const isEditingMeal = editingMealId === meal.id;

            return (
              <article
                key={meal.id}
                className="rounded-[26px] border border-clay-100 bg-white/75 p-5"
              >
                <div className="grid gap-5 lg:grid-cols-[0.38fr_0.62fr]">
                  <div className="space-y-4">
                    <PhotoFrame
                      alt={meal.mealName}
                      heightClassName="h-60"
                      photoUrl={meal.photoUrl}
                      sourceImageName={meal.sourceImageName}
                    />
                    <div className="rounded-[20px] border border-clay-100 bg-clay-50/70 px-4 py-4">
                      <p className="section-label">Logged</p>
                      <p className="mt-2 text-lg font-semibold text-clay-900">
                        {formatShortDate(getDateKey(new Date(meal.consumedAt)))} at{" "}
                        {timeLabel(meal.consumedAt)}
                      </p>
                      <p className="mt-2 text-sm text-clay-500">
                        {SOURCE_LABELS[meal.analysisSource]} • {meal.analysisModel}
                      </p>
                    </div>
                  </div>

                  <div>
                    <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="rounded-full border border-clay-200 bg-clay-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.18em] text-clay-600">
                            {mealTypeLabel(meal.mealType)}
                          </span>
                          <span className="rounded-full border border-clay-200 bg-white px-3 py-1 text-xs text-clay-500">
                            Confidence {Math.round(meal.confidence.score * 100)}%
                          </span>
                        </div>
                        <h3 className="mt-4 text-2xl text-clay-900">{meal.mealName}</h3>
                        <p className="mt-2 max-w-2xl text-sm leading-6 text-clay-600">
                          {meal.description}
                        </p>
                      </div>

                      <div className="flex flex-wrap gap-2">
                        <button
                          className="rounded-full border border-clay-200 bg-white px-4 py-2 text-sm font-medium text-clay-700 transition hover:border-clay-400"
                          onClick={() => startEditMeal(meal)}
                          type="button"
                        >
                          Edit
                        </button>
                        <button
                          className="rounded-full border border-rose-200 bg-white px-4 py-2 text-sm font-medium text-rose-700 transition hover:border-rose-400 disabled:cursor-not-allowed disabled:text-rose-300"
                          disabled={busyMealId === meal.id}
                          onClick={() => void handleDeleteMeal(meal.id)}
                          type="button"
                        >
                          Delete
                        </button>
                      </div>
                    </div>

                    <div className="mt-5">
                      <MacroStrip
                        calories={meal.estimatedCalories}
                        carbsG={meal.carbsG}
                        fatG={meal.fatG}
                        proteinG={meal.proteinG}
                      />
                    </div>

                    {isEditingMeal && editDraft ? (
                      <div className="mt-5 rounded-[24px] border border-clay-200 bg-clay-50/70 p-5">
                        <p className="section-label">Edit Meal</p>
                        <div className="mt-4 grid gap-4 md:grid-cols-2">
                          <div className="space-y-4">
                            <label className="block">
                              <span className="text-sm font-medium text-clay-700">Meal name</span>
                              <input
                                className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                onChange={(event) =>
                                  setEditDraft((current) =>
                                    current
                                      ? { ...current, mealName: event.target.value }
                                      : current
                                  )
                                }
                                value={editDraft.mealName}
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-clay-700">
                                Description
                              </span>
                              <textarea
                                className="mt-2 min-h-28 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                onChange={(event) =>
                                  setEditDraft((current) =>
                                    current
                                      ? { ...current, description: event.target.value }
                                      : current
                                  )
                                }
                                value={editDraft.description}
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-clay-700">Meal type</span>
                              <select
                                className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                onChange={(event) =>
                                  setEditDraft((current) =>
                                    current
                                      ? {
                                          ...current,
                                          mealType: event.target.value as MealType,
                                        }
                                      : current
                                  )
                                }
                                value={editDraft.mealType}
                              >
                                {MEAL_TYPE_OPTIONS.map((option) => (
                                  <option key={option.value} value={option.value}>
                                    {option.label}
                                  </option>
                                ))}
                              </select>
                            </label>
                          </div>

                          <div className="space-y-4">
                            <div className="grid gap-3 sm:grid-cols-2">
                              <label className="block">
                                <span className="text-sm font-medium text-clay-700">
                                  Calories
                                </span>
                                <input
                                  className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                  inputMode="numeric"
                                  onChange={(event) =>
                                    setEditDraft((current) =>
                                      current
                                        ? {
                                            ...current,
                                            estimatedCalories: event.target.value,
                                          }
                                        : current
                                    )
                                  }
                                  value={editDraft.estimatedCalories}
                                />
                              </label>
                              <label className="block">
                                <span className="text-sm font-medium text-clay-700">
                                  Protein
                                </span>
                                <input
                                  className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setEditDraft((current) =>
                                      current ? { ...current, proteinG: event.target.value } : current
                                    )
                                  }
                                  value={editDraft.proteinG}
                                />
                              </label>
                              <label className="block">
                                <span className="text-sm font-medium text-clay-700">Carbs</span>
                                <input
                                  className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setEditDraft((current) =>
                                      current ? { ...current, carbsG: event.target.value } : current
                                    )
                                  }
                                  value={editDraft.carbsG}
                                />
                              </label>
                              <label className="block">
                                <span className="text-sm font-medium text-clay-700">Fat</span>
                                <input
                                  className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                  inputMode="decimal"
                                  onChange={(event) =>
                                    setEditDraft((current) =>
                                      current ? { ...current, fatG: event.target.value } : current
                                    )
                                  }
                                  value={editDraft.fatG}
                                />
                              </label>
                            </div>

                            <label className="block">
                              <span className="text-sm font-medium text-clay-700">Log time</span>
                              <input
                                className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                onChange={(event) =>
                                  setEditDraft((current) =>
                                    current
                                      ? { ...current, consumedAt: event.target.value }
                                      : current
                                  )
                                }
                                type="datetime-local"
                                value={editDraft.consumedAt}
                              />
                            </label>

                            <label className="block">
                              <span className="text-sm font-medium text-clay-700">
                                Assumptions
                              </span>
                              <textarea
                                className="mt-2 min-h-32 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none focus:border-ember-500"
                                onChange={(event) =>
                                  setEditDraft((current) =>
                                    current
                                      ? { ...current, assumptions: event.target.value }
                                      : current
                                  )
                                }
                                value={editDraft.assumptions}
                              />
                            </label>
                          </div>
                        </div>

                        <div className="mt-5 flex flex-col gap-3 sm:flex-row">
                          <button
                            className="rounded-full bg-clay-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
                            disabled={busyMealId === meal.id}
                            onClick={() => void handleUpdateMeal(meal.id)}
                            type="button"
                          >
                            {busyMealId === meal.id ? "Saving changes..." : "Save changes"}
                          </button>
                          <button
                            className="rounded-full border border-clay-200 bg-white px-5 py-3 text-sm font-semibold text-clay-700 transition hover:border-clay-400"
                            onClick={cancelEditing}
                            type="button"
                          >
                            Cancel
                          </button>
                        </div>
                      </div>
                    ) : (
                      <div className="mt-5 grid gap-4 lg:grid-cols-[0.95fr_1.05fr]">
                        <div>
                          <p className="section-label">Assumptions</p>
                          <ul className="mt-3 space-y-2 text-sm leading-6 text-clay-600">
                            {meal.assumptions.map((assumption) => (
                              <li
                                key={assumption}
                                className="rounded-[18px] border border-clay-100 bg-clay-50/70 px-4 py-3"
                              >
                                {assumption}
                              </li>
                            ))}
                          </ul>
                        </div>

                        <div>
                          <p className="section-label">Component Breakdown</p>
                          <div className="mt-3 space-y-3">
                            {meal.estimatedComponents.map((component) => (
                              <div
                                key={`${meal.id}-${component.name}-${component.estimatedAmount}`}
                                className="rounded-[20px] border border-clay-100 bg-clay-50/70 px-4 py-4"
                              >
                                <div className="flex flex-col gap-2 sm:flex-row sm:items-start sm:justify-between">
                                  <div>
                                    <p className="font-semibold text-clay-900">{component.name}</p>
                                    <p className="text-sm text-clay-500">
                                      {component.estimatedAmount}
                                    </p>
                                  </div>
                                  <div className="grid grid-cols-2 gap-2 text-sm text-clay-600 sm:text-right">
                                    <span>{component.calories} kcal</span>
                                    <span>{formatMacroValue(component.proteinG)} P</span>
                                    <span>{formatMacroValue(component.carbsG)} C</span>
                                    <span>{formatMacroValue(component.fatG)} F</span>
                                  </div>
                                </div>
                                <p className="mt-3 text-sm leading-6 text-clay-500">
                                  {component.notes}
                                </p>
                              </div>
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      </section>
        </>
      )}
    </main>
  );
}
