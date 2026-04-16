import "server-only";

import { prisma } from "@/lib/prisma";
import { serverEnv } from "@/lib/server-env";
import type { AdminUserSummary, AdminUsersResponse } from "@/lib/types";

const SEVEN_DAYS_MS = 7 * 24 * 60 * 60 * 1000;

function getAdminEmailSet() {
  return new Set(
    serverEnv.ADMIN_EMAILS.split(",")
      .map((value) => value.trim().toLowerCase())
      .filter(Boolean)
  );
}

export function hasConfiguredAdmins() {
  return getAdminEmailSet().size > 0;
}

export function isAdminEmail(email: string) {
  return getAdminEmailSet().has(email.trim().toLowerCase());
}

function getLastActivityAt(user: {
  createdAt: Date;
  updatedAt: Date;
  settings: { updatedAt: Date } | null;
  sessions: Array<{ createdAt: Date }>;
  meals: Array<{ consumedAt: Date; updatedAt: Date }>;
}) {
  const candidates = [
    user.createdAt,
    user.updatedAt,
    user.settings?.updatedAt,
    user.sessions[0]?.createdAt,
    user.meals[0]?.updatedAt,
    user.meals[0]?.consumedAt,
  ].filter((value): value is Date => Boolean(value));

  return new Date(Math.max(...candidates.map((value) => value.getTime())));
}

export async function getAdminUsersSnapshot(): Promise<AdminUsersResponse> {
  const users = await prisma.user.findMany({
    select: {
      id: true,
      email: true,
      name: true,
      createdAt: true,
      updatedAt: true,
      settings: {
        select: {
          updatedAt: true,
        },
      },
      sessions: {
        orderBy: {
          createdAt: "desc",
        },
        take: 1,
        select: {
          createdAt: true,
        },
      },
      meals: {
        orderBy: {
          updatedAt: "desc",
        },
        take: 1,
        select: {
          consumedAt: true,
          updatedAt: true,
        },
      },
      _count: {
        select: {
          meals: true,
        },
      },
    },
    orderBy: {
      createdAt: "desc",
    },
  });

  const summaries: AdminUserSummary[] = users
    .map((user) => {
      const lastActivityAt = getLastActivityAt(user);

      return {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
        mealCount: user._count.meals,
        lastActivityAt: lastActivityAt.toISOString(),
      };
    })
    .sort(
      (left, right) =>
        new Date(right.lastActivityAt).getTime() - new Date(left.lastActivityAt).getTime()
    );

  const totalMeals = summaries.reduce((sum, user) => sum + user.mealCount, 0);
  const now = Date.now();
  const activeLast7Days = summaries.filter(
    (user) => now - new Date(user.lastActivityAt).getTime() <= SEVEN_DAYS_MS
  ).length;

  return {
    summary: {
      signedUpUsers: summaries.length,
      totalMeals,
      activeLast7Days,
    },
    users: summaries,
  };
}
