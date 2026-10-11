import type { ProviderResolvePolicy } from "@universal-payment/protocol";
import { matchExternalNamespace } from "@universal-payment/external-naming/namespaces";

export type ResolvePolicyDecision =
  | { ok: true }
  | { ok: false; message: string };

function normalizeNamespace(ns: string): string {
  const trimmed = ns.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

function normalizeList(values: string[] | undefined): string[] {
  if (!values?.length) return [];
  return values
    .map((v) => v.trim().toLowerCase())
    .filter(Boolean);
}

/** Empty / missing policy fields keep current open behavior. */
export function normalizeResolvePolicy(
  policy: ProviderResolvePolicy | null | undefined,
): ProviderResolvePolicy {
  if (!policy || typeof policy !== "object") {
    return {};
  }
  const next: ProviderResolvePolicy = {};
  if (typeof policy.unr === "boolean") next.unr = policy.unr;
  if (typeof policy.registry === "boolean") next.registry = policy.registry;
  if (Array.isArray(policy.allow_namespaces)) {
    next.allow_namespaces = policy.allow_namespaces
      .map(normalizeNamespace)
      .filter(Boolean);
  }
  if (Array.isArray(policy.deny_namespaces)) {
    next.deny_namespaces = policy.deny_namespaces
      .map(normalizeNamespace)
      .filter(Boolean);
  }
  if (Array.isArray(policy.deny_types)) {
    next.deny_types = normalizeList(policy.deny_types);
  }
  if (Array.isArray(policy.blocklist)) {
    next.blocklist = normalizeList(policy.blocklist);
  }
  return next;
}

export function isBlocklisted(
  value: string,
  policy: ProviderResolvePolicy | null | undefined,
): boolean {
  const blocklist = normalizeResolvePolicy(policy).blocklist;
  if (!blocklist?.length) return false;
  const normalized = value.trim().toLowerCase();
  return blocklist.includes(normalized);
}

export function evaluateUnrPolicy(
  value: string,
  policy: ProviderResolvePolicy | null | undefined,
): ResolvePolicyDecision {
  const p = normalizeResolvePolicy(policy);
  if (p.unr === false) {
    return {
      ok: false,
      message: "Universal Name Resolution is disabled for this provider.",
    };
  }
  if (isBlocklisted(value, p)) {
    return {
      ok: false,
      message: "Identifier is blocked by provider resolve policy.",
    };
  }
  const match = matchExternalNamespace(value);
  if (!match) {
    return { ok: true };
  }
  const ns = match.namespace.toLowerCase();
  if (p.deny_namespaces?.includes(ns)) {
    return {
      ok: false,
      message: `External namespace ${ns} is denied by provider resolve policy.`,
    };
  }
  if (p.allow_namespaces?.length && !p.allow_namespaces.includes(ns)) {
    return {
      ok: false,
      message: `External namespace ${ns} is not allowed for this provider.`,
    };
  }
  return { ok: true };
}

export function evaluateRegistryPolicy(
  type: string,
  value: string,
  policy: ProviderResolvePolicy | null | undefined,
): ResolvePolicyDecision {
  const p = normalizeResolvePolicy(policy);
  if (p.registry === false) {
    return {
      ok: false,
      message: "Registry identifier resolve is disabled for this provider.",
    };
  }
  if (isBlocklisted(value, p)) {
    return {
      ok: false,
      message: "Identifier is blocked by provider resolve policy.",
    };
  }
  const typeKey = type.trim().toLowerCase();
  if (p.deny_types?.includes(typeKey)) {
    return {
      ok: false,
      message: `Identifier type ${typeKey} is denied by provider resolve policy.`,
    };
  }
  return { ok: true };
}
