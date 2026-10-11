import { apiError } from "@universal-payment/protocol";
import {
  configFromEnv,
  createDbExecutor,
  errorResponse,
  handleRegistryRequest,
  handleResolve,
  jsonResponse,
  RegistryStore,
} from "./lib/index.js";
import { handleFreeApiRequest } from "./lib/free-api-routes.js";
import { handleProviderDashboardRequest } from "./lib/provider-dashboard-routes.js";
import { handlePaymentRequest } from "./lib/payment-routes.js";
import { assertSecureRuntime } from "./lib/security.js";
import { isExternalNamespaceName } from "./lib/external-namespace-rules.js";
import { setExternalNamespaceMatcher } from "@universal-payment/identifier-types";

// Wire restricted-name / registration checks to Universal Name Resolution
// namespace rules for the whole worker (register + resolve), not only resolve.ts.
setExternalNamespaceMatcher((value) => isExternalNamespaceName(value));

export type Env = {
  DB?: D1Database;
  DATABASE_URL?: string;
  REGISTRATION_SAFETY_SECONDS?: string;
  UPDATE_SAFETY_SECONDS?: string;
  REMOVAL_COOLDOWN_SECONDS?: string;
  DEV_PROVIDER_KEY?: string;
  OPERATOR_API_KEY?: string;
  DASHBOARD_SERVICE_KEY?: string;
  TEST_MERCHANT_WALLET?: string;
  TEST_MERCHANT_IDENTIFIER?: string;
  TEST_MERCHANT_USDC_CONTRACT?: string;
  BASE_SEPOLIA_RPC_URL?: string;
  CONTROLLER_AUTH_MODE?: string;
  CONTROLLER_AUTH_HMAC_SECRET?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  RESOLVER_URL?: string;
  PUBLIC_RESOLVER_URL?: string;
  ENVIRONMENT?: string;
  ALLOW_INSECURE_DEV_AUTH?: string;
  OPERATOR_RECLAIM_DUAL_TOKEN?: string;
  ETHEREUM_RPC_URL?: string;
  BASE_RPC_URL?: string;
  POLYGON_RPC_URL?: string;
  SOLANA_RPC_URL?: string;
  UNSTOPPABLE_API_KEY?: string;
  UNSTOPPABLE_API_BASE?: string;
  SNS_RESOLVE_URL?: string;
};

const initByDialect = new Map<string, boolean>();

async function ensureInitialized(store: RegistryStore, env: Env): Promise<void> {
  const key = env.DATABASE_URL ? "postgres" : "d1";
  if (initByDialect.get(key)) {
    return;
  }
  // Neon schema is applied offline with `npm run db:migrate:neon`.
  // Running the full migrate() here makes one HTTP subrequest per SQL statement and
  // exceeds the Cloudflare Workers free-plan limit (50 subrequests per invocation).
  if (!env.DATABASE_URL) {
    await store.migrate();
  }
  if (env.DEV_PROVIDER_KEY) {
    await store.seedDevProvider(env.DEV_PROVIDER_KEY);
  }
  if (env.TEST_MERCHANT_WALLET?.trim()) {
    await store.ensureSharedTestMerchant({
      walletAddress: env.TEST_MERCHANT_WALLET,
      identifierValue: env.TEST_MERCHANT_IDENTIFIER?.trim() || "rezva-test-merchant",
      tokenContract:
        env.TEST_MERCHANT_USDC_CONTRACT?.trim() ||
        "0x036CbD53842c5426634e7929541eC2318f3dCF7e",
    });
  }
  initByDialect.set(key, true);
}

export default {
  async fetch(request: Request, env: Env, ctx: ExecutionContext): Promise<Response> {
    const url = new URL(request.url);
    const hooks = {
      waitUntil: (promise: Promise<unknown>) => ctx.waitUntil(promise),
    };

    let store: RegistryStore;
    try {
      store = new RegistryStore(createDbExecutor(env));
    } catch {
      return errorResponse(
        apiError("INTERNAL_ERROR", "Database is not configured."),
        500,
      );
    }

    if (request.method === "GET" && (url.pathname === "/" || url.pathname === "")) {
      return jsonResponse({
        service: "rezva-registry",
        ok: true,
        docs: "https://www.rezva.xyz/docs/introduction/overview",
        health: "/health",
        resolve: "POST /v1/resolve",
      });
    }

    const isResolve = request.method === "POST" && url.pathname === "/v1/resolve";
    try {
      if (!isResolve) {
        await ensureInitialized(store, env);
      }
    } catch (error) {
      console.error("Registry database initialization failed", error);
      if (request.method === "GET" && url.pathname === "/health") {
        return errorResponse(
          apiError("INTERNAL_ERROR", "Database is unavailable."),
          503,
        );
      }
      throw new Error("Database initialization failed.");
    }
    if (request.method === "GET" && url.pathname === "/health") {
      const backend = env.DATABASE_URL ? "neon" : "d1";
      return jsonResponse({ ok: true, service: "registry", database: backend });
    }

    const secureRuntime = assertSecureRuntime(env);
    if (secureRuntime) {
      return secureRuntime;
    }

    const config = configFromEnv(env);

    if (request.method === "POST" && url.pathname === "/v1/resolve") {
      try {
        return await handleResolve(store, config, request, env, (promise) =>
          ctx.waitUntil(promise),
        );
      } catch (error) {
        console.error("Resolve failed", error);
        return errorResponse(
          apiError("INTERNAL_ERROR", "Resolver failed to process the request."),
          500,
        );
      }
    }

    const freeApiResponse = await handleFreeApiRequest(store, request, env);
    if (freeApiResponse) {
      return freeApiResponse;
    }
    const providerDashboardResponse = await handleProviderDashboardRequest(
      store,
      request,
      env,
    );
    if (providerDashboardResponse) {
      return providerDashboardResponse;
    }
    const paymentResponse = await handlePaymentRequest(store, request, env, hooks);
    if (paymentResponse) {
      return paymentResponse;
    }

    const response = await handleRegistryRequest(store, config, request, env, hooks);
    if (response) {
      return response;
    }

    return errorResponse(apiError("NOT_FOUND", "Route was not found."), 404);
  },

  async scheduled(_event: ScheduledEvent, env: Env): Promise<void> {
    try {
      const store = new RegistryStore(createDbExecutor(env));
      await store.ping();
    } catch (error) {
      console.error("Keep-alive ping failed", error);
    }
  },
};
