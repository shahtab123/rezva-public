import { nowIso, newId } from "./config.js";
import { isSafeWebhookUrl } from "./security.js";
import type { RegistryStore } from "./store.js";

export type RegistryHooks = {
  waitUntil?: (promise: Promise<unknown>) => void;
};

export type ProviderWebhookEvent =
  | "identifier.registered"
  | "identifier.updated"
  | "identifier.removed"
  | "complaint.filed"
  | "complaint.resolved"
  | "namespace.name_registered";

export function scheduleProviderWebhook(
  store: RegistryStore,
  hooks: RegistryHooks | undefined,
  input: {
    providerId: string;
    event: ProviderWebhookEvent;
    data: Record<string, unknown>;
  },
): void {
  const task = dispatchProviderWebhooks(store, input);
  if (hooks?.waitUntil) {
    hooks.waitUntil(task);
    return;
  }
  void task;
}

async function dispatchProviderWebhooks(
  store: RegistryStore,
  input: {
    providerId: string;
    event: ProviderWebhookEvent;
    data: Record<string, unknown>;
  },
): Promise<void> {
  const webhooks = await store.listProviderWebhooksForDispatch(
    input.providerId,
    input.event,
  );
  await Promise.allSettled(
    webhooks.map((webhook) =>
      deliverWebhook(store, webhook, input.event, input.data),
    ),
  );
}

async function deliverWebhook(
  store: RegistryStore,
  webhook: {
    id: string;
    provider_id: string;
    url: string;
    signing_secret: string;
  },
  event: ProviderWebhookEvent,
  data: Record<string, unknown>,
): Promise<void> {
  const deliveryId = newId("whd");
  const timestamp = nowIso();
  const envelope = {
    id: deliveryId,
    event,
    created_at: timestamp,
    data,
  };
  const body = JSON.stringify(envelope);
  const signature = await signPayload(webhook.signing_secret, timestamp, body);

  try {
    if (!isSafeWebhookUrl(webhook.url)) {
      await store.recordWebhookDelivery({
        id: deliveryId,
        webhookId: webhook.id,
        providerId: webhook.provider_id,
        event,
        status: "FAILED",
        httpStatus: null,
        errorMessage: "Webhook URL rejected (HTTPS public host required).",
      });
      return;
    }
    const response = await fetch(webhook.url, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "User-Agent": "Rezva-Webhook/1",
        "X-Rezva-Event": event,
        "X-Rezva-Delivery-Id": deliveryId,
        "X-Rezva-Timestamp": timestamp,
        "X-Rezva-Signature": `t=${timestamp},v1=${signature}`,
      },
      body,
      signal: AbortSignal.timeout(15_000),
    });
    await store.recordWebhookDelivery({
      id: deliveryId,
      webhookId: webhook.id,
      providerId: webhook.provider_id,
      event,
      status: response.ok ? "DELIVERED" : "FAILED",
      httpStatus: response.status,
      errorMessage: response.ok ? null : `HTTP ${response.status}`,
    });
  } catch (error) {
    await store.recordWebhookDelivery({
      id: deliveryId,
      webhookId: webhook.id,
      providerId: webhook.provider_id,
      event,
      status: "FAILED",
      httpStatus: null,
      errorMessage: error instanceof Error ? error.message : "Delivery failed",
    });
  }
}

async function signPayload(
  secret: string,
  timestamp: string,
  body: string,
): Promise<string> {
  const key = await crypto.subtle.importKey(
    "raw",
    new TextEncoder().encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"],
  );
  const signed = await crypto.subtle.sign(
    "HMAC",
    key,
    new TextEncoder().encode(`${timestamp}.${body}`),
  );
  return [...new Uint8Array(signed)]
    .map((byte) => byte.toString(16).padStart(2, "0"))
    .join("");
}

export function identifierWebhookPayload(
  row: NonNullable<Awaited<ReturnType<RegistryStore["getIdentifierById"]>>>,
  paymentOptions?: Awaited<ReturnType<RegistryStore["listDestinationsAsInput"]>>,
): Record<string, unknown> {
  return {
    identifier: {
      id: row.id,
      type: row.type,
      value: row.display_value,
      normalized_value: row.normalized_value,
      status: row.status,
      controller_id: row.controller_id,
      name_id: row.name_id,
      registered_at: row.registered_at,
      activated_at: row.activated_at,
      last_updated: row.last_updated,
      available_at: row.available_at,
      ...(paymentOptions ? { payment_options: paymentOptions } : {}),
    },
  };
}
