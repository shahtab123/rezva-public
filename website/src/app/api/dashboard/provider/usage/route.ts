import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";
import {
  callProviderDashboardRegistry,
  forwardRegistryResponse,
  providerAccountPath,
} from "@/lib/dashboard/provider-client";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const response = await callProviderDashboardRegistry(
      providerAccountPath(user.userId, "/usage"),
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
