export type ProviderAccount = {
  privy_user_id: string;
  provider_id: string;
  key_prefix: string;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
  limits: { requests_per_minute: number; requests_per_day: number };
};

export type ProviderProfile = {
  provider_id: string;
  name: string;
  website: string | null;
  status: "PENDING" | "APPROVED" | "SUSPENDED" | "REVOKED";
  integration_level: "RESOLVER_ONLY" | "RESOLVER_PLUS_MERCHANT_SETUP";
  allowed_identifier_types: string[];
  resolve_policy?: {
    unr?: boolean;
    registry?: boolean;
    allow_namespaces?: string[];
    deny_namespaces?: string[];
    deny_types?: string[];
    blocklist?: string[];
  };
  created_at: string;
  updated_at: string;
};

export type ProviderUsage = {
  requests_per_minute: number;
  requests_per_day: number;
  minute_count: number;
  day_count: number;
  minute_reset_at: string | null;
  day_reset_at: string | null;
};

export type ProviderWebhook = {
  id: string;
  provider_id: string;
  url: string;
  secret_prefix: string;
  events: string[];
  status: "ACTIVE" | "DISABLED";
  created_at: string;
  updated_at: string;
};

export const PROVIDER_WEBHOOK_EVENTS = [
  "identifier.registered",
  "identifier.updated",
  "identifier.removed",
  "complaint.filed",
  "complaint.resolved",
  "namespace.name_registered",
] as const;

export type ProviderAccountState = {
  account: ProviderAccount | null;
  provider: ProviderProfile | null;
  needsProvision: boolean;
  usage: ProviderUsage | null;
  webhooks: ProviderWebhook[];
  availableWebhookEvents: string[];
};

export const emptyProviderAccountState: ProviderAccountState = {
  account: null,
  provider: null,
  needsProvision: true,
  usage: null,
  webhooks: [],
  availableWebhookEvents: [...PROVIDER_WEBHOOK_EVENTS],
};
