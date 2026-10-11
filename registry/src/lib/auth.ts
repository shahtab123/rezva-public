import type {
  FreeApiCredentialRecord,
  WalletProviderRecord,
} from "@universal-payment/protocol";
import { apiError } from "@universal-payment/protocol";
import { sha256Hex } from "./config.js";
import { errorResponse } from "./http.js";
import { timingSafeEqualString } from "./security.js";
import type { RegistryStore } from "./store.js";

export type AuthContext = {
  provider: WalletProviderRecord;
  controllerWallet: string | null;
  controllerId: string | null;
};

export type RegistryEnv = {
  DB?: D1Database;
  DATABASE_URL?: string;
  DEV_PROVIDER_KEY?: string;
  OPERATOR_API_KEY?: string;
  DASHBOARD_SERVICE_KEY?: string;
  CONTROLLER_AUTH_MODE?: string;
  CONTROLLER_AUTH_HMAC_SECRET?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  REGISTRATION_SAFETY_SECONDS?: string;
  UPDATE_SAFETY_SECONDS?: string;
  REMOVAL_COOLDOWN_SECONDS?: string;
  RESOLVER_URL?: string;
  /** Public resolve URL for Test Merchant QR (never localhost). */
  PUBLIC_RESOLVER_URL?: string;
  BASE_SEPOLIA_RPC_URL?: string;
  BASESCAN_API_KEY?: string;
  ENVIRONMENT?: string;
  ALLOW_INSECURE_DEV_AUTH?: string;
  OPERATOR_RECLAIM_DUAL_TOKEN?: string;
  /** Universal Name Resolution (external naming systems). */
  ETHEREUM_RPC_URL?: string;
  BASE_RPC_URL?: string;
  POLYGON_RPC_URL?: string;
  SOLANA_RPC_URL?: string;
  UNSTOPPABLE_API_KEY?: string;
  UNSTOPPABLE_API_BASE?: string;
  SNS_RESOLVE_URL?: string;
};

export type ResolverAuth =
  | { kind: "provider"; provider: WalletProviderRecord }
  | { kind: "free"; credential: FreeApiCredentialRecord };

function getApiKey(request: Request): string | null {
  const auth = request.headers.get("authorization");
  const value = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : (request.headers.get("x-api-key")?.trim() ?? null);
  return value || null;
}

export function authenticateOperator(
  request: Request,
  env: RegistryEnv,
): boolean {
  if (!env.OPERATOR_API_KEY) {
    return false;
  }
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : (request.headers.get("x-operator-key")?.trim() ?? null);
  return Boolean(token && timingSafeEqualString(token, env.OPERATOR_API_KEY));
}

export function authenticateDashboardService(
  request: Request,
  env: RegistryEnv,
): boolean {
  const expected = env.DASHBOARD_SERVICE_KEY || env.DEV_PROVIDER_KEY;
  if (!expected) return false;
  const auth = request.headers.get("authorization");
  const token = auth?.startsWith("Bearer ")
    ? auth.slice("Bearer ".length).trim()
    : (request.headers.get("x-dashboard-service-key")?.trim() ?? null);
  return Boolean(token && timingSafeEqualString(token, expected));
}

const AUTH_CACHE_TTL_MS = 60_000;
const providerAuthCache = new Map<
  string,
  { at: number; provider: WalletProviderRecord }
>();
const freeAuthCache = new Map<
  string,
  { at: number; credential: FreeApiCredentialRecord }
>();

export function invalidateAuthCaches(apiKey?: string): void {
  if (apiKey) {
    providerAuthCache.delete(apiKey);
    freeAuthCache.delete(apiKey);
    return;
  }
  providerAuthCache.clear();
  freeAuthCache.clear();
}

export async function authenticateProvider(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<WalletProviderRecord | null> {
  const apiKey = getApiKey(request);

  if (!apiKey) {
    return null;
  }

  const cached = providerAuthCache.get(apiKey);
  if (cached && Date.now() - cached.at < AUTH_CACHE_TTL_MS) {
    return cached.provider;
  }

  let provider: WalletProviderRecord | null = null;
  if (env.DEV_PROVIDER_KEY && timingSafeEqualString(apiKey, env.DEV_PROVIDER_KEY)) {
    provider = await store.getDevProvider();
  } else {
    provider = await store.getProviderByApiKeyHash(await sha256Hex(apiKey));
  }
  if (provider) {
    providerAuthCache.set(apiKey, { at: Date.now(), provider });
  }
  return provider;
}

export async function authenticateResolver(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<ResolverAuth | null> {
  const provider = await authenticateProvider(store, request, env);
  if (provider) {
    return { kind: "provider", provider };
  }

  const apiKey = getApiKey(request);
  if (!apiKey) return null;
  const cached = freeAuthCache.get(apiKey);
  if (cached && Date.now() - cached.at < AUTH_CACHE_TTL_MS) {
    if (cached.credential.status !== "ACTIVE") return null;
    return { kind: "free", credential: cached.credential };
  }
  const credential = await store.getFreeApiCredentialByKeyHash(
    await sha256Hex(apiKey),
  );
  if (!credential || credential.status !== "ACTIVE") return null;
  freeAuthCache.set(apiKey, { at: Date.now(), credential });
  return { kind: "free", credential };
}

export function getControllerWallet(request: Request): string | null {
  const wallet =
    request.headers.get("x-controller-wallet") ??
    request.headers.get("x-controller-address");
  if (!wallet) {
    return null;
  }
  return wallet.trim().toLowerCase();
}

export async function buildAuthContext(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<AuthContext | null> {
  const provider = await authenticateProvider(store, request, env);
  if (!provider || provider.status !== "APPROVED") {
    return null;
  }

  const controllerWallet = getControllerWallet(request);
  let controllerId: string | null = null;
  if (controllerWallet) {
    controllerId = await store.ensureController(controllerWallet);
  }

  return {
    provider,
    controllerWallet,
    controllerId,
  };
}

export function providerAllowsType(
  provider: WalletProviderRecord,
  type: string,
): boolean {
  if (!provider.allowed_identifier_types.length) {
    return true;
  }
  return provider.allowed_identifier_types.includes(type);
}

export function requireController(auth: AuthContext): boolean {
  return Boolean(auth.controllerId && auth.controllerWallet);
}

export function requireMerchantSetup(auth: AuthContext): Response | null {
  if (auth.provider.integration_level === "RESOLVER_ONLY") {
    return errorResponse(
      apiError(
        "PROVIDER_INTEGRATION_FORBIDDEN",
        "Resolver-only providers may not perform registry management mutations.",
      ),
      403,
    );
  }
  return null;
}
