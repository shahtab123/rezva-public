import { dashboardAuthResponse, requireDashboardUser } from "@/lib/dashboard/auth";
import { requireApprovedProviderTrack } from "@/lib/dashboard/require-approved-provider";
import {
  getDashboardProviderKey,
  getRegistryApiBaseUrl,
} from "@/lib/dashboard/registry-client";

export async function POST(request: Request) {
  try {
    const user = await requireDashboardUser(request);
    await requireApprovedProviderTrack(user.userId);
    const body = (await request.json()) as {
      type?: string;
      value?: string;
    };
    const type = body.type?.trim();
    const value = body.value?.trim();
    if (!type || !value) {
      return Response.json(
        { error: "type and value are required." },
        { status: 400 },
      );
    }
    // Always resolve with the dashboard provider key - never accept client-supplied API keys.
    const response = await fetch(`${getRegistryApiBaseUrl()}/v1/resolve`, {
      method: "POST",
      headers: {
        Authorization: `Bearer ${getDashboardProviderKey()}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ type, value }),
      cache: "no-store",
    });
    const text = await response.text();
    return new Response(text, {
      status: response.status,
      headers: {
        "Content-Type": response.headers.get("content-type") ?? "application/json",
      },
    });
  } catch (error) {
    return dashboardAuthResponse(error);
  }
}
