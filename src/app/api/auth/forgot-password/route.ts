import { ZodError } from "zod";

import { prisma } from "@/lib/prisma";
import { forgotPasswordSchema } from "@/lib/request-schemas";
import { serverEnv } from "@/lib/server-env";
import { sendPasswordResetEmail } from "@/lib/mailer";
import { createPasswordResetToken } from "@/lib/password-reset";

export const runtime = "nodejs";

const GENERIC_SUCCESS_MESSAGE =
  "If an account exists for that email, a password reset link is on the way.";

export async function POST(request: Request) {
  try {
    const payload = forgotPasswordSchema.parse(await request.json());

    if (process.env.NODE_ENV === "production" && !serverEnv.hasSmtpConfig) {
      return Response.json(
        {
          error:
            "Password reset email is not configured yet. Ask the site admin to enable SMTP first.",
        },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (!user) {
      return Response.json({ message: GENERIC_SUCCESS_MESSAGE });
    }

    const { token } = await createPasswordResetToken(user.id);
    const origin = request.headers.get("origin") ?? new URL(request.url).origin;
    const resetUrl = `${origin}/reset-password?token=${encodeURIComponent(token)}`;
    const emailSent = await sendPasswordResetEmail({
      email: user.email,
      name: user.name,
      resetUrl,
    });

    return Response.json({
      message: GENERIC_SUCCESS_MESSAGE,
      ...(emailSent || process.env.NODE_ENV === "production"
        ? {}
        : { previewResetUrl: resetUrl }),
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "The reset request was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to start password reset right now." },
      { status: 500 }
    );
  }
}
