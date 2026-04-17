import { ZodError } from "zod";

import { getAuthenticatedSession } from "@/lib/auth";
import { calculateGoalRecommendation } from "@/lib/goal-planner";
import { goalPlannerSchema } from "@/lib/request-schemas";
import { applyGoalPlannerSettings } from "@/lib/settings";

export const runtime = "nodejs";

export async function POST(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json(
        { error: "Sign in to calculate your goal targets." },
        { status: 401 }
      );
    }

    const json = await request.json();
    const profile = goalPlannerSchema.parse(json);
    const recommendation = calculateGoalRecommendation(profile);

    return Response.json({
      profile,
      recommendation,
    });
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "The goal planner inputs were invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to calculate goal targets right now." },
      { status: 500 }
    );
  }
}

export async function PUT(request: Request) {
  try {
    const session = await getAuthenticatedSession(request);

    if (!session) {
      return Response.json(
        { error: "Sign in to save your goal targets." },
        { status: 401 }
      );
    }

    const json = await request.json();
    const profile = goalPlannerSchema.parse(json);
    const settings = await applyGoalPlannerSettings(session.user.id, profile);

    return Response.json(settings);
  } catch (error) {
    if (error instanceof ZodError) {
      return Response.json(
        { error: error.issues[0]?.message ?? "The goal planner inputs were invalid." },
        { status: 400 }
      );
    }

    console.error(error);
    return Response.json(
      { error: "Unable to save your goal targets right now." },
      { status: 500 }
    );
  }
}
