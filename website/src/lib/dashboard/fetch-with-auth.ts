"use client";

import { getAccessToken } from "@privy-io/react-auth";

export async function dashboardFetch(
  path: string,
  init: RequestInit & { controllerWallet?: string | null } = {},
): Promise<Response> {
  const { controllerWallet, headers: initHeaders, ...rest } = init;
  const headers = new Headers(initHeaders);

  try {
    const token = await getAccessToken();
    if (token) {
      headers.set("Authorization", `Bearer ${token}`);
    }
  } catch {
    // Privy not ready - dev routes may still accept x-dashboard-user-id via server fallback.
  }

  if (controllerWallet) {
    headers.set("X-Controller-Wallet", controllerWallet);
  }

  return fetch(path, { ...rest, headers });
}
