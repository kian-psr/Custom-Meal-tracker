import { ZodError } from "zod";

import { saveMealPhoto } from "@/lib/file-storage";
import { createMealLog, getDailyDashboard } from "@/lib/meals";
import { createMealLogSchema } from "@/lib/request-schemas";

export const runtime = "nodejs";

async function parseCreatePayload(request: Request) {
  const contentType = request.headers.get("content-type") ?? "";

  if (contentType.includes("multipart/form-data")) {
    const formData = await request.formData();
    const rawAnalysis = String(formData.get("analysis") ?? "").trim();
    const image = formData.get("image");

    const payload = createMealLogSchema.parse({
      description: String(formData.get("description") ?? "").trim(),
      mealType: String(formData.get("mealType") ?? "").trim(),
      analysis: JSON.parse(rawAnalysis),
      analysisSource: String(formData.get("analysisSource") ?? "").trim(),
      analysisModel: String(formData.get("analysisModel") ?? "").trim(),
      consumedAt: String(formData.get("consumedAt") ?? "").trim() || undefined,
    });

    let photo:
      | {
          photoUrl: string;
          sourceImageName: string | null;
        }
      | undefined;

    if (image instanceof File && image.size > 0) {
      photo = await saveMealPhoto(image);
    }

    return {
      ...payload,
      photoUrl: photo?.photoUrl ?? null,
      sourceImageName: photo?.sourceImageName ?? null,
    };
  }

  const payload = createMealLogSchema.parse(await request.json());

  return {
    ...payload,
    photoUrl: null,
    sourceImageName: null,
  };
}

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") ?? undefined;

    if (date && !/^\d{4}-\d{2}-\d{2}$/.test(date)) {
      return Response.json(
        { error: "Date must use YYYY-MM-DD format." },
        { status: 400 }
      );
    }

    const dashboard = await getDailyDashboard(date);
    return Response.json(dashboard);
  } catch (error) {
    console.error(error);
    return Response.json(
      { error: "Unable to load the daily dashboard." },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const payload = await parseCreatePayload(request);
    const meal = await createMealLog(payload);

    return Response.json({ meal }, { status: 201 });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: "The saved meal payload was invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to save the meal right now." },
      { status: 500 }
    );
  }
}
