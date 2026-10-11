/**
 * Provider Namespaces - registry-owned data model.
 *
 * We store namespace + name registration metadata and aggregate usage only.
 * Provider customer accounts, billing, CRM, and purchase history live in the
 * provider's own infrastructure and MUST NOT be stored here.
 */

export type NamespaceStatus =
  | "not_applied"
  | "submitted"
  | "under_review"
  | "active"
  | "suspended"
  | "rejected";

export type NamespaceRegistrationPolicy =
  | "free"
  | "provider_managed_pricing"
  | "invite_only";

export type NamespaceNameStatus =
  | "active"
  | "reserved"
  | "suspended"
  | "removed";

export type NamespaceRegistryEventType =
  | "namespace_submitted"
  | "namespace_approved"
  | "namespace_rejected"
  | "namespace_suspended"
  | "name_registered"
  | "name_updated"
  | "name_reserved"
  | "name_suspended"
  | "name_removed";

/** Aggregate metrics only - never per-customer billing */
export type NamespaceUsageMetrics = {
  totalNames: number;
  activeNames: number;
  registrationsThisMonth: number;
  removalsThisMonth: number;
  resolutionRequestsThisMonth: number;
};

export type ProviderNamespace = {
  /** Label without leading dot, e.g. "redotpay" → public form ".redotpay" */
  slug: string;
  status: NamespaceStatus;
  description?: string;
  registrationPolicy: NamespaceRegistrationPolicy;
  reservedNames: string[];
  submittedAt?: string;
  reviewedAt?: string;
  activatedAt?: string;
  rejectionReason?: string;
  /** Application payload from dashboard apply form */
  payload?: Record<string, string>;
  usage: NamespaceUsageMetrics;
};

export type NamespaceNameRecord = {
  /** Local label without namespace, e.g. "shahtab" */
  label: string;
  /** Full resolvable name, e.g. "shahtab.redotpay" */
  fullName: string;
  namespace: string;
  status: NamespaceNameStatus;
  /** Opaque controller/authorization reference - not a user profile */
  controllerRef?: string;
  /** Destination shown per protocol privacy rules (may be truncated) */
  destinationPreview?: string;
  registeredAt?: string;
  activatedAt?: string;
  lastUpdated?: string;
  lastPaymentUpdate?: string;
};

export type NamespaceRegistryEvent = {
  id: string;
  at: string;
  type: NamespaceRegistryEventType;
  namespace: string;
  /** Optional name label when event is name-scoped */
  name?: string;
  summary: string;
};

export type ProviderNamespaceState = {
  namespaces: ProviderNamespace[];
  names: NamespaceNameRecord[];
  events: NamespaceRegistryEvent[];
};

export const emptyNamespaceUsage: NamespaceUsageMetrics = {
  totalNames: 0,
  activeNames: 0,
  registrationsThisMonth: 0,
  removalsThisMonth: 0,
  resolutionRequestsThisMonth: 0,
};

export const emptyNamespaceState: ProviderNamespaceState = {
  namespaces: [],
  names: [],
  events: [],
};

export const namespaceStatusLabels: Record<NamespaceStatus, string> = {
  not_applied: "Not applied",
  submitted: "Submitted",
  under_review: "Under review",
  active: "Active",
  suspended: "Suspended",
  rejected: "Rejected",
};

export const nameStatusLabels: Record<NamespaceNameStatus, string> = {
  active: "Active",
  reserved: "Reserved",
  suspended: "Suspended",
  removed: "Removed",
};

export const registrationPolicyLabels: Record<
  NamespaceRegistrationPolicy,
  string
> = {
  free: "Free",
  provider_managed_pricing: "Provider-managed pricing",
  invite_only: "Invite-only",
};

export function formatNamespaceDot(slug: string): string {
  const clean = slug.replace(/^\./, "").toLowerCase();
  return `.${clean}`;
}

export function normalizeNamespaceSlug(input: string): string {
  return input
    .trim()
    .replace(/^\./, "")
    .toLowerCase()
    .replace(/[^a-z0-9-]/g, "");
}

export function isNamespacePending(status: NamespaceStatus): boolean {
  return status === "submitted" || status === "under_review";
}

export function isNamespaceActive(status: NamespaceStatus): boolean {
  return status === "active";
}

export function canApplyForNamespace(state: ProviderNamespaceState): boolean {
  if (state.namespaces.length === 0) return true;
  return state.namespaces.every(
    (ns) => ns.status === "rejected" || ns.status === "suspended",
  );
}

/**
 * Backend-ready API surface the provider app will call.
 * Documented for integrators; dashboard UI is the operator console view.
 */
export const PROVIDER_NAMESPACE_API = {
  checkAvailability: "GET /v1/namespaces/{namespace}/names/{label}/availability",
  registerName: "POST /v1/namespaces/{namespace}/names",
  updateName: "PATCH /v1/namespaces/{namespace}/names/{label}",
  removeName: "DELETE /v1/namespaces/{namespace}/names/{label}",
  resolveName: "GET /v1/resolve?type=provider_name&value={label}.{namespace}",
  usage: "GET /v1/namespaces/{namespace}/usage",
  webhooks: "Existing provider webhook delivery for name_* events",
} as const;
