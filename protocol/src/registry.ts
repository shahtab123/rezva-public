import type { MappingStatus, PaymentOption } from "./index.js";

export type ProviderStatus = "PENDING" | "APPROVED" | "SUSPENDED" | "REVOKED";

/**
 * Optional per-provider resolve restrictions.
 * Omit the whole object (or leave fields unset) to keep current open behavior.
 */
export type ProviderResolvePolicy = {
  /**
   * Universal Name Resolution (.eth, .sol, .base, Unstoppable, …).
   * Default true when omitted.
   */
  unr?: boolean;
  /**
   * Rezva registry identifiers (email, QR, phone, namespace names, …).
   * Default true when omitted.
   */
  registry?: boolean;
  /**
   * When UNR is enabled: only these namespaces (e.g. ".eth", ".base").
   * Omit or empty = all external namespaces.
   */
  allow_namespaces?: string[];
  /** When UNR is enabled: block these namespaces. */
  deny_namespaces?: string[];
  /**
   * Extra registry-type denylist on top of `allowed_identifier_types`.
   * Example: ["phone"].
   */
  deny_types?: string[];
  /**
   * Exact identifier values to reject (compared lowercase / trimmed).
   * Applies to both UNR and registry paths.
   */
  blocklist?: string[];
};

export type WalletProviderRecord = {
  provider_id: string;
  name: string;
  website?: string;
  status: ProviderStatus;
  integration_level: "RESOLVER_ONLY" | "RESOLVER_PLUS_MERCHANT_SETUP";
  allowed_identifier_types: string[];
  /** Optional. Missing / empty fields = no extra restrictions. */
  resolve_policy?: ProviderResolvePolicy;
  created_at: string;
  updated_at: string;
};

export const FREE_API_LIMITS = {
  requests_per_minute: 10,
  requests_per_day: 100,
} as const;

export const PROVIDER_API_LIMITS = {
  requests_per_minute: 120,
  requests_per_day: 50_000,
} as const;

export type ProviderWebhookStatus = "ACTIVE" | "DISABLED";

export type ProviderWebhookRecord = {
  id: string;
  provider_id: string;
  url: string;
  secret_prefix: string;
  events: string[];
  status: ProviderWebhookStatus;
  created_at: string;
  updated_at: string;
};

export type DashboardProviderAccountRecord = {
  privy_user_id: string;
  provider_id: string;
  key_prefix: string;
  minute_started_at: string | null;
  minute_count: number;
  day_started_at: string | null;
  day_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

export type ProviderApiUsage = {
  requests_per_minute: number;
  requests_per_day: number;
  minute_count: number;
  day_count: number;
  minute_reset_at: string | null;
  day_reset_at: string | null;
};

export type FreeApiCredentialStatus = "ACTIVE" | "REVOKED";

export type FreeApiCredentialRecord = {
  id: string;
  owner_user_id: string;
  key_prefix: string;
  status: FreeApiCredentialStatus;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  day_started_at: string | null;
  day_count: number;
  minute_started_at: string | null;
  minute_count: number;
};

export type FreeApiUsage = {
  requests_per_minute: number;
  requests_per_day: number;
  minute_count: number;
  day_count: number;
  minute_reset_at: string | null;
  day_reset_at: string | null;
};

export type SharedTestMerchantRecord = {
  identifier_id: string;
  identifier_value: string;
  controller_id: string;
  wallet_address: string;
  network: "base-sepolia";
  asset: "USDC";
  token_contract: string;
  network_identifier: "eip155:84532";
};

export type TestPaymentStatus = "DETECTED" | "CONFIRMED" | "REJECTED";

export type TestPaymentRecord = {
  id: string;
  merchant_identifier_id: string;
  transaction_hash: string;
  network: string;
  asset: string;
  amount: string;
  amount_raw: string;
  sender: string;
  recipient: string;
  timestamp: string;
  confirmation_status: TestPaymentStatus;
  testnet: boolean;
  block_number: number | null;
  detected_at: string;
};

export type NativeNameStatus = "active" | "pending_review" | "removed";

export type NativeNameReviewTier = "standard" | "protected";

export type NativeNameProofStatus =
  | "not_required"
  | "requested"
  | "received"
  | "accepted"
  | "rejected";

export type NativeNameRecord = {
  id: string;
  name: string;
  controller_id: string;
  status: NativeNameStatus;
  /** standard = normal activation; protected = dictionary match / elevated review */
  review_tier: NativeNameReviewTier;
  /** Exact dictionary label that triggered elevated review, if any */
  dictionary_match: string | null;
  proof_status: NativeNameProofStatus;
  review_notes: string | null;
  created_at: string;
  updated_at: string;
};

export type NameAvailabilityResponse = {
  available: boolean;
  name: string;
  /** Hard-reserved system names - never registerable */
  reserved?: boolean;
  /** Matches protected dictionary - registerable with elevated review */
  review_required?: boolean;
  review_tier?: NativeNameReviewTier;
  review_hint?: string;
};

export type IdentifierRecord = {
  id: string;
  type: string;
  normalized_value: string;
  display_value: string;
  controller_id: string;
  name_id: string | null;
  status: MappingStatus;
  registered_at: string;
  activated_at: string | null;
  last_updated: string;
  last_payment_update: string | null;
  removed_at: string | null;
  available_at: string | null;
  pending_activation_at: string | null;
  pending_destination_json: string | null;
};

export type PaymentDestinationInput = Omit<PaymentOption, "payment_ready">;

export type RegisterIdentifierRequest = {
  type: string;
  value: string;
  name_id?: string;
  payment_options: PaymentDestinationInput[];
};

export type CreateNameRequest = {
  name: string;
};

export type IdentifierAvailabilityResponse = {
  available: boolean;
  type: string;
  value?: string;
  status?: MappingStatus;
  reason?: string;
  removal_kind?: "permanent" | "cooldown";
};

export type IdentifierResponse = {
  id: string;
  type: string;
  value: string;
  status: MappingStatus;
  controller: string;
  name_id?: string | null;
  registered_at: string;
  activated_at: string | null;
  last_updated: string;
  last_payment_update: string | null;
  available_at?: string | null;
  pending_activation_at?: string | null;
  payment_options?: PaymentDestinationInput[];
};

export type UpdateIdentifierRequest = {
  name_id?: string;
  payment_options?: PaymentDestinationInput[];
};

export type RemoveIdentifierResponse = {
  id: string;
  status: "removed";
  available_at: string;
};

export type RegistryEventType =
  | "registered"
  | "activated"
  | "metadata_updated"
  | "payment_destination_changed"
  | "complaint_submitted"
  | "suspended"
  | "reinstated"
  | "removed"
  | "revoked"
  | "reclaimed";

export type RegistryEventRecord = {
  id: string;
  event_type: RegistryEventType;
  identifier_id: string | null;
  name_id: string | null;
  timestamp: string;
  authorization_reference: string | null;
  metadata_json: string | null;
};

export type ComplaintStatus =
  | "SUBMITTED"
  | "UNDER_REVIEW"
  | "RESOLVED"
  | "REJECTED";

export type SubmitComplaintRequest = {
  identifier_id?: string;
  target_type?: string;
  target_value?: string;
  reporter_user_id?: string;
  reason: string;
  description: string;
  evidence?: string[];
};

export type ComplaintRecord = {
  id: string;
  identifier_id: string;
  reporter_user_id?: string | null;
  reason: string;
  description: string;
  evidence_json: string | null;
  status: ComplaintStatus;
  resolution_action?: RegistryAction | null;
  resolution_notes?: string | null;
  filing_provider_id?: string | null;
  created_at: string;
  updated_at: string;
};

export type RegistryAction =
  | "NO_ACTION"
  | "WARNING"
  | "SUSPEND"
  | "REVOKE"
  | "RECLAIM";

export type ResolveComplaintRequest = {
  action: RegistryAction;
  notes?: string;
  new_controller_wallet?: string;
};

export type CreateProviderRequest = {
  provider_id: string;
  name: string;
  website?: string;
  integration_level: WalletProviderRecord["integration_level"];
  allowed_identifier_types?: string[];
  resolve_policy?: ProviderResolvePolicy;
  api_key: string;
};

export type UpdateProviderRequest = {
  name?: string;
  website?: string;
  status?: ProviderStatus;
  integration_level?: WalletProviderRecord["integration_level"];
  allowed_identifier_types?: string[];
  resolve_policy?: ProviderResolvePolicy | null;
  api_key?: string;
};
