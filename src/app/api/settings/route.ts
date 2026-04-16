import { ZodError } from "zod";

import { updateSettingsSchema } from "@/lib/request-schemas";
import { getOrCreateUserSettings, updateUserSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function GET() {
  try {
    const settings = await getOrCreateUserSettings();
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
    const json = await request.json();
    const payload = updateSettingsSchema.parse(json);
    const settings = await updateUserSettings({
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
