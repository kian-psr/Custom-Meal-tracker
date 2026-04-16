import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { analyzeMeal } from "@/lib/meal-analysis";
import { mealTypeSchema } from "@/lib/meal-analysis-schema";
import { getOrCreateUserSettings } from "@/lib/settings";

const MAX_IMAGE_BYTES = 8 * 1024 * 1024;
const SUPPORTED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp"];

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json({ error: "Sign in to analyze meals." }, { status: 401 });
    }

    const formData = await request.formData();
    const description = String(formData.get("description") ?? "").trim();
    const mealType = mealTypeSchema.parse(String(formData.get("mealType") ?? "").trim());
    const image = formData.get("image");

    if (!(image instanceof File)) {
      return Response.json(
        { error: "Upload a meal image before analyzing." },
        { status: 400 }
      );
    }

    if (!description) {
      return Response.json(
        { error: "Add a short meal description to improve the estimate." },
        { status: 400 }
      );
    }

    if (!SUPPORTED_IMAGE_TYPES.includes(image.type)) {
      return Response.json(
        { error: "Please upload a JPG, PNG, or WebP image." },
        { status: 400 }
      );
    }

    if (image.size === 0 || image.size > MAX_IMAGE_BYTES) {
      return Response.json(
        { error: "Image must be between 1 byte and 8 MB." },
        { status: 400 }
      );
    }

    const buffer = Buffer.from(await image.arrayBuffer());
    const imageDataUrl = `data:${image.type};base64,${buffer.toString("base64")}`;
    const settings = await getOrCreateUserSettings(session.user.id);
    const analysis = await analyzeMeal({
      imageDataUrl,
      description,
      mealType,
      targets: settings.targets,
    });

    return Response.json(analysis);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "The meal type or analysis inputs were invalid." },
        { status: 400 }
      );
    }

    console.error(error);

    return Response.json(
      {
        error:
          "The meal analysis request failed. Check your OpenAI configuration or try demo mode.",
      },
      { status: 500 }
    );
  }
}
