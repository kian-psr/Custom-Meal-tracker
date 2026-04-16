import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { deleteMealLog, updateMealLog } from "@/lib/meals";
import { updateMealLogSchema } from "@/lib/request-schemas";

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
      return Response.json({ error: "Sign in to update meals." }, { status: 401 });
    }

    const { id } = await context.params;
    const json = await request.json();
    const payload = updateMealLogSchema.parse(json);
    const updated = await updateMealLog(session.user.id, id, payload);

    if (!updated) {
      return Response.json({ error: "Meal not found." }, { status: 404 });
    }

    return Response.json({ meal: updated });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "The meal update payload was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to update the meal right now." },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request, context: RouteContext) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to delete meals." }, { status: 401 });
    }

    const { id } = await context.params;
    const deleted = await deleteMealLog(session.user.id, id);

    if (!deleted) {
      return Response.json({ error: "Meal not found." }, { status: 404 });
    }

    return new Response(null, { status: 204 });
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Unable to delete the meal right now." },
      { status: 500 }
    );
  }
}
