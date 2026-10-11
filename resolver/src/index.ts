import { handleResolve, RegistryStore, configFromEnv, createDbExecutor } from "@universal-payment/registry/lib";

export type Env = {
  DB?: D1Database;
  DATABASE_URL?: string;
  REGISTRATION_SAFETY_SECONDS?: string;
  UPDATE_SAFETY_SECONDS?: string;
  REMOVAL_COOLDOWN_SECONDS?: string;
  DEV_PROVIDER_KEY?: string;
  TEST_MERCHANT_WALLET?: string;
  TEST_MERCHANT_IDENTIFIER?: string;
  TEST_MERCHANT_USDC_CONTRACT?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
};

const initByDialect = new Map<string, boolean>();

async function ensureInitialized(store: RegistryStore, env: Env): Promise<void> {
  const key = env.DATABASE_URL ? "postgres" : "d1";
  if (initByDialect.get(key)) {
    return;
  }
  await store.migrate();
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
  async fetch(request: Request, env: Env): Promise<Response> {
    const url = new URL(request.url);

    if (request.method === "POST" && url.pathname === "/v1/resolve") {
      const store = new RegistryStore(createDbExecutor(env));
      await ensureInitialized(store, env);
      const config = configFromEnv(env);
      return handleResolve(store, config, request, env);
    }

    if (request.method === "GET" && url.pathname === "/health") {
      try {
        const store = new RegistryStore(createDbExecutor(env));
        await ensureInitialized(store, env);
        return Response.json({
          ok: true,
          service: "resolver",
          database: env.DATABASE_URL ? "neon" : "d1",
        });
      } catch {
        return Response.json(
          { ok: false, service: "resolver", error: "Database is unavailable." },
          { status: 503 },
        );
      }
    }

    return Response.json({ error: { code: "NOT_FOUND" } }, { status: 404 });
  },
};
