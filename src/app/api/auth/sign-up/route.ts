import { Prisma } from "@prisma/client";
import { ZodError } from "zod";

import {
  createSessionCookie,
  createSessionForUser,
  hashPassword,
} from "@/lib/auth";
import { prisma } from "@/lib/prisma";
import { signUpSchema } from "@/lib/request-schemas";
import { getOrCreateUserSettings } from "@/lib/settings";
import type { AuthSessionResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const payload = signUpSchema.parse(await request.json());
    const passwordHash = await hashPassword(payload.password);
    const user = await prisma.user.create({
      data: {
        email: payload.email,
        name: payload.name?.trim() || null,
        passwordHash,
      },
    });

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
      status: 201,
      headers: {
        "Cache-Control": "no-store",
        "Set-Cookie": createSessionCookie(session.token, session.expiresAt),
      },
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "The sign-up details were invalid." },
        { status: 400 }
      );
    }

    if (error instanceof Prisma.PrismaClientKnownRequestError && error.code === "P2002") {
      return Response.json(
        { error: "An account with that email already exists." },
        { status: 409 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to create your account right now." },
      { status: 500 }
    );
  }
}
