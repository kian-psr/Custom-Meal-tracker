import "server-only";

import nodemailer from "nodemailer";

import { serverEnv } from "@/lib/server-env";

let cachedTransport: nodemailer.Transporter | null = null;

function getTransport() {
  if (!serverEnv.hasSmtpConfig) {
    return null;
  }

  if (!cachedTransport) {
    cachedTransport = nodemailer.createTransport({
      host: serverEnv.SMTP_HOST,
      port: serverEnv.SMTP_PORT,
      secure: serverEnv.SMTP_SECURE === "true",
      auth:
        serverEnv.SMTP_USER && serverEnv.SMTP_PASS
          ? {
              user: serverEnv.SMTP_USER,
              pass: serverEnv.SMTP_PASS,
            }
          : undefined,
    });
  }

  return cachedTransport;
}

export async function sendPasswordResetEmail(input: {
  email: string;
  resetUrl: string;
  name: string | null;
}) {
  const transport = getTransport();

  if (!transport) {
    return false;
  }

  const greeting = input.name?.trim() ? `Hi ${input.name.trim()},` : "Hi,";
  const subject = "Reset your Meal Macro Tracker password";
  const text = [
    greeting,
    "",
    "We received a request to reset your password.",
    `Use this link to choose a new one: ${input.resetUrl}`,
    "",
    "This link expires in 1 hour. If you did not request a reset, you can ignore this email.",
  ].join("\n");

  const html = `
    <div style="font-family: Avenir Next, Avenir, Segoe UI, sans-serif; color: #1d1009; line-height: 1.6;">
      <p>${greeting}</p>
      <p>We received a request to reset your password.</p>
      <p>
        <a href="${input.resetUrl}" style="display: inline-block; background: #1d1009; color: #ffffff; padding: 12px 18px; border-radius: 999px; text-decoration: none; font-weight: 600;">
          Reset password
        </a>
      </p>
      <p style="word-break: break-all;">If the button does not work, use this link:<br />${input.resetUrl}</p>
      <p>This link expires in 1 hour. If you did not request a reset, you can ignore this email.</p>
    </div>
  `;

  await transport.sendMail({
    from: serverEnv.SMTP_FROM,
    to: input.email,
    subject,
    text,
    html,
  });

  return true;
}
