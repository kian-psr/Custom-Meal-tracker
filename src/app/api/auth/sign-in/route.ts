import { ZodError } from "zod";

import {
  createSessionCookie,
  createSessionForUser,
  verifyPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signInSchema } from "@/lib/request-schemas";
import { getOrCreateUserSettings } from "@/lib/settings";
import type { AuthSessionResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = signInSchema.parse(await request.json());
    const user = await prisma.user.findUnique({
      where: {
        email: payload.email,
      },
    });

    if (!user) {
      return Response.json(
        { error: "Email or password was incorrect." },
        { status: 401 }
      );
    }

    const passwordMatches = await verifyPassword(payload.password, user.passwordHash);

    if (!passwordMatches) {
      return Response.json(
        { error: "Email or password was incorrect." },
        { status: 401 }
      );
    }

    await getOrCreateUserSettings(user.id);

    const session = await createSessionForUser(user.id);
    const body: AuthSessionResponse = {
      authenticated: true,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        createdAt: user.createdAt.toISOString(),
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
        { error: error.issues[0]?.message ?? "The sign-in details were invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to sign in right now." },
      { status: 500 }
    );
  }
}
