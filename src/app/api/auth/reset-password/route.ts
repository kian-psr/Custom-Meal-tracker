import { ZodError } from "zod";

import {
  createSessionCookie,
  createSessionForUser,
  hashPassword,
} from "@/lib/auth";
import { consumePasswordResetToken } from "@/lib/password-reset";
import { prisma } from "@/lib/prisma";
import { resetPasswordSchema } from "@/lib/request-schemas";
import type { AuthSessionResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = resetPasswordSchema.parse(await request.json());
    const tokenRecord = await consumePasswordResetToken(payload.token);

    if (!tokenRecord) {
      return Response.json(
        { error: "That reset link is invalid or has expired. Request a new one." },
        { status: 400 }
      );
    }

    const passwordHash = await hashPassword(payload.password);

    await prisma.$transaction(async (tx) => {
      await tx.user.update({
        where: {
          id: tokenRecord.userId,
        },
        data: {
          passwordHash,
        },
      });

      await tx.session.deleteMany({
        where: {
          userId: tokenRecord.userId,
        },
      });

      await tx.passwordResetToken.deleteMany({
        where: {
          userId: tokenRecord.userId,
        },
      });
    });

    const session = await createSessionForUser(tokenRecord.userId);
    const body: AuthSessionResponse = {
      authenticated: true,
      user: {
        id: tokenRecord.user.id,
        email: tokenRecord.user.email,
        name: tokenRecord.user.name,
        createdAt: tokenRecord.user.createdAt.toISOString(),
      },
    };

    return Response.json(body, {
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": createSessionCookie(session.token, session.expiresAt),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "The new password details were invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to reset your password right now." },
      { status: 500 }
    );
  }
}
