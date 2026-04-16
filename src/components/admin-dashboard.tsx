"use client";

import Link from "next/link";
import { useEffect, useState } from "react";

import type { AdminUsersResponse } from "@/lib/types";

function formatDateTime(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    dateStyle: "medium",
    timeStyle: "short",
  }).format(new Date(value));
}

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

function SummaryCard({
  label,
  value,
  helper,
}: {
  label: string;
  value: string;
  helper: string;
}) {
  return (
    <div className="rounded-[22px] border border-clay-100 bg-white/80 p-4">
      <p className="section-label">{label}</p>
      <p className="mt-3 text-3xl font-semibold text-clay-900">{value}</p>
      <p className="mt-2 text-sm text-clay-500">{helper}</p>
    </div>
  );
}

export function AdminDashboard() {
  const [payload, setPayload] = useState<AdminUsersResponse | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    let active = true;

    async function loadUsers() {
      setIsLoading(true);
      setError(null);

      try {
        const response = await fetch("/api/admin/users", {
          cache: "no-store",
        });

        if (!response.ok) {
          throw new Error(await readErrorMessage(response));
        }

        const nextPayload = (await response.json()) as AdminUsersResponse;

        if (!active) {
          return;
        }

        setPayload(nextPayload);
      } catch (nextError) {
        if (!active) {
          return;
        }

        setError(
          nextError instanceof Error ? nextError.message : "Unable to load the admin dashboard."
        );
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    }

    void loadUsers();

    return () => {
      active = false;
    };
  }, []);

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-7xl flex-col gap-6 px-4 py-6 sm:px-6 lg:px-8 lg:py-8">
      <section className="glass-panel animate-rise overflow-hidden bg-halo p-6 sm:p-8">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-end lg:justify-between">
          <div className="max-w-3xl">
            <p className="section-label">Admin Dashboard</p>
            <h1 className="mt-3 text-4xl leading-tight text-clay-900 sm:text-5xl">
              Signed-up users, meal counts, and recent activity in one place.
            </h1>
            <p className="mt-4 max-w-2xl text-base leading-7 text-clay-600 sm:text-lg">
              This page is restricted to admin emails you explicitly whitelist in
              `ADMIN_EMAILS`.
            </p>
          </div>

          <Link
            className="inline-flex items-center justify-center rounded-full border border-clay-200 bg-white px-5 py-3 text-sm font-semibold text-clay-700 transition hover:border-clay-400"
            href="/"
          >
            Back to tracker
          </Link>
        </div>
      </section>

      {error ? (
        <section className="glass-panel animate-rise rounded-[28px] border border-rose-200 bg-rose-50 p-6">
          <p className="text-lg font-semibold text-rose-900">Admin access unavailable</p>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-rose-900">{error}</p>
          <p className="mt-4 text-sm text-rose-800">
            After you add your email to `ADMIN_EMAILS` and redeploy, open `/admin`
            again while signed in with that same email.
          </p>
        </section>
      ) : null}

      {isLoading ? (
        <section className="glass-panel animate-rise rounded-[28px] p-6 text-sm text-clay-500">
          Loading the admin snapshot...
        </section>
      ) : null}

      {payload ? (
        <>
          <section className="grid gap-4 sm:grid-cols-3">
            <SummaryCard
              helper="Accounts in the live app database"
              label="Signed-Up Users"
              value={String(payload.summary.signedUpUsers)}
            />
            <SummaryCard
              helper="Meals logged across all users"
              label="Meal Count"
              value={String(payload.summary.totalMeals)}
            />
            <SummaryCard
              helper="Users with activity in the last 7 days"
              label="Active Last 7 Days"
              value={String(payload.summary.activeLast7Days)}
            />
          </section>

          <section className="glass-panel animate-rise p-5 sm:p-6">
            <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
              <div>
                <p className="section-label">User List</p>
                <h2 className="mt-3 text-2xl text-clay-900">Accounts in your live database</h2>
              </div>
              <p className="text-sm text-clay-500">
                Password hashes are intentionally excluded from this view.
              </p>
            </div>

            {payload.users.length === 0 ? (
              <div className="mt-6 rounded-[24px] border border-dashed border-clay-200 bg-white/60 px-6 py-10 text-center text-sm text-clay-500">
                No users have signed up yet.
              </div>
            ) : (
              <div className="mt-6 overflow-x-auto">
                <table className="min-w-full border-separate border-spacing-y-3">
                  <thead>
                    <tr className="text-left text-xs uppercase tracking-[0.22em] text-clay-500">
                      <th className="px-4 py-2 font-semibold">User</th>
                      <th className="px-4 py-2 font-semibold">Email</th>
                      <th className="px-4 py-2 font-semibold">Created</th>
                      <th className="px-4 py-2 font-semibold">Meals</th>
                      <th className="px-4 py-2 font-semibold">Last Activity</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payload.users.map((user) => (
                      <tr key={user.id} className="rounded-[20px] bg-white/80 shadow-sm">
                        <td className="rounded-l-[20px] px-4 py-4 text-sm text-clay-900">
                          <div className="font-semibold text-clay-900">
                            {user.name || "No name set"}
                          </div>
                          <div className="mt-1 text-xs text-clay-500">{user.id}</div>
                        </td>
                        <td className="px-4 py-4 text-sm text-clay-700">{user.email}</td>
                        <td className="px-4 py-4 text-sm text-clay-700">
                          {formatDateTime(user.createdAt)}
                        </td>
                        <td className="px-4 py-4 text-sm font-semibold text-clay-900">
                          {user.mealCount}
                        </td>
                        <td className="rounded-r-[20px] px-4 py-4 text-sm text-clay-700">
                          {formatDateTime(user.lastActivityAt)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </section>
        </>
      ) : null}
    </main>
  );
}
