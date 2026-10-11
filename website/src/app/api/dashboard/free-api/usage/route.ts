import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import {
  callFreeApiRegistry,
  forwardRegistryResponse,
} from "@/lib/dashboard/free-api-client";

export async function GET(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    const response = await callFreeApiRegistry(
      `/v1/free-api/credentials/${encodeURIComponent(user.userId)}/usage`,
      {},
      user.userId,
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
