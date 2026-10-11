import type { RegistryEnv } from "./auth.js";

/** Public resolve endpoint wallets can reach when scanning the Test Merchant QR. */
export const DEFAULT_PUBLIC_RESOLVER_URL =
  "https://universal-payment-api.sabrishahtab.workers.dev/v1/resolve";

/**
 * QR payloads must use a publicly reachable resolver URL.
 * Local 127.0.0.1 / localhost values are rewritten so phone wallets can resolve.
 */
export function publicResolverUrl(env: Pick<RegistryEnv, "PUBLIC_RESOLVER_URL" | "RESOLVER_URL">): string {
  const raw =
    env.PUBLIC_RESOLVER_URL?.trim() ||
    env.RESOLVER_URL?.trim() ||
    DEFAULT_PUBLIC_RESOLVER_URL;

  try {
    const url = new URL(raw, DEFAULT_PUBLIC_RESOLVER_URL);
    if (
      url.hostname === "localhost" ||
      url.hostname === "127.0.0.1" ||
      url.hostname === "0.0.0.0" ||
      url.hostname.endsWith(".local")
    ) {
      return DEFAULT_PUBLIC_RESOLVER_URL;
    }
    if (!url.pathname.includes("/v1/resolve")) {
      url.pathname = `${url.pathname.replace(/\/$/, "")}/v1/resolve`;
    }
    return url.toString().replace(/\/$/, "");
  } catch {
    return DEFAULT_PUBLIC_RESOLVER_URL;
  }
}
