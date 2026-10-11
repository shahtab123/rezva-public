import type { ProviderResolvePolicy } from "@universal-payment/protocol";
import {
  inferIdentifierType,
  setExternalNamespaceMatcher,
} from "@universal-payment/identifier-types";
import {
  isExternalNamespaceName,
  matchExternalNamespace,
} from "@universal-payment/external-naming/namespaces";
import { classifyPaste, type PasteClassifyResult } from "./paste.js";

setExternalNamespaceMatcher((value) => isExternalNamespaceName(value));

function normalizeNamespace(ns: string): string {
  const trimmed = ns.trim().toLowerCase();
  if (!trimmed) return "";
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

/**
 * Optional client-side resolve filter. Mirrors provider `resolve_policy`
 * so wallets can skip unsupported pastes before calling the API.
 * All fields optional; omit = allow.
 */
export type ResolveFilterOptions = {
  unr?: boolean;
  registry?: boolean;
  allowTypes?: string[];
  denyTypes?: string[];
  allowNamespaces?: string[];
  denyNamespaces?: string[];
  blocklist?: string[];
};

export function resolveFilterFromPolicy(
  policy: ProviderResolvePolicy | null | undefined,
  allowedIdentifierTypes?: string[],
): ResolveFilterOptions {
  return {
    unr: policy?.unr,
    registry: policy?.registry,
    allowTypes: allowedIdentifierTypes?.length
      ? allowedIdentifierTypes
      : undefined,
    denyTypes: policy?.deny_types,
    allowNamespaces: policy?.allow_namespaces,
    denyNamespaces: policy?.deny_namespaces,
    blocklist: policy?.blocklist,
  };
}

export type PasteAcceptResult =
  | { accept: true; classified: PasteClassifyResult }
  | { accept: false; reason: string; classified: PasteClassifyResult };

/**
 * Local pre-filter for Send/paste. Does not call the network.
 * Use before `resolvePaste` when the wallet wants optional module / blocklist control.
 */
export function evaluatePasteFilter(
  raw: string,
  filter?: ResolveFilterOptions,
): PasteAcceptResult {
  const classified = classifyPaste(raw);
  if (classified.action === "empty") {
    return { accept: false, reason: "empty", classified };
  }
  if (classified.action === "native_address") {
    return { accept: false, reason: "native_address", classified };
  }

  const value = classified.value.trim().toLowerCase();
  if (filter?.blocklist?.some((b) => b.trim().toLowerCase() === value)) {
    return { accept: false, reason: "blocklist", classified };
  }

  if (classified.external) {
    if (filter?.unr === false) {
      return { accept: false, reason: "unr_disabled", classified };
    }
    const match = matchExternalNamespace(classified.value);
    const ns = match?.namespace.toLowerCase();
    if (ns && filter?.denyNamespaces?.map(normalizeNamespace).includes(ns)) {
      return { accept: false, reason: "namespace_denied", classified };
    }
    const allowNs = filter?.allowNamespaces?.map(normalizeNamespace).filter(Boolean);
    if (ns && allowNs?.length && !allowNs.includes(ns)) {
      return { accept: false, reason: "namespace_not_allowed", classified };
    }
    return { accept: true, classified };
  }

  if (filter?.registry === false) {
    return { accept: false, reason: "registry_disabled", classified };
  }

  const type =
    classified.suggestedType ??
    inferIdentifierType(classified.value) ??
    "";
  const typeKey = type.toLowerCase();
  if (typeKey && filter?.denyTypes?.some((t) => t.toLowerCase() === typeKey)) {
    return { accept: false, reason: "type_denied", classified };
  }
  if (
    typeKey &&
    filter?.allowTypes?.length &&
    !filter.allowTypes.some((t) => t.toLowerCase() === typeKey)
  ) {
    return { accept: false, reason: "type_not_allowed", classified };
  }

  return { accept: true, classified };
}

export function shouldAcceptPaste(
  raw: string,
  filter?: ResolveFilterOptions,
): boolean {
  return evaluatePasteFilter(raw, filter).accept;
}
