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
    const response = await callProviderDashboardRegistry(providerAccountPath(user.userId));
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const response = await callProviderDashboardRegistry(
      providerAccountPath(user.userId, "/provision"),
      { method: "POST" },
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
