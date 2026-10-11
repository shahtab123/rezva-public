import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";
import {
  callProviderDashboardRegistry,
  forwardRegistryResponse,
  providerAccountPath,
} from "@/lib/dashboard/provider-client";

export async function PATCH(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const body = (await request.json()) as { action?: string };
    if (body.action !== "regenerate") {
      return Response.json({ error: "action must be regenerate" }, { status: 400 });
    }
    const response = await callProviderDashboardRegistry(
      providerAccountPath(user.userId, "/regenerate-key"),
      { method: "POST" },
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
