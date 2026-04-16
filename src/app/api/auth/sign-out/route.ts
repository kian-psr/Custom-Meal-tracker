import {
  createClearedSessionCookie,
  deleteSessionByToken,
  getSessionTokenFromRequest,
} from "@/lib/auth";
import type { AuthSessionResponse } from "@/lib/types";

export const runtime = "nodejs";

export async function POST(request: Request) {
  const sessionToken = getSessionTokenFromRequest(request);
  await deleteSessionByToken(sessionToken);

  const payload: AuthSessionResponse = {
    authenticated: false,
    user: null,
  };

  return Response.json(payload, {
    headers: {
      "Cache-Control": "no-store",
      "Set-Cookie": createClearedSessionCookie(),
    },
  });
}
