export type IntegrationLevel = "RESOLVER_ONLY" | "RESOLVER_PLUS_MERCHANT_SETUP";

export type MappingStatus =
  | "pending"
  | "active"
  | "update_pending"
  | "suspended"
  | "removed"
  | "revoked";

export type TrustMetadata = {
  warnings?: string[];
  /**
   * Present when the destination was resolved via an external naming system
   * (ENS, SNS, Base Names, Unstoppable, …). Rezva does not own these names.
   */
  external_resolver?: {
    provider: string;
    namespace: string;
  };
};

export type PaymentOption = {
  chain: string;
  asset: string;
  address: string;
  token_contract?: string;
  network_identifier?: string;
  memo?: string;
  payment_reference?: string;
  minimum_amount?: string;
  maximum_amount?: string;
  fixed_amount?: string;
  expiration?: string;
  payment_ready: boolean;
};

export type ResolveRequest = {
  /** Optional when the value is a full EMV/Bangla QR payload (auto-detected as bangla_qr). */
  type?: string;
  value: string;
};

export type ResolveResponse = {
  protocol_version: string;
  status: MappingStatus;
  payment_ready: boolean;
  identifier: {
    type: string;
    value: string;
    normalized_value?: string;
  };
  profile?: {
    name?: string;
  };
  registration: {
    registered_at: string | null;
    activated_at: string | null;
    last_updated: string | null;
    last_payment_update: string | null;
  };
  payment_options: PaymentOption[];
  pending_destination?: Omit<PaymentOption, "payment_ready">;
  available_at?: string | null;
  removal_kind?: "controller_removed" | "revoked";
  trust?: TrustMetadata;
};

export * from "./errors.js";
export * from "./registry.js";
