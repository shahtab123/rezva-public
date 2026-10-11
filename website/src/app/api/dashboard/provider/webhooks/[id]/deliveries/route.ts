import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";
import {
  callProviderDashboardRegistry,
  forwardRegistryResponse,
  providerAccountPath,
} from "@/lib/dashboard/provider-client";

type RouteContext = { params: Promise<{ id: string }> };

export async function GET(request: Request, context: RouteContext) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const { id } = await context.params;
    const response = await callProviderDashboardRegistry(
      `${providerAccountPath(user.userId, "/webhooks")}/${encodeURIComponent(id)}/deliveries`,
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
