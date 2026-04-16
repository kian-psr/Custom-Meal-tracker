import { getAuthenticatedSession } from "@/lib/auth";
import type { AuthSessionResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getAuthenticatedSession(request);

  const payload: AuthSessionResponse = {
    authenticated: Boolean(session),
    user: session?.user ?? null,
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
