import { apiError } from "@universal-payment/protocol";
import { errorResponse } from "./http.js";

const WEAK_SECRETS = new Set([
  "dev-provider-key",
  "dev-operator-key",
  "changeme",
  "secret",
  "password",
  "test",
]);

export type SecurityEnv = {
  ENVIRONMENT?: string;
  ALLOW_INSECURE_DEV_AUTH?: string;
  CONTROLLER_AUTH_MODE?: string;
  CONTROLLER_AUTH_HMAC_SECRET?: string;
  DEV_PROVIDER_KEY?: string;
  OPERATOR_API_KEY?: string;
  DASHBOARD_SERVICE_KEY?: string;
  OPERATOR_RECLAIM_DUAL_TOKEN?: string;
};

/** True when the worker is explicitly marked production. */
export function isProductionEnv(env: SecurityEnv): boolean {
  const value = (env.ENVIRONMENT ?? "").trim().toLowerCase();
  return value === "production" || value === "prod";
}

/**
 * Local/dev scaffolding may use header-only controller auth and weak keys.
 * Production (ENVIRONMENT=production) never allows this, even if mode=dev is set by mistake.
 */
export function allowInsecureDevAuth(env: SecurityEnv): boolean {
  if (isProductionEnv(env)) {
    return false;
  }
  if ((env.ALLOW_INSECURE_DEV_AUTH ?? "").trim().toLowerCase() === "false") {
    return false;
  }
  return true;
}

export function isWeakSecret(value: string | undefined | null): boolean {
  if (!value) return true;
  const trimmed = value.trim();
  if (trimmed.length < 16) return true;
  return WEAK_SECRETS.has(trimmed.toLowerCase());
}

export function timingSafeEqualString(a: string, b: string): boolean {
  const left = new TextEncoder().encode(a);
  const right = new TextEncoder().encode(b);
  if (left.byteLength !== right.byteLength) {
    return false;
  }
  let diff = 0;
  for (let i = 0; i < left.byteLength; i += 1) {
    diff |= left[i]! ^ right[i]!;
  }
  return diff === 0;
}

/** Block private / link-local / metadata webhook targets (SSRF). */
export function isSafeWebhookUrl(raw: string): boolean {
  let url: URL;
  try {
    url = new URL(raw);
  } catch {
    return false;
  }
  if (url.protocol !== "https:") {
    return false;
  }
  const host = url.hostname.toLowerCase();
  if (
    host === "localhost" ||
    host.endsWith(".localhost") ||
    host === "metadata.google.internal" ||
    host === "metadata" ||
    host === "0.0.0.0"
  ) {
    return false;
  }
  // IPv4 literal
  const ipv4 = /^(\d{1,3})\.(\d{1,3})\.(\d{1,3})\.(\d{1,3})$/.exec(host);
  if (ipv4) {
    const parts = ipv4.slice(1).map((part) => Number(part));
    if (parts.some((n) => n > 255)) return false;
    const [a, b] = parts as [number, number, number, number];
    if (a === 10) return false;
    if (a === 127) return false;
    if (a === 0) return false;
    if (a === 169 && b === 254) return false;
    if (a === 172 && b >= 16 && b <= 31) return false;
    if (a === 192 && b === 168) return false;
    if (a === 100 && b >= 64 && b <= 127) return false; // CGNAT
  }
  // IPv6 local / link-local
  if (host === "::1" || host.startsWith("fe80:") || host.startsWith("fc") || host.startsWith("fd")) {
    return false;
  }
  return true;
}

/**
 * Fail closed for production misconfiguration (weak keys, accidental CONTROLLER_AUTH_MODE=dev).
 * Local wrangler without ENVIRONMENT=production continues to work unchanged.
 */
export function assertSecureRuntime(env: SecurityEnv): Response | null {
  if (!isProductionEnv(env)) {
    return null;
  }

  if ((env.CONTROLLER_AUTH_MODE ?? "dev").toLowerCase() !== "hmac") {
    return errorResponse(
      apiError(
        "INTERNAL_ERROR",
        "CONTROLLER_AUTH_MODE must be hmac when ENVIRONMENT=production.",
      ),
      500,
    );
  }
  if (!env.CONTROLLER_AUTH_HMAC_SECRET || isWeakSecret(env.CONTROLLER_AUTH_HMAC_SECRET)) {
    return errorResponse(
      apiError(
        "INTERNAL_ERROR",
        "CONTROLLER_AUTH_HMAC_SECRET must be a strong secret in production.",
      ),
      500,
    );
  }
  if (isWeakSecret(env.OPERATOR_API_KEY)) {
    return errorResponse(
      apiError("INTERNAL_ERROR", "OPERATOR_API_KEY is missing or too weak for production."),
      500,
    );
  }
  const dashboardKey = env.DASHBOARD_SERVICE_KEY ?? env.DEV_PROVIDER_KEY;
  if (isWeakSecret(dashboardKey)) {
    return errorResponse(
      apiError(
        "INTERNAL_ERROR",
        "DASHBOARD_SERVICE_KEY is missing or too weak for production.",
      ),
      500,
    );
  }
  if (env.DEV_PROVIDER_KEY && isWeakSecret(env.DEV_PROVIDER_KEY)) {
    return errorResponse(
      apiError(
        "INTERNAL_ERROR",
        "DEV_PROVIDER_KEY must not be a weak default in production. Unset it or use a strong key.",
      ),
      500,
    );
  }
  return null;
}

export function reclaimDualControlAccepted(
  env: SecurityEnv,
  token: string | undefined,
): boolean {
  if (!token) return false;
  const expected = env.OPERATOR_RECLAIM_DUAL_TOKEN?.trim();
  if (expected) {
    return timingSafeEqualString(token, expected);
  }
  // Local/dev only: explicit bypass token for admin scaffolding.
  if (allowInsecureDevAuth(env) && token === "bypass") {
    return true;
  }
  return false;
}
