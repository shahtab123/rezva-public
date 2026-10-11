import type { PaymentOption, ResolveResponse } from "@universal-payment/protocol";
import type { ExternalNamespaceMatch } from "./namespaces.js";

export type ResolveOptions = {
  /** Preferred payment chain (e.g. "ethereum", "base", "solana"). */
  preferredChain?: string;
  /** Preferred asset symbol (e.g. "ETH", "USDC", "SOL"). */
  preferredAsset?: string;
  /** Optional AbortSignal for RPC/API calls. */
  signal?: AbortSignal;
};

export type ExternalResolveSuccess = {
  ok: true;
  match: ExternalNamespaceMatch;
  /** Normalized name used for resolution (usually match.name). */
  normalizedName: string;
  paymentOptions: PaymentOption[];
  /** Optional human profile label (usually the external name). */
  profileName?: string;
};

export type ExternalResolveFailureCode =
  | "UNSUPPORTED_NAMESPACE"
  | "NAME_NOT_FOUND"
  | "NO_PAYMENT_ADDRESS"
  | "INVALID_DESTINATION"
  | "RESOLVER_ERROR";

export type ExternalResolveFailure = {
  ok: false;
  code: ExternalResolveFailureCode;
  message: string;
  match?: ExternalNamespaceMatch;
};

export type ExternalResolveResult = ExternalResolveSuccess | ExternalResolveFailure;

/**
 * Generic resolver for one external naming system.
 * Implementations must query the authoritative source — never a Rezva ownership table.
 */
export interface NameResolver {
  readonly provider: string;
  canResolve(identifier: string): boolean;
  resolve(
    identifier: string,
    options?: ResolveOptions,
  ): Promise<ExternalResolveResult>;
}

export type ExternalNamingEnv = {
  ETHEREUM_RPC_URL?: string;
  BASE_RPC_URL?: string;
  POLYGON_RPC_URL?: string;
  SOLANA_RPC_URL?: string;
  UNSTOPPABLE_API_KEY?: string;
  UNSTOPPABLE_API_BASE?: string;
  /** Optional override for SNS HTTP resolve (tests / alternate backends). */
  SNS_RESOLVE_URL?: string;
};

export type BuildResolveResponseInput = ExternalResolveSuccess;

/** Map a successful external resolve into the existing Rezva ResolveResponse shape.
 * Additive only: wallets that already handle payment_ready + payment_options
 * need no client change. trust.external_resolver is optional metadata.
 */
export function toResolveResponse(
  input: BuildResolveResponseInput,
  originalValue: string,
): ResolveResponse {
  const paymentReady = input.paymentOptions.some((o) => o.payment_ready);
  return {
    protocol_version: "1",
    status: paymentReady ? "active" : "pending",
    payment_ready: paymentReady,
    identifier: {
      type: "external_name",
      value: originalValue,
      normalized_value: input.normalizedName,
    },
    profile: input.profileName ? { name: input.profileName } : { name: input.normalizedName },
    registration: {
      registered_at: null,
      activated_at: null,
      last_updated: null,
      last_payment_update: null,
    },
    payment_options: input.paymentOptions,
    trust: {
      external_resolver: {
        provider: input.match.provider,
        namespace: input.match.namespace,
      },
    },
  };
}
