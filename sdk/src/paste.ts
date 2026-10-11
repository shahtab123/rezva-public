import type { ResolveResponse } from "@universal-payment/protocol";
import {
  inferIdentifierType,
  setExternalNamespaceMatcher,
} from "@universal-payment/identifier-types";
import {
  isExternalNamespaceName,
  matchExternalNamespace,
} from "@universal-payment/external-naming/namespaces";

// Ensure SDK inferIdentifierType uses the full external TLD list (not the legacy regex).
setExternalNamespaceMatcher((value) => isExternalNamespaceName(value));

const ETH_ADDRESS_PATTERN = /^0x[a-fA-F0-9]{40}$/;

export type PasteClientOptions = {
  baseUrl: string;
  apiKey?: string;
  fetch?: typeof fetch;
  signal?: AbortSignal;
};

export type PasteClassifyResult =
  | { action: "empty" }
  | { action: "native_address"; address: string }
  | {
      action: "resolve";
      value: string;
      /** Hint only — prefer omitting type on the wire (see resolvePaste). */
      suggestedType: string | null;
      external: boolean;
    };

/**
 * Classify a Send/paste string for Rezva resolution.
 *
 * External names (.eth / .sol / .base / Unstoppable TLDs, …) are always
 * `action: "resolve"`. Do **not** short-circuit them to local ENS/SNS —
 * payment resolution belongs on `POST /v1/resolve`.
 */
export function classifyPaste(raw: string): PasteClassifyResult {
  const value = (raw ?? "").trim();
  if (!value) {
    return { action: "empty" };
  }
  if (ETH_ADDRESS_PATTERN.test(value)) {
    return { action: "native_address", address: value };
  }
  const external = isExternalNamespaceName(value);
  const suggestedType = external
    ? "external_name"
    : inferIdentifierType(value);
  return {
    action: "resolve",
    value,
    suggestedType,
    external,
  };
}

/**
 * Whether this paste should be sent to `POST /v1/resolve` (vs treated as a
 * raw chain address). External crypto names always return true.
 */
export function shouldResolveWithRezva(raw: string): boolean {
  return classifyPaste(raw).action === "resolve";
}

/**
 * Resolve a pasted Send string via Rezva.
 *
 * Always posts `{ value }` with **no** `type` field so the Worker can:
 * - route external TLDs to Universal Name Resolution, and
 * - infer Rezva identifier types for everything else.
 *
 * This is the integration path that requires no per-TLD wallet logic.
 */
export async function resolvePaste(
  value: string,
  options: PasteClientOptions,
): Promise<ResolveResponse> {
  const classified = classifyPaste(value);
  if (classified.action === "empty") {
    throw new Error("Cannot resolve an empty identifier.");
  }
  if (classified.action === "native_address") {
    throw new Error(
      "Value is a native chain address; do not call resolve — use it directly.",
    );
  }

  const fetchImpl = options.fetch ?? fetch;
  const endpoint = `${options.baseUrl.replace(/\/$/, "")}/v1/resolve`;
  const headers: Record<string, string> = {
    "content-type": "application/json",
  };
  if (options.apiKey) {
    headers.authorization = `Bearer ${options.apiKey}`;
  }

  const response = await fetchImpl(endpoint, {
    method: "POST",
    headers,
    body: JSON.stringify({ value: classified.value }),
    signal: options.signal,
  });

  const text = await response.text();
  let body: unknown = null;
  if (text) {
    try {
      body = JSON.parse(text);
    } catch {
      body = { raw: text };
    }
  }

  if (!response.ok) {
    const err = body as { error?: { code?: string; message?: string } };
    const message =
      err?.error?.message ||
      `Resolver HTTP ${response.status}${text ? `: ${text}` : ""}`;
    const error = new Error(message) as Error & {
      code?: string;
      status?: number;
    };
    error.code = err?.error?.code || "RESOLVER_ERROR";
    error.status = response.status;
    throw error;
  }

  return body as ResolveResponse;
}

export {
  isExternalNamespaceName,
  matchExternalNamespace,
};
