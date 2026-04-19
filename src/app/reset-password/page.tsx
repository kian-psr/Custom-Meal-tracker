"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import type { AuthSessionResponse } from "@/lib/types";

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export default function ResetPasswordPage() {
  const router = useRouter();
  const [token, setToken] = useState("");

  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  useEffect(() => {
    setToken(new URLSearchParams(window.location.search).get("token")?.trim() ?? "");
  }, []);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!token) {
      setError("That reset link is missing its token. Request a fresh email.");
      return;
    }

    if (password !== confirmPassword) {
      setError("The passwords do not match yet.");
      return;
    }

    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);

    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          token,
          password,
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as AuthSessionResponse;
      setSuccessMessage("Password updated. Redirecting you back to the tracker...");

      if (payload.authenticated) {
        setTimeout(() => {
          router.push("/");
          router.refresh();
        }, 800);
      }
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to reset your password."
      );
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="mx-auto flex min-h-screen w-full max-w-3xl items-center px-4 py-8 sm:px-6 lg:px-8">
      <section className="glass-panel animate-rise w-full overflow-hidden p-5 sm:p-6">
        <div className="rounded-[28px] bg-gradient-to-br from-clay-900 via-clay-900 to-sage-900 p-6 text-white">
          <p className="section-label !text-clay-200">Password Help</p>
          <h1 className="mt-3 text-3xl leading-tight">Choose a new password</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-clay-100">
            Pick something secure that you can remember. Once it saves, we’ll sign you
            back into your dashboard automatically.
          </p>
        </div>

        {!token ? (
          <div className="mt-6 rounded-[20px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
            This reset link is incomplete. Request a fresh password reset email.
          </div>
        ) : null}

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-clay-700">New password</span>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none transition focus:border-ember-500"
              onChange={(event) => setPassword(event.target.value)}
              placeholder="At least 8 characters"
              type="password"
              value={password}
            />
          </label>

          <label className="block">
            <span className="text-sm font-medium text-clay-700">Confirm password</span>
            <input
              autoComplete="new-password"
              className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none transition focus:border-ember-500"
              onChange={(event) => setConfirmPassword(event.target.value)}
              placeholder="Re-enter the new password"
              type="password"
              value={confirmPassword}
            />
          </label>

          {error ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-[18px] border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-900">
              {successMessage}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-full bg-clay-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
            disabled={isSubmitting || !token}
            type="submit"
          >
            {isSubmitting ? "Updating password..." : "Save new password"}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm text-clay-500 sm:flex-row sm:items-center sm:justify-between">
          <p>This link expires after one hour.</p>
          <Link className="font-semibold text-clay-800 underline" href="/forgot-password">
            Request a new link
          </Link>
        </div>
      </section>
    </main>
  );
}
