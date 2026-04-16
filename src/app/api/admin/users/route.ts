import { getAuthenticatedSession } from "@/lib/auth";
import {
  getAdminUsersSnapshot,
  hasConfiguredAdmins,
  isAdminEmail,
} from "@/lib/admin";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return Response.json({ error: "Sign in to view the admin dashboard." }, { status: 401 });
  }

  if (!hasConfiguredAdmins()) {
    return Response.json(
      {
        error:
          "Admin access is not configured yet. Set ADMIN_EMAILS in your environment first.",
      },
      { status: 503 }
    );
  }

  if (!isAdminEmail(session.user.email)) {
    return Response.json(
      { error: "You do not have permission to view the admin dashboard." },
      { status: 403 }
    );
  }

  const snapshot = await getAdminUsersSnapshot();

  return Response.json(snapshot, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
