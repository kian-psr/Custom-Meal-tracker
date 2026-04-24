import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { deleteSupplementLog, updateSupplementLog } from "@/lib/supplements";
import { updateSupplementLogSchema } from "@/lib/request-schemas";

type RouteContext = {
  params: Promise<{
    id: string;
  }>;
};

export const runtime = "nodejs";

export async function PATCH(request: Request, context: RouteContext) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to update supplements." }, { status: 401 });
    }

    const { id } = await context.params;
    const payload = updateSupplementLogSchema.parse(await request.json());
    const supplement = await updateSupplementLog(session.user.id, id, payload);

    if (!supplement) {
      return Response.json({ error: "Supplement not found." }, { status: 404 });
    }

    return Response.json({ supplement });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "The supplement update payload was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to update the supplement right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to delete supplements." }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteSupplementLog(session.user.id, id);

    if (!deleted) {
      return Response.json({ error: "Supplement not found." }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Unable to delete the supplement right now." },
      { status: 500 }
    );
  }
}
