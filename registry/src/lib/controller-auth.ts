import { apiError } from "@universal-payment/protocol";
import { Redis } from "@upstash/redis/cloudflare";
import { errorResponse } from "./http.js";
import { sha256Hex } from "./config.js";
import { allowInsecureDevAuth, timingSafeEqualString } from "./security.js";

export type ControllerAuthMode = "dev" | "hmac";

export type ControllerAuthEnv = {
  CONTROLLER_AUTH_MODE?: string;
  CONTROLLER_AUTH_HMAC_SECRET?: string;
  UPSTASH_REDIS_REST_URL?: string;
  UPSTASH_REDIS_REST_TOKEN?: string;
  ENVIRONMENT?: string;
  ALLOW_INSECURE_DEV_AUTH?: string;
};

export type ControllerAuthorization = {
  controller: string;
  operation: string;
  resource: string;
  request_id: string;
  issued_at: string;
  expires_at: string;
  signature: string;
};

function authMode(env: ControllerAuthEnv): ControllerAuthMode {
  // Production never allows header-only controller auth.
  if (!allowInsecureDevAuth(env)) {
    return "hmac";
  }
  const mode = (env.CONTROLLER_AUTH_MODE ?? "dev").toLowerCase();
  return mode === "hmac" ? "hmac" : "dev";
}

function redis(env: ControllerAuthEnv): Redis | null {
  if (!env.UPSTASH_REDIS_REST_URL || !env.UPSTASH_REDIS_REST_TOKEN) {
    return null;
  }
  return new Redis({
    url: env.UPSTASH_REDIS_REST_URL,
    token: env.UPSTASH_REDIS_REST_TOKEN,
  });
}

function canonicalMessage(auth: Omit<ControllerAuthorization, "signature">): string {
  return [
    "rezva-controller-auth-v1",
    auth.controller.toLowerCase(),
    auth.operation,
    auth.resource,
    auth.request_id,
    auth.issued_at,
    auth.expires_at,
  ].join("|");
}

async function hmacSign(secret: string, message: string): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const sig = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(message),
  );
  return [...new Uint8Array(sig)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

function parseAuthorizationHeader(request: Request): ControllerAuthorization | null {
  const raw = request.headers.get("x-controller-authorization");
  if (!raw) {
    return null;
  }
  try {
    const parsed = JSON.parse(raw) as ControllerAuthorization;
    if (
      !parsed.controller ||
      !parsed.operation ||
      !parsed.resource ||
      !parsed.request_id ||
      !parsed.issued_at ||
      !parsed.expires_at ||
      !parsed.signature
    ) {
      return null;
    }
    return parsed;
  } catch {
    return null;
  }
}

export async function verifyControllerAuthorization(
  request: Request,
  env: ControllerAuthEnv,
  expected: {
    controllerWallet: string;
    operation: string;
    resource: string;
  },
): Promise<Response | null> {
  const mode = authMode(env);

  if (mode === "dev") {
    // Header-only controller wallet is allowed in local/dev only.
    return null;
  }

  if (!env.CONTROLLER_AUTH_HMAC_SECRET) {
    return errorResponse(
      apiError(
        "INTERNAL_ERROR",
        "CONTROLLER_AUTH_HMAC_SECRET is required when CONTROLLER_AUTH_MODE=hmac.",
      ),
      500,
    );
  }

  const auth = parseAuthorizationHeader(request);
  if (!auth) {
    return errorResponse(
      apiError(
        "CONTROLLER_UNAUTHORIZED",
        "X-Controller-Authorization is required in hmac auth mode.",
      ),
      401,
    );
  }

  if (auth.controller.toLowerCase() !== expected.controllerWallet.toLowerCase()) {
    return errorResponse(
      apiError("CONTROLLER_UNAUTHORIZED", "Controller does not match authorization."),
      401,
    );
  }
  if (auth.operation !== expected.operation) {
    return errorResponse(
      apiError("CONTROLLER_UNAUTHORIZED", "Operation does not match authorization."),
      401,
    );
  }
  if (auth.resource !== expected.resource) {
    return errorResponse(
      apiError("CONTROLLER_UNAUTHORIZED", "Resource does not match authorization."),
      401,
    );
  }

  const now = Date.now();
  const issued = Date.parse(auth.issued_at);
  const expires = Date.parse(auth.expires_at);
  if (Number.isNaN(issued) || Number.isNaN(expires)) {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Authorization timestamps are invalid."),
      400,
    );
  }
  if (expires <= now) {
    return errorResponse(
      apiError("AUTHORIZATION_EXPIRED", "Controller authorization has expired."),
      401,
    );
  }
  if (Math.abs(now - issued) > 24 * 60 * 60 * 1000) {
    return errorResponse(
      apiError("AUTHORIZATION_EXPIRED", "Controller authorization issued_at is out of range."),
      401,
    );
  }

  const expectedSig = await hmacSign(
    env.CONTROLLER_AUTH_HMAC_SECRET,
    canonicalMessage(auth),
  );
  if (!timingSafeEqualString(expectedSig, auth.signature.toLowerCase())) {
    return errorResponse(
      apiError("SIGNATURE_INVALID", "Controller authorization signature is invalid."),
      401,
    );
  }

  const client = redis(env);
  if (client) {
    const nonceKey = `rezva:auth_nonce:${auth.controller.toLowerCase()}:${auth.request_id}`;
    const seen = await client.get<string>(nonceKey);
    if (seen) {
      return errorResponse(
        apiError("AUTHORIZATION_REPLAY", "Controller authorization request_id was reused."),
        401,
      );
    }
    const ttlSeconds = Math.max(60, Math.ceil((expires - now) / 1000) + 60);
    await client.set(nonceKey, "1", { ex: ttlSeconds });
  }

  return null;
}

export async function claimIdempotencyKey(
  env: ControllerAuthEnv,
  scope: string,
  key: string | null,
): Promise<{ replay?: unknown; conflict?: Response } | null> {
  if (!key) {
    return null;
  }
  const client = redis(env);
  if (!client) {
    return null;
  }
  const digest = await sha256Hex(key);
  const redisKey = `rezva:idempotency:${scope}:${digest}`;
  const existing = await client.get<string>(redisKey);
  if (existing === "pending") {
    return {
      conflict: errorResponse(
        apiError("IDEMPOTENCY_CONFLICT", "A request with this Idempotency-Key is in progress."),
        409,
      ),
    };
  }
  if (existing) {
    try {
      return { replay: JSON.parse(existing) };
    } catch {
      return { replay: existing };
    }
  }
  await client.set(redisKey, "pending", { ex: 86400 });
  return null;
}

export async function storeIdempotencyResult(
  env: ControllerAuthEnv,
  scope: string,
  key: string | null,
  body: unknown,
): Promise<void> {
  if (!key) {
    return;
  }
  const client = redis(env);
  if (!client) {
    return;
  }
  const digest = await sha256Hex(key);
  const redisKey = `rezva:idempotency:${scope}:${digest}`;
  await client.set(redisKey, JSON.stringify(body), { ex: 86400 });
}
