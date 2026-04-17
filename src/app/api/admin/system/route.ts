import { getAuthenticatedSession } from "@/lib/auth";
import { hasConfiguredAdmins, isAdminEmail } from "@/lib/admin";
import { getAdminSystemDiagnostics } from "@/lib/system-diagnostics";

export const runtime = "nodejs";

export async function GET(request: Request) {
  const session = await getAuthenticatedSession(request);

  if (!session) {
    return Response.json(
      { error: "Sign in to view system diagnostics." },
      { status: 401 }
    );
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
      { error: "You do not have permission to view system diagnostics." },
      { status: 403 }
    );
  }

  const diagnostics = await getAdminSystemDiagnostics();

  return Response.json(diagnostics, {
    headers: {
      "Cache-Control": "no-store",
    },
  });
}
