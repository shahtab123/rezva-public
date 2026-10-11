import {
  apiError,
  FREE_API_LIMITS,
} from "@universal-payment/protocol";
import { authenticateDashboardService, invalidateAuthCaches, type RegistryEnv } from "./auth.js";
import { newId, nowIso, sha256Hex } from "./config.js";
import { errorResponse, jsonResponse, readJson } from "./http.js";
import { publicResolverUrl } from "./public-resolver-url.js";
import type { RegistryStore } from "./store.js";

function unauthorized(): Response {
  return errorResponse(
    apiError("UNAUTHORIZED", "Dashboard service authentication is required."),
    401,
  );
}

async function requireDashboardService(
  request: Request,
  env: RegistryEnv,
): Promise<boolean> {
  return authenticateDashboardService(request, env);
}

function generateApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `rzva_free_${encoded}`;
}

function metadata(
  credential: NonNullable<Awaited<ReturnType<RegistryStore["getFreeApiCredentialByOwner"]>>>,
) {
  return {
    id: credential.id,
    key_prefix: credential.key_prefix,
    status: credential.status,
    created_at: credential.created_at,
    revoked_at: credential.revoked_at,
    last_used_at: credential.last_used_at,
    limits: FREE_API_LIMITS,
  };
}

export async function handleFreeApiRequest(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith("/v1/free-api/")) return null;
  if (!(await requireDashboardService(request, env))) {
    return unauthorized();
  }

  const attestedOwner = request.headers.get("x-dashboard-owner-user-id")?.trim() ?? "";

  if (request.method === "POST" && path === "/v1/free-api/credentials") {
    const body = await readJson<{ owner_user_id?: string }>(request);
    const ownerUserId = body.owner_user_id?.trim();
    if (!ownerUserId || ownerUserId.length > 200) {
      return errorResponse(apiError("VALIDATION_ERROR", "owner_user_id is required."), 400);
    }
    if (!attestedOwner || attestedOwner !== ownerUserId) {
      return errorResponse(
        apiError(
          "FORBIDDEN",
          "owner_user_id must match X-Dashboard-Owner-User-Id from the dashboard BFF.",
        ),
        403,
      );
    }
    const existing = await store.getFreeApiCredentialByOwner(ownerUserId);
    if (existing?.status === "ACTIVE") {
      return errorResponse(
        apiError("FREE_API_EXISTS", "An active Free API key already exists."),
        409,
      );
    }
    const apiKey = generateApiKey();
    const credential = await store.createFreeApiCredential({
      id: newId("free"),
      ownerUserId,
      keyHash: await sha256Hex(apiKey),
      keyPrefix: apiKey.slice(0, 14),
    });
    return jsonResponse({ credential: metadata(credential), api_key: apiKey }, 201);
  }

  const ownerMatch = path.match(/^\/v1\/free-api\/credentials\/([^/]+)$/);
  const actionOwnerMatch = path.match(
    /^\/v1\/free-api\/credentials\/([^/]+)\/(?:regenerate|revoke|usage)$/,
  );
  const ownerUserId = ownerMatch ? decodeURIComponent(ownerMatch[1]!) : null;
  const actionOwnerUserId = actionOwnerMatch
    ? decodeURIComponent(actionOwnerMatch[1]!)
    : null;
  const pathOwner = ownerUserId ?? actionOwnerUserId;
  if (pathOwner && (!attestedOwner || attestedOwner !== pathOwner)) {
    return errorResponse(
      apiError(
        "FORBIDDEN",
        "Credential owner must match X-Dashboard-Owner-User-Id from the dashboard BFF.",
      ),
      403,
    );
  }
  if (request.method === "GET" && ownerUserId) {
    const credential = await store.getFreeApiCredentialByOwner(ownerUserId);
    return jsonResponse({ credential: credential ? metadata(credential) : null });
  }

  if (request.method === "POST" && actionOwnerUserId && path.endsWith("/regenerate")) {
    const existing = await store.getFreeApiCredentialByOwner(actionOwnerUserId);
    if (existing?.status === "ACTIVE") {
      await store.revokeFreeApiCredential(actionOwnerUserId);
    }
    invalidateAuthCaches();
    const apiKey = generateApiKey();
    const credential = await store.createFreeApiCredential({
      id: newId("free"),
      ownerUserId: actionOwnerUserId,
      keyHash: await sha256Hex(apiKey),
      keyPrefix: apiKey.slice(0, 14),
    });
    return jsonResponse({ credential: metadata(credential), api_key: apiKey }, 201);
  }

  if (request.method === "POST" && actionOwnerUserId && path.endsWith("/revoke")) {
    const credential = await store.revokeFreeApiCredential(actionOwnerUserId);
    invalidateAuthCaches();
    return credential
      ? jsonResponse({ credential: metadata(credential) })
      : errorResponse(apiError("NOT_FOUND", "Free API credential was not found."), 404);
  }

  if (request.method === "GET" && actionOwnerUserId && path.endsWith("/usage")) {
    const credential = await store.getFreeApiCredentialByOwner(actionOwnerUserId);
    if (!credential) {
      return errorResponse(apiError("NOT_FOUND", "Free API credential was not found."), 404);
    }
    const timestamp = nowIso();
    const now = Date.parse(timestamp);
    const minuteActive =
      credential.minute_started_at &&
      now - Date.parse(credential.minute_started_at) < 60_000;
    const dayActive = credential.day_started_at?.slice(0, 10) === timestamp.slice(0, 10);
    return jsonResponse({
      usage: {
        requests_per_minute: FREE_API_LIMITS.requests_per_minute,
        requests_per_day: FREE_API_LIMITS.requests_per_day,
        minute_count: minuteActive ? credential.minute_count : 0,
        day_count: dayActive ? credential.day_count : 0,
        minute_reset_at: minuteActive && credential.minute_started_at
          ? new Date(Date.parse(credential.minute_started_at) + 60_000).toISOString()
          : null,
        day_reset_at: dayActive && credential.day_started_at
          ? new Date(
              Date.parse(`${credential.day_started_at.slice(0, 10)}T00:00:00.000Z`) +
                86_400_000,
            ).toISOString()
          : null,
      },
    });
  }

  // Shared protocol demo — always available to the dashboard (no Free API key required).
  if (
    (request.method === "GET" || request.method === "POST") &&
    path === "/v1/free-api/test-merchant"
  ) {
    const merchant = await store.getSharedTestMerchant();
    if (!merchant) return testMerchantNotConfigured();
    return sharedMerchantResponse(merchant, publicResolverUrl(env));
  }

  const merchantMatch = path.match(
    /^\/v1\/free-api\/credentials\/([^/]+)\/test-merchant$/,
  );
  if (merchantMatch) {
    const merchantOwner = decodeURIComponent(merchantMatch[1]!);
    if (!attestedOwner || attestedOwner !== merchantOwner) {
      return errorResponse(
        apiError(
          "FORBIDDEN",
          "Credential owner must match X-Dashboard-Owner-User-Id from the dashboard BFF.",
        ),
        403,
      );
    }
  }
  if (request.method === "GET" && merchantMatch) {
    const merchant = await store.getSharedTestMerchant();
    if (!merchant) return testMerchantNotConfigured();
    return sharedMerchantResponse(merchant, publicResolverUrl(env));
  }
  if (request.method === "POST" && merchantMatch) {
    const merchant = await store.getSharedTestMerchant();
    if (!merchant) return testMerchantNotConfigured();
    return sharedMerchantResponse(merchant, publicResolverUrl(env));
  }
  return null;
}

function testMerchantNotConfigured(): Response {
  return errorResponse(
    apiError(
      "TEST_MERCHANT_NOT_CONFIGURED",
      "The shared protocol Test Merchant is not configured for this environment.",
    ),
    503,
  );
}

function sharedMerchantResponse(
  merchant: NonNullable<Awaited<ReturnType<RegistryStore["getSharedTestMerchant"]>>>,
  resolverUrl: string,
): Response {
  return jsonResponse({
    identifier: {
      id: merchant.identifier_id,
      type: "custom",
      value: merchant.identifier_value,
      status: "active",
      controller: merchant.controller_id,
    },
    qr_payload: {
      resolver_url: resolverUrl,
      type: "custom",
      value: merchant.identifier_value,
    },
    safety: {
      testnet_chain: "base-sepolia",
      asset: merchant.asset,
      wallet_address: merchant.wallet_address,
      token_contract: merchant.token_contract,
      warning: "Only send funds after confirming the selected network and destination.",
    },
  });
}
