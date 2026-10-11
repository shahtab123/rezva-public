import { RegistryClient } from "@universal-payment/sdk";

export function getRegistryApiBaseUrl(): string {
  const configured = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  if (configured) {
    if (
      process.env.NODE_ENV === "production" &&
      /localhost|127\.0\.0\.1/i.test(configured)
    ) {
      throw new Error(
        "NEXT_PUBLIC_API_URL points at localhost in production. Set it to the Cloudflare Worker URL.",
      );
    }
    return configured;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("NEXT_PUBLIC_API_URL is required in production.");
  }
  return "http://127.0.0.1:8787";
}

export function getDashboardProviderKey(): string {
  const key =
    process.env.DASHBOARD_PROVIDER_API_KEY?.trim() ||
    process.env.DEV_PROVIDER_KEY?.trim() ||
    "";
  if (key) {
    if (
      process.env.NODE_ENV === "production" &&
      (key === "dev-provider-key" || key.length < 16)
    ) {
      throw new Error(
        "DASHBOARD_PROVIDER_API_KEY must be a strong non-default secret in production.",
      );
    }
    return key;
  }
  if (process.env.NODE_ENV === "production") {
    throw new Error("DASHBOARD_PROVIDER_API_KEY is required in production.");
  }
  return "dev-provider-key";
}

export function createDashboardRegistryClient(controllerWallet: string): RegistryClient {
  return new RegistryClient({
    baseUrl: getRegistryApiBaseUrl(),
    apiKey: getDashboardProviderKey(),
    controllerWallet: controllerWallet.toLowerCase(),
  });
}

export function requireControllerWallet(wallet: string | null): string {
  if (!wallet) {
    throw new Error("Link a controller wallet in Privy before registry mutations.");
  }
  return wallet;
}
