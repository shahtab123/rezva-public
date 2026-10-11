import {
  apiError,
  PROVIDER_API_LIMITS,
} from "@universal-payment/protocol";
import { authenticateDashboardService, type RegistryEnv } from "./auth.js";
import { newId, nowIso, sha256Hex } from "./config.js";
import { errorResponse, jsonResponse, readJson } from "./http.js";
import { isSafeWebhookUrl } from "./security.js";
import type { RegistryStore } from "./store.js";

export const PROVIDER_WEBHOOK_EVENTS = [
  "identifier.registered",
  "identifier.updated",
  "identifier.removed",
  "complaint.filed",
  "complaint.resolved",
  "namespace.name_registered",
] as const;

function unauthorized(): Response {
  return errorResponse(
    apiError("UNAUTHORIZED", "Dashboard service authentication is required."),
    401,
  );
}

function generateProviderApiKey(): string {
  const bytes = new Uint8Array(32);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `rzva_prov_${encoded}`;
}

function generateWebhookSecret(): string {
  const bytes = new Uint8Array(24);
  crypto.getRandomValues(bytes);
  const encoded = btoa(String.fromCharCode(...bytes))
    .replace(/\+/g, "-")
    .replace(/\//g, "_")
    .replace(/=+$/g, "");
  return `whsec_${encoded}`;
}

function providerIdForUser(privyUserId: string): string {
  const slug = privyUserId.replace(/[^a-zA-Z0-9]/g, "").toLowerCase().slice(0, 24);
  return `provider_${slug || "user"}`;
}

function accountMetadata(
  account: NonNullable<Awaited<ReturnType<RegistryStore["getDashboardProviderAccount"]>>>,
) {
  return {
    privy_user_id: account.privy_user_id,
    provider_id: account.provider_id,
    key_prefix: account.key_prefix,
    last_used_at: account.last_used_at,
    created_at: account.created_at,
    updated_at: account.updated_at,
    limits: PROVIDER_API_LIMITS,
  };
}

function webhookMetadata(
  webhook: NonNullable<Awaited<ReturnType<RegistryStore["getProviderWebhook"]>>>,
) {
  return {
    id: webhook.id,
    provider_id: webhook.provider_id,
    url: webhook.url,
    secret_prefix: webhook.secret_prefix,
    events: webhook.events,
    status: webhook.status,
    created_at: webhook.created_at,
    updated_at: webhook.updated_at,
  };
}

function providerMetadata(
  provider: NonNullable<Awaited<ReturnType<RegistryStore["getProviderById"]>>>,
) {
  return {
    provider_id: provider.provider_id,
    name: provider.name,
    website: provider.website ?? null,
    status: provider.status,
    integration_level: provider.integration_level,
    allowed_identifier_types: provider.allowed_identifier_types,
    ...(provider.resolve_policy
      ? { resolve_policy: provider.resolve_policy }
      : {}),
    created_at: provider.created_at,
    updated_at: provider.updated_at,
  };
}

async function requireApprovedProviderApplication(
  store: RegistryStore,
  privyUserId: string,
): Promise<Response | null> {
  const application = await store.getApprovedProviderApplication(privyUserId);
  if (!application) {
    return errorResponse(
      apiError(
        "FORBIDDEN",
        "An approved wallet provider application is required.",
      ),
      403,
    );
  }
  return null;
}

async function requireLinkedAccount(
  store: RegistryStore,
  privyUserId: string,
): Promise<
  | Response
  | {
      account: NonNullable<
        Awaited<ReturnType<RegistryStore["getDashboardProviderAccount"]>>
      >;
      provider: NonNullable<Awaited<ReturnType<RegistryStore["getProviderById"]>>>;
    }
> {
  const denied = await requireApprovedProviderApplication(store, privyUserId);
  if (denied) return denied;
  const account = await store.getDashboardProviderAccount(privyUserId);
  if (!account) {
    return errorResponse(
      apiError("NOT_FOUND", "Provider dashboard account was not provisioned."),
      404,
    );
  }
  const provider = await store.getProviderById(account.provider_id);
  if (!provider) {
    return errorResponse(
      apiError("NOT_FOUND", "Linked provider record was not found."),
      404,
    );
  }
  return { account, provider };
}

function usageFromAccount(
  account: NonNullable<
    Awaited<ReturnType<RegistryStore["getDashboardProviderAccount"]>>
  >,
  timestamp = nowIso(),
) {
  const now = Date.parse(timestamp);
  const minuteActive =
    account.minute_started_at &&
    now - Date.parse(account.minute_started_at) < 60_000;
  const dayActive = account.day_started_at?.slice(0, 10) === timestamp.slice(0, 10);
  return {
    requests_per_minute: PROVIDER_API_LIMITS.requests_per_minute,
    requests_per_day: PROVIDER_API_LIMITS.requests_per_day,
    minute_count: minuteActive ? account.minute_count : 0,
    day_count: dayActive ? account.day_count : 0,
    minute_reset_at:
      minuteActive && account.minute_started_at
        ? new Date(Date.parse(account.minute_started_at) + 60_000).toISOString()
        : null,
    day_reset_at:
      dayActive && account.day_started_at
        ? new Date(
            Date.parse(`${account.day_started_at.slice(0, 10)}T00:00:00.000Z`) +
              86_400_000,
          ).toISOString()
        : null,
  };
}

export async function handleProviderDashboardRequest(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith("/v1/provider-dashboard/")) return null;
  if (!authenticateDashboardService(request, env)) {
    return unauthorized();
  }

  const accountMatch = path.match(/^\/v1\/provider-dashboard\/accounts\/([^/]+)$/);
  const accountActionMatch = path.match(
    /^\/v1\/provider-dashboard\/accounts\/([^/]+)\/(provision|regenerate-key|usage|webhooks)$/,
  );
  const webhookItemMatch = path.match(
    /^\/v1\/provider-dashboard\/accounts\/([^/]+)\/webhooks\/([^/]+)$/,
  );
  const webhookDeliveriesMatch = path.match(
    /^\/v1\/provider-dashboard\/accounts\/([^/]+)\/webhooks\/([^/]+)\/deliveries$/,
  );
  const privyUserId = accountMatch
    ? decodeURIComponent(accountMatch[1]!)
    : accountActionMatch
      ? decodeURIComponent(accountActionMatch[1]!)
      : webhookItemMatch
        ? decodeURIComponent(webhookItemMatch[1]!)
        : null;

  if (request.method === "GET" && accountMatch && privyUserId) {
    const denied = await requireApprovedProviderApplication(store, privyUserId);
    if (denied) return denied;
    const account = await store.getDashboardProviderAccount(privyUserId);
    if (!account) {
      return jsonResponse({
        account: null,
        provider: null,
        needs_provision: true,
        application_approved: true,
      });
    }
    const provider = await store.getProviderById(account.provider_id);
    return jsonResponse({
      account: accountMetadata(account),
      provider: provider ? providerMetadata(provider) : null,
      needs_provision: false,
      application_approved: true,
    });
  }

  if (request.method === "POST" && accountActionMatch?.[2] === "provision" && privyUserId) {
    const denied = await requireApprovedProviderApplication(store, privyUserId);
    if (denied) return denied;
    const existing = await store.getDashboardProviderAccount(privyUserId);
    if (existing) {
      const provider = await store.getProviderById(existing.provider_id);
      return errorResponse(
        apiError("PROVIDER_EXISTS", "Provider dashboard account already exists."),
        409,
      );
    }
    const application = await store.getApprovedProviderApplication(privyUserId);
    const payload = application?.payload ?? {};
    const name =
      payload["Wallet / product name"]?.trim() ||
      payload["Company name"]?.trim() ||
      "Wallet provider";
    const website = payload["Website"]?.trim() || undefined;
    const baseProviderId = providerIdForUser(privyUserId);
    const providerId = await store.ensureUniqueProviderId(baseProviderId);
    const apiKey = generateProviderApiKey();
    const { account, provider } = await store.provisionProviderDashboardAccount({
      privyUserId,
      providerId,
      name,
      website,
      integrationLevel: "RESOLVER_PLUS_MERCHANT_SETUP",
      allowedIdentifierTypes: [],
      apiKeyHash: await sha256Hex(apiKey),
      keyPrefix: apiKey.slice(0, 14),
    });
    return jsonResponse(
      {
        account: accountMetadata(account),
        provider: providerMetadata(provider),
        api_key: apiKey,
      },
      201,
    );
  }

  if (
    request.method === "POST" &&
    accountActionMatch?.[2] === "regenerate-key" &&
    privyUserId
  ) {
    const linked = await requireLinkedAccount(store, privyUserId);
    if (linked instanceof Response) return linked;
    const apiKey = generateProviderApiKey();
    const account = await store.regenerateProviderDashboardKey({
      privyUserId,
      apiKeyHash: await sha256Hex(apiKey),
      keyPrefix: apiKey.slice(0, 14),
    });
    return jsonResponse({
      account: account ? accountMetadata(account) : null,
      api_key: apiKey,
    });
  }

  if (request.method === "GET" && accountActionMatch?.[2] === "usage" && privyUserId) {
    const linked = await requireLinkedAccount(store, privyUserId);
    if (linked instanceof Response) return linked;
    return jsonResponse({ usage: usageFromAccount(linked.account) });
  }

  if (request.method === "GET" && accountActionMatch?.[2] === "webhooks" && privyUserId) {
    const linked = await requireLinkedAccount(store, privyUserId);
    if (linked instanceof Response) return linked;
    const webhooks = await store.listProviderWebhooks(linked.provider.provider_id);
    return jsonResponse({
      webhooks: webhooks.map(webhookMetadata),
      available_events: PROVIDER_WEBHOOK_EVENTS,
    });
  }

  if (request.method === "POST" && accountActionMatch?.[2] === "webhooks" && privyUserId) {
    const linked = await requireLinkedAccount(store, privyUserId);
    if (linked instanceof Response) return linked;
    const body = await readJson<{ url?: string; events?: string[] }>(request);
    const endpoint = body.url?.trim();
    if (!endpoint || !isSafeWebhookUrl(endpoint)) {
      return errorResponse(
        apiError(
          "VALIDATION_ERROR",
          "A valid public HTTPS webhook URL is required (no localhost/private IPs).",
        ),
        400,
      );
    }
    const events = (body.events ?? []).filter((event) =>
      PROVIDER_WEBHOOK_EVENTS.includes(event as (typeof PROVIDER_WEBHOOK_EVENTS)[number]),
    );
    if (!events.length) {
      return errorResponse(
        apiError("VALIDATION_ERROR", "Select at least one webhook event."),
        400,
      );
    }
    const secret = generateWebhookSecret();
    const webhook = await store.createProviderWebhook({
      id: newId("pwh"),
      providerId: linked.provider.provider_id,
      url: endpoint,
      secretHash: await sha256Hex(secret),
      secretPrefix: secret.slice(0, 12),
      signingSecret: secret,
      events,
    });
    return jsonResponse(
      {
        webhook: webhookMetadata(webhook),
        signing_secret: secret,
      },
      201,
    );
  }

  if (webhookDeliveriesMatch && request.method === "GET") {
    const privyUserId = decodeURIComponent(webhookDeliveriesMatch[1]!);
    const webhookId = decodeURIComponent(webhookDeliveriesMatch[2]!);
    const linked = await requireLinkedAccount(store, privyUserId);
    if (linked instanceof Response) return linked;
    const webhook = await store.getProviderWebhook(webhookId, linked.provider.provider_id);
    if (!webhook) {
      return errorResponse(apiError("NOT_FOUND", "Webhook was not found."), 404);
    }
    const deliveries = await store.listWebhookDeliveries(
      webhookId,
      linked.provider.provider_id,
    );
    return jsonResponse({ deliveries });
  }

  if (webhookItemMatch && privyUserId) {
    const webhookId = decodeURIComponent(webhookItemMatch[2]!);
    const linked = await requireLinkedAccount(store, privyUserId);
    if (linked instanceof Response) return linked;

    if (request.method === "PATCH") {
      const body = await readJson<{
        url?: string;
        events?: string[];
        status?: "ACTIVE" | "DISABLED";
      }>(request);
      if (body.url && !isSafeWebhookUrl(body.url.trim())) {
        return errorResponse(
          apiError(
            "VALIDATION_ERROR",
            "Webhook URL must be a public HTTPS endpoint (no localhost/private IPs).",
          ),
          400,
        );
      }
      const events = body.events
        ? body.events.filter((event) =>
            PROVIDER_WEBHOOK_EVENTS.includes(
              event as (typeof PROVIDER_WEBHOOK_EVENTS)[number],
            ),
          )
        : undefined;
      if (events && !events.length) {
        return errorResponse(
          apiError("VALIDATION_ERROR", "Select at least one webhook event."),
          400,
        );
      }
      const webhook = await store.updateProviderWebhook(webhookId, linked.provider.provider_id, {
        url: body.url?.trim(),
        events,
        status: body.status,
      });
      return webhook
        ? jsonResponse({ webhook: webhookMetadata(webhook) })
        : errorResponse(apiError("NOT_FOUND", "Webhook was not found."), 404);
    }

    if (request.method === "DELETE") {
      const deleted = await store.deleteProviderWebhook(
        webhookId,
        linked.provider.provider_id,
      );
      return deleted
        ? jsonResponse({ ok: true })
        : errorResponse(apiError("NOT_FOUND", "Webhook was not found."), 404);
    }
  }

  return null;
}
