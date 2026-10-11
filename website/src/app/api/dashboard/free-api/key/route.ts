import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import {
  callFreeApiRegistry,
  forwardRegistryResponse,
} from "@/lib/dashboard/free-api-client";

function credentialPath(userId: string, suffix = ""): string {
  return `/v1/free-api/credentials/${encodeURIComponent(userId)}${suffix}`;
}

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const response = await callFreeApiRegistry(
      credentialPath(user.userId),
      {},
      user.userId,
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const response = await callFreeApiRegistry(
      "/v1/free-api/credentials",
      {
        method: "POST",
        body: JSON.stringify({ owner_user_id: user.userId }),
      },
      user.userId,
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function PATCH(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const body = (await request.json()) as { action?: string };
    if (body.action !== "regenerate") {
      return Response.json({ error: "action must be regenerate" }, { status: 400 });
    }
    const response = await callFreeApiRegistry(
      credentialPath(user.userId, "/regenerate"),
      { method: "POST" },
      user.userId,
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function DELETE(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const response = await callFreeApiRegistry(
      credentialPath(user.userId, "/revoke"),
      { method: "POST" },
      user.userId,
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
