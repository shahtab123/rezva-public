import { getRegistryApiBaseUrl } from "./registry-client";

function getDashboardServiceKey(): string {
  const key =
    process.env.DASHBOARD_SERVICE_KEY?.trim() ||
    process.env.DEV_PROVIDER_KEY?.trim() ||
    "";
  if (key) {
    if (
      process.env.NODE_ENV === "production" &&
      (key === "dev-provider-key" || key.length < 16)
    ) {
      throw new Error(
        "DASHBOARD_SERVICE_KEY must be a strong non-default secret in production.",
      );
    }
    return key;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DASHBOARD_SERVICE_KEY is required in production.");
  }
  return "dev-provider-key";
}

export async function callFreeApiRegistry(
  path: string,
  init: RequestInit = {},
  ownerUserId?: string,
): Promise<Response> {
  const headers = new Headers(init.headers);
  headers.set("Authorization", `Bearer ${getDashboardServiceKey()}`);
  headers.set("Content-Type", "application/json");
  if (ownerUserId) {
    headers.set("X-Dashboard-Owner-User-Id", ownerUserId);
  }
  return fetch(`${getRegistryApiBaseUrl()}${path}`, {
    ...init,
    headers,
    cache: "no-store",
  });
}

export async function forwardRegistryResponse(response: Response): Promise<Response> {
  const body = await response.text();
  return new Response(body, {
    status: response.status,
    headers: { "Content-Type": response.headers.get("content-type") ?? "application/json" },
  });
}
