import "server-only";

import { createHash } from "node:crypto";
import path from "node:path";

import { RUNTIME_MEAL_PHOTO_STORAGE_DIR } from "@/lib/file-storage";
import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/server-env";
import type { AdminSystemDiagnosticsResponse } from "@/lib/types";

const SESSION_TTL_DAYS = 30;

function isSqliteDatabaseUrl(databaseUrl: string) {
  return databaseUrl.startsWith("file:");
}

function resolveDatabaseFilePath(databaseUrl: string) {
  if (!isSqliteDatabaseUrl(databaseUrl)) {
    return null;
  }

  const rawPath = databaseUrl.slice("file:".length);

  if (!rawPath) {
    return null;
  }

  return rawPath.startsWith("/") ? rawPath : path.resolve(process.cwd(), rawPath);
}

function isInsideDirectory(targetPath: string, parentPath: string) {
  const normalizedTarget = path.resolve(targetPath);
  const normalizedParent = path.resolve(parentPath);

  return (
    normalizedTarget === normalizedParent ||
    normalizedTarget.startsWith(`${normalizedParent}${path.sep}`)
  );
}

function createAuthSecretFingerprint() {
  return createHash("sha256").update(serverEnv.AUTH_SECRET).digest("hex").slice(0, 12);
}

export async function getAdminSystemDiagnostics(): Promise<AdminSystemDiagnosticsResponse> {
  const isRailway = Boolean(process.env.RAILWAY_ENVIRONMENT_NAME || process.env.RAILWAY_STATIC_URL);
  const railwayEnvironmentName = process.env.RAILWAY_ENVIRONMENT_NAME ?? null;
  const railwayVolumeMountPath = process.env.RAILWAY_VOLUME_MOUNT_PATH?.trim() || null;
  const databaseFilePath = resolveDatabaseFilePath(serverEnv.DATABASE_URL);
  const usesRailwayVolumeForDatabase = Boolean(
    railwayVolumeMountPath &&
      databaseFilePath &&
      isInsideDirectory(databaseFilePath, railwayVolumeMountPath)
  );

  const [users, meals, sessions, settings, activeSessions] = await Promise.all([
    prisma.user.count(),
    prisma.mealLog.count(),
    prisma.session.count(),
    prisma.userSettings.count(),
    prisma.session.count({
      where: {
        expiresAt: {
          gt: new Date(),
        },
      },
    }),
  ]);

  const warnings: string[] = [];

  if (isRailway && isSqliteDatabaseUrl(serverEnv.DATABASE_URL) && !railwayVolumeMountPath) {
    warnings.push(
      "Railway volume mount was not detected. SQLite data may be running on ephemeral container storage."
    );
  }

  if (
    isRailway &&
    isSqliteDatabaseUrl(serverEnv.DATABASE_URL) &&
    railwayVolumeMountPath &&
    !usesRailwayVolumeForDatabase
  ) {
    warnings.push(
      `DATABASE_URL is not inside the mounted Railway volume at ${railwayVolumeMountPath}. Accounts and meals can appear to reset after deploys.`
    );
  }

  if (!serverEnv.ADMIN_EMAILS.trim()) {
    warnings.push("ADMIN_EMAILS is empty, so the admin dashboard is not available to any account.");
  }

  if (serverEnv.useMockAnalysis) {
    warnings.push(
      "OpenAI analysis is currently in fallback or mock mode, so meal estimates are not guaranteed to use live vision."
    );
  }

  warnings.push(
    "Changing AUTH_SECRET logs every user out by invalidating sessions, but it does not delete accounts from the database."
  );

  return {
    environment: {
      nodeEnv: process.env.NODE_ENV ?? "development",
      isRailway,
      railwayEnvironmentName,
    },
    persistence: {
      databaseUrlKind: isSqliteDatabaseUrl(serverEnv.DATABASE_URL) ? "sqlite" : "other",
      databaseTarget: isSqliteDatabaseUrl(serverEnv.DATABASE_URL)
        ? serverEnv.DATABASE_URL
        : "Non-SQLite database configured",
      databaseFilePath,
      railwayVolumeMountPath,
      usesRailwayVolumeForDatabase,
      mealPhotoStorageDir: RUNTIME_MEAL_PHOTO_STORAGE_DIR,
    },
    auth: {
      adminEmailsConfigured: Boolean(serverEnv.ADMIN_EMAILS.trim()),
      adminEmailCount: serverEnv.ADMIN_EMAILS.split(",")
        .map((value) => value.trim())
        .filter(Boolean).length,
      authSecretFingerprint: createAuthSecretFingerprint(),
      sessionTtlDays: SESSION_TTL_DAYS,
    },
    openAI: {
      hasApiKey: serverEnv.hasOpenAIKey,
      useMockAnalysis: serverEnv.useMockAnalysis,
      model: serverEnv.OPENAI_MEAL_MODEL,
    },
    databaseCounts: {
      users,
      meals,
      sessions,
      activeSessions,
      settings,
    },
    warnings,
  };
}
