import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { updateSettingsSchema } from "@/lib/request-schemas";
import { getOrCreateUserSettings, updateUserSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to load your targets." }, { status: 401 });
    }

    const settings = await getOrCreateUserSettings(session.user.id);
    return Response.json(settings);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Unable to load saved targets." },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to update your targets." }, { status: 401 });
    }

    const json = await request.json();
    const payload = updateSettingsSchema.parse(json);
    const settings = await updateUserSettings(session.user.id, {
      calories: payload.calories,
      proteinG: payload.proteinG,
      carbsG: {
        min: payload.carbsMinG,
        max: payload.carbsMaxG,
      },
      fatG: {
        min: payload.fatMinG,
        max: payload.fatMaxG,
      },
    });

    return Response.json(settings);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "The targets payload was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to update targets right now." },
      { status: 500 }
    );
  }
}
