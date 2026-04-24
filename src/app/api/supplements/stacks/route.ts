import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { createSupplementStackSchema } from "@/lib/request-schemas";
import { createSupplementStackLogs } from "@/lib/supplements";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to log supplement stacks." }, { status: 401 });
    }

    const payload = createSupplementStackSchema.parse(await request.json());
    const supplements = await createSupplementStackLogs({
      ...payload,
      userId: session.user.id,
    });

    return Response.json({ supplements }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "The supplement stack payload was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to log the supplement stack right now." },
      { status: 500 }
    );
  }
}
