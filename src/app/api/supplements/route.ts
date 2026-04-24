import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { createSupplementLog } from "@/lib/supplements";
import { createSupplementLogSchema } from "@/lib/request-schemas";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to save supplements." }, { status: 401 });
    }

    const payload = createSupplementLogSchema.parse(await request.json());
    const supplement = await createSupplementLog({
      ...payload,
      userId: session.user.id,
    });

    return Response.json({ supplement }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "The supplement payload was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to save the supplement right now." },
      { status: 500 }
    );
  }
}
