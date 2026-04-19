"use client";

import Link from "next/link";
import { useState } from "react";

async function readErrorMessage(response: Response) {
  try {
    const payload = (await response.json()) as { error?: string };
    return payload.error ?? "Something went wrong.";
  } catch {
    return "Something went wrong.";
  }
}

export default function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);
  const [previewResetUrl, setPreviewResetUrl] = useState<string | null>(null);

  async function handleSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    setIsSubmitting(true);
    setError(null);
    setSuccessMessage(null);
    setPreviewResetUrl(null);

    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          email: email.trim(),
        }),
      });

      if (!response.ok) {
        throw new Error(await readErrorMessage(response));
      }

      const payload = (await response.json()) as {
        message?: string;
        previewResetUrl?: string;
      };

      setSuccessMessage(
        payload.message ??
          "If an account exists for that email, a password reset link is on the way."
      );
      setPreviewResetUrl(payload.previewResetUrl ?? null);
    } catch (requestError) {
      setError(
        requestError instanceof Error
          ? requestError.message
          : "Unable to start password reset."
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
          <h1 className="mt-3 text-3xl leading-tight">Reset your password</h1>
          <p className="mt-4 max-w-2xl text-sm leading-7 text-clay-100">
            Enter the email address tied to your account and we’ll send you a secure
            reset link if we find a match.
          </p>
        </div>

        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <label className="block">
            <span className="text-sm font-medium text-clay-700">Email</span>
            <input
              autoComplete="email"
              className="mt-2 w-full rounded-[18px] border border-clay-200 bg-white px-4 py-3 outline-none transition focus:border-ember-500"
              onChange={(event) => setEmail(event.target.value)}
              placeholder="you@example.com"
              type="email"
              value={email}
            />
          </label>

          {error ? (
            <div className="rounded-[18px] border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-900">
              {error}
            </div>
          ) : null}

          {successMessage ? (
            <div className="rounded-[18px] border border-sage-200 bg-sage-50 px-4 py-3 text-sm text-sage-900">
              <p>{successMessage}</p>
              {previewResetUrl ? (
                <p className="mt-2 break-all">
                  Dev preview link:{" "}
                  <a className="font-semibold underline" href={previewResetUrl}>
                    {previewResetUrl}
                  </a>
                </p>
              ) : null}
            </div>
          ) : null}

          <button
            className="inline-flex w-full items-center justify-center rounded-full bg-clay-900 px-5 py-3 text-sm font-semibold text-white transition hover:bg-clay-700 disabled:cursor-not-allowed disabled:bg-clay-300"
            disabled={isSubmitting}
            type="submit"
          >
            {isSubmitting ? "Sending reset link..." : "Send reset link"}
          </button>
        </form>

        <div className="mt-5 flex flex-col gap-2 text-sm text-clay-500 sm:flex-row sm:items-center sm:justify-between">
          <p>The email can take a minute or two to show up.</p>
          <Link className="font-semibold text-clay-800 underline" href="/">
            Back to sign in
          </Link>
        </div>
      </section>
    </main>
  );
}
