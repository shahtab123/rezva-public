import { callFreeApiRegistry, forwardRegistryResponse } from "./free-api-client";

export { forwardRegistryResponse };

export async function callProviderDashboardRegistry(
  path: string,
  init: RequestInit = {},
): Promise<Response> {
  return callFreeApiRegistry(path, init);
}

export function providerAccountPath(userId: string, suffix = ""): string {
  return `/v1/provider-dashboard/accounts/${encodeURIComponent(userId)}${suffix}`;
}
