import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import {
  callFreeApiRegistry,
  forwardRegistryResponse,
} from "@/lib/dashboard/free-api-client";

/** Shared Test Merchant — always available once the dashboard session is valid. */
export async function GET(request: Request) {
  try {
    await requireDashboardUser(request);
    const response = await callFreeApiRegistry("/v1/free-api/test-merchant");
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireDashboardUser(request);
    const response = await callFreeApiRegistry("/v1/free-api/test-merchant", {
      method: "POST",
      body: JSON.stringify({}),
    });
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
