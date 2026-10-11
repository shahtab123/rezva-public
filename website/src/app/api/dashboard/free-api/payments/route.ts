import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import {
  callFreeApiRegistry,
  forwardRegistryResponse,
} from "@/lib/dashboard/free-api-client";

export async function GET(request: Request) {
  try {
    await requireDashboardUser(request);
    const response = await callFreeApiRegistry("/v1/free-api/test-merchant/payments");
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}

export async function POST(request: Request) {
  try {
    await requireDashboardUser(request);
    const body = (await request.json()) as { transaction_hash?: string };
    const response = await callFreeApiRegistry(
      "/v1/free-api/test-merchant/payments/detect",
      { method: "POST", body: JSON.stringify(body) },
    );
    return forwardRegistryResponse(response);
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
