import {
  apiError,
  type ResolveRequest,
  type ResolveResponse,
} from "@universal-payment/protocol";
import {
  getIdentifierType,
  inferIdentifierType,
  looksLikeEmvQrPayload,
  normalizeIdentifier,
  setExternalNamespaceMatcher,
  validateIdentifier,
} from "@universal-payment/identifier-types";
import {
  createExternalNamingRegistry,
  isExternalNameCandidate,
  toResolveResponse,
  type ExternalNamingEnv,
  type NameResolverRegistry,
} from "@universal-payment/external-naming";
import { isExternalNamespaceName } from "./external-namespace-rules.js";
import { authenticateResolver, providerAllowsType } from "./auth.js";
import type { RegistryConfig } from "./config.js";
import {
  getCachedResolve,
  setCachedResolve,
  shouldCacheResolveStatus,
} from "./cache.js";
import { errorResponse, jsonResponse } from "./http.js";
import { enrichPaymentOption } from "./payment-presets.js";
import {
  evaluateRegistryPolicy,
  evaluateUnrPolicy,
} from "./resolve-policy.js";
import { enforceRateLimit } from "./rate-limit.js";
import { buildResolveResponse } from "./state.js";
import type { RegistryEnv } from "./auth.js";
import type { RegistryStore } from "./store.js";

// Wire restricted-name / registration checks to Universal Name Resolution
// namespace rules (TLD → provider), not individual external names.
setExternalNamespaceMatcher((value) => isExternalNamespaceName(value));

let externalRegistry: NameResolverRegistry | null = null;

function getExternalNamingRegistry(env: RegistryEnv): NameResolverRegistry {
  if (!externalRegistry) {
    const namingEnv: ExternalNamingEnv = {
      ETHEREUM_RPC_URL: env.ETHEREUM_RPC_URL,
      BASE_RPC_URL: env.BASE_RPC_URL,
      POLYGON_RPC_URL: env.POLYGON_RPC_URL,
      SOLANA_RPC_URL: env.SOLANA_RPC_URL,
      UNSTOPPABLE_API_KEY: env.UNSTOPPABLE_API_KEY,
      UNSTOPPABLE_API_BASE: env.UNSTOPPABLE_API_BASE,
      SNS_RESOLVE_URL: env.SNS_RESOLVE_URL,
    };
    externalRegistry = createExternalNamingRegistry({ env: namingEnv });
  }
  return externalRegistry;
}

/** Test helper: reset cached registry (e.g. after injecting clients). */
export function resetExternalNamingRegistryForTests(): void {
  externalRegistry = null;
}

function mapExternalFailureStatus(
  code: string,
): { status: number; errorCode: string } {
  switch (code) {
    case "UNSUPPORTED_NAMESPACE":
      return { status: 400, errorCode: "TYPE_NOT_SUPPORTED" };
    case "NAME_NOT_FOUND":
      return { status: 404, errorCode: "IDENTIFIER_NOT_FOUND" };
    case "NO_PAYMENT_ADDRESS":
      return { status: 404, errorCode: "IDENTIFIER_NOT_FOUND" };
    case "INVALID_DESTINATION":
      return { status: 422, errorCode: "VALIDATION_ERROR" };
    default:
      return { status: 502, errorCode: "INTERNAL_ERROR" };
  }
}

export async function handleResolve(
  store: RegistryStore,
  config: RegistryConfig,
  request: Request,
  env: RegistryEnv,
  waitUntil?: (promise: Promise<unknown>) => void,
): Promise<Response> {
  const auth = await authenticateResolver(store, request, env);
  if (!auth || (auth.kind === "provider" && auth.provider.status !== "APPROVED")) {
    return errorResponse(
      apiError("PROVIDER_NOT_APPROVED", "Provider credential is not approved."),
      401,
    );
  }

  let body: ResolveRequest;
  try {
    body = (await request.json()) as ResolveRequest;
  } catch {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Request body must be valid JSON."),
      400,
    );
  }
  if (!body || typeof body !== "object" || Array.isArray(body)) {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Request body must be a JSON object."),
      400,
    );
  }
  const rawValue = typeof body.value === "string" ? body.value : "";
  if (!rawValue.trim()) {
    return errorResponse(
      apiError("IDENTIFIER_INVALID", "Identifier value is invalid."),
      400,
    );
  }

  // --- Universal Name Resolution (external naming systems) -----------------
  // Server-side only: same POST /v1/resolve, same { value } (type optional).
  // Existing wallets need no client update — they already send the pasted
  // string and read payment_ready + payment_options. Optional
  // trust.external_resolver may be ignored.
  // Runs before Rezva provider_name / identifier store. Does not register or
  // own these names — authoritative sources only.
  if (isExternalNameCandidate(rawValue)) {
    if (auth.kind === "provider") {
      const unrPolicy = evaluateUnrPolicy(
        rawValue,
        auth.provider.resolve_policy,
      );
      if (!unrPolicy.ok) {
        return errorResponse(
          apiError("RESOLVE_POLICY_DENIED", unrPolicy.message),
          403,
        );
      }
    }
    const normalizedExternal = rawValue.trim().toLowerCase();
    const cacheType = "external_name";
    const cachedExternal = await getCachedResolve<ResolveResponse>(
      env,
      cacheType,
      normalizedExternal,
    );
    const usageBlockedExternal = await enforceUsage(store, env, auth);
    if (usageBlockedExternal) {
      return usageBlockedExternal;
    }
    if (cachedExternal && shouldCacheResolveStatus(cachedExternal.status)) {
      return jsonResponse(cachedExternal, 200);
    }

    const result = await getExternalNamingRegistry(env).resolve(rawValue);
    if (!result.ok) {
      const mapped = mapExternalFailureStatus(result.code);
      return errorResponse(
        apiError(
          mapped.errorCode as
            | "TYPE_NOT_SUPPORTED"
            | "IDENTIFIER_NOT_FOUND"
            | "VALIDATION_ERROR"
            | "INTERNAL_ERROR",
          result.message,
        ),
        mapped.status,
      );
    }

    const response = toResolveResponse(result, rawValue);
    response.payment_options = response.payment_options.map((option) => ({
      ...enrichPaymentOption({
        chain: option.chain,
        asset: option.asset,
        address: option.address,
      }),
      ...(option.network_identifier
        ? { network_identifier: option.network_identifier }
        : {}),
      ...(option.token_contract ? { token_contract: option.token_contract } : {}),
    }));
    defer(
      waitUntil,
      setCachedResolve(env, cacheType, normalizedExternal, response),
    );
    return jsonResponse(response, 200);
  }

  // Full Bangla/EMV QR text must never be treated as a provider name / custom handle.
  const inferredType = looksLikeEmvQrPayload(rawValue)
    ? "bangla_qr"
    : body.type || inferIdentifierType(rawValue);
  if (!inferredType) {
    return errorResponse(
      apiError("IDENTIFIER_INVALID", "Identifier value is invalid."),
      400,
    );
  }
  if (inferredType === "external_name") {
    // Matcher may be unset in some test harnesses; still fail closed.
    return errorResponse(
      apiError(
        "IDENTIFIER_NOT_FOUND",
        "No payment destination found for this name.",
      ),
      404,
    );
  }
  body.type = inferredType;
  body.value = rawValue;
  const cacheKey =
    body.type === "provider_name"
      ? body.value.trim().toLowerCase()
      : normalizeIdentifier(body.type, body.value) ?? body.value.trim().toLowerCase();

  const cached = await getCachedResolve<ResolveResponse>(env, body.type, cacheKey);
  const usageBlocked = await enforceUsage(store, env, auth);
  if (usageBlocked) {
    return usageBlocked;
  }
  if (cached && shouldCacheResolveStatus(cached.status)) {
    return jsonResponse(cached, 200);
  }

  if (body.type === "provider_name") {
    if (auth.kind === "provider") {
      const registryPolicy = evaluateRegistryPolicy(
        "provider_name",
        rawValue,
        auth.provider.resolve_policy,
      );
      if (!registryPolicy.ok) {
        return errorResponse(
          apiError("RESOLVE_POLICY_DENIED", registryPolicy.message),
          403,
        );
      }
    }
    const fullName = body.value.trim().toLowerCase();
    const row = await store.getNamespaceNameByFullName(fullName);
    if (!row || row.status !== "active" || !row.address) {
      return errorResponse(
        apiError(
          "IDENTIFIER_NOT_FOUND",
          "This name is not registered or not set up for payments.",
        ),
        404,
      );
    }
    const response: ResolveResponse = {
      protocol_version: "1",
      status: "active",
      payment_ready: true,
      identifier: {
        type: "provider_name",
        value: body.value,
        normalized_value: fullName,
      },
      registration: {
        registered_at: row.registered_at!,
        activated_at: row.activated_at ?? null,
        last_updated: row.last_updated!,
        last_payment_update: row.last_payment_update ?? null,
      },
      payment_options: [
        enrichPaymentOption({
          chain: row.chain!,
          asset: row.asset!,
          address: row.address!,
        }),
      ],
    };
    defer(waitUntil, setCachedResolve(env, "provider_name", fullName, response));
    return jsonResponse(response, 200);
  }

  const typeDef = getIdentifierType(body.type);
  if (!typeDef || !typeDef.resolution_eligible || typeDef.status !== "active") {
    return errorResponse(
      apiError("TYPE_NOT_SUPPORTED", "Identifier type is not supported."),
      400,
    );
  }

  if (auth.kind === "provider" && !providerAllowsType(auth.provider, body.type)) {
    return errorResponse(
      apiError("PROVIDER_NOT_APPROVED", "Provider may not resolve this type."),
      403,
    );
  }

  if (auth.kind === "provider") {
    const registryPolicy = evaluateRegistryPolicy(
      body.type,
      rawValue,
      auth.provider.resolve_policy,
    );
    if (!registryPolicy.ok) {
      return errorResponse(
        apiError("RESOLVE_POLICY_DENIED", registryPolicy.message),
        403,
      );
    }
  }

  const normalized = normalizeIdentifier(body.type, body.value);
  if (!normalized || !validateIdentifier(body.type, body.value)) {
    return errorResponse(
      apiError("IDENTIFIER_INVALID", "Identifier value is invalid."),
      400,
    );
  }

  const identifier = await store.getIdentifierByTypeValue(body.type, normalized);
  if (!identifier) {
    return errorResponse(
      apiError(
        "IDENTIFIER_NOT_FOUND",
        "No payment destination found for this.",
      ),
      404,
    );
  }

  if (identifier.status === "removed" || identifier.status === "revoked") {
    const response: ResolveResponse = {
      protocol_version: "1",
      status: identifier.status === "revoked" ? "revoked" : "removed",
      payment_ready: false,
      identifier: {
        type: body.type,
        value: body.value,
        normalized_value: normalized,
      },
      registration: {
        registered_at: identifier.registered_at,
        activated_at: identifier.activated_at,
        last_updated: identifier.last_updated,
        last_payment_update: identifier.last_payment_update,
      },
      payment_options: [],
      available_at: identifier.status === "revoked" ? null : identifier.available_at,
      removal_kind:
        identifier.status === "revoked" || !identifier.available_at
          ? "revoked"
          : "controller_removed",
    };
    defer(waitUntil, setCachedResolve(env, body.type, normalized, response));
    return jsonResponse(response, 200);
  }

  const response = await buildResolveResponse(
    store,
    identifier,
    config,
    body.value,
  );
  defer(waitUntil, setCachedResolve(env, body.type, normalized, response));
  return jsonResponse(response, 200);
}

function defer(
  waitUntil: ((promise: Promise<unknown>) => void) | undefined,
  promise: Promise<unknown>,
) {
  if (waitUntil) {
    waitUntil(promise);
    return;
  }
  void promise;
}

async function enforceUsage(
  store: RegistryStore,
  env: RegistryEnv,
  auth: NonNullable<Awaited<ReturnType<typeof authenticateResolver>>>,
): Promise<Response | null> {
  if (auth.kind === "provider") {
    const usageResult = await store.recordProviderUsage(auth.provider.provider_id);
    if (usageResult && !usageResult.allowed) {
      return errorResponse(
        apiError(
          "PROVIDER_RATE_LIMITED",
          "Provider resolve limit reached. Try again after the limit resets.",
        ),
        429,
        {
          "Retry-After": String(usageResult.retry_after_seconds ?? 60),
          "X-Provider-Minute-Limit": String(usageResult.usage.requests_per_minute),
          "X-Provider-Day-Limit": String(usageResult.usage.requests_per_day),
        },
      );
    }
    return enforceRateLimit(env, `resolve:${auth.provider.provider_id}`, 120, 60);
  }

  const usageResult = await store.recordFreeApiUsage(auth.credential.id);
  if (!usageResult) {
    return errorResponse(apiError("UNAUTHORIZED", "Free API credential is invalid."), 401);
  }
  if (!usageResult.allowed) {
    return errorResponse(
      apiError(
        "FREE_API_RATE_LIMITED",
        "Free API request limit reached. Try again after the limit resets.",
      ),
      429,
      {
        "Retry-After": String(usageResult.retry_after_seconds ?? 60),
        "X-Free-API-Minute-Limit": String(usageResult.usage.requests_per_minute),
        "X-Free-API-Day-Limit": String(usageResult.usage.requests_per_day),
      },
    );
  }
  return null;
}

export type { AuthContext } from "./auth.js";
