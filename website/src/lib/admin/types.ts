/**
 * Admin account model - designed for a future SQL database.
 * Local persistence mirrors these shapes in website/.data/admin-store.json.
 */

export type AdminAccountType =
  | "super_admin"
  | "operator"
  | "reviewer"
  | "read_only";

export type AdminPermission =
  | "applications:read"
  | "applications:review"
  | "registry:read"
  | "registry:write"
  | "dictionary:read"
  | "dictionary:review"
  | "complaints:read"
  | "complaints:resolve"
  | "providers:read"
  | "providers:manage"
  | "namespaces:read"
  | "namespaces:manage"
  | "system:read"
  | "system:write"
  | "audit:read"
  | "admin_users:manage";

export const ALL_ADMIN_PERMISSIONS: AdminPermission[] = [
  "applications:read",
  "applications:review",
  "registry:read",
  "registry:write",
  "dictionary:read",
  "dictionary:review",
  "complaints:read",
  "complaints:resolve",
  "providers:read",
  "providers:manage",
  "namespaces:read",
  "namespaces:manage",
  "system:read",
  "system:write",
  "audit:read",
  "admin_users:manage",
];

export const PERMISSIONS_BY_ACCOUNT_TYPE: Record<
  AdminAccountType,
  AdminPermission[]
> = {
  super_admin: [...ALL_ADMIN_PERMISSIONS],
  operator: ALL_ADMIN_PERMISSIONS.filter((p) => p !== "admin_users:manage"),
  reviewer: [
    "applications:read",
    "applications:review",
    "dictionary:read",
    "dictionary:review",
    "complaints:read",
    "complaints:resolve",
    "registry:read",
    "namespaces:read",
    "providers:read",
    "audit:read",
    "system:read",
  ],
  read_only: [
    "applications:read",
    "dictionary:read",
    "complaints:read",
    "registry:read",
    "namespaces:read",
    "providers:read",
    "audit:read",
    "system:read",
  ],
};

export type AdminUser = {
  id: string;
  username: string;
  passwordHash: string;
  accountType: AdminAccountType;
  /** Explicit grants; empty means fall back to accountType defaults */
  permissions: AdminPermission[];
  displayName: string;
  status: "active" | "suspended";
  createdAt: string;
  updatedAt: string;
  lastLoginAt?: string;
};

export type AdminAuditAction =
  | "admin.login"
  | "admin.logout"
  | "application.approve"
  | "application.reject"
  | "application.request_documents"
  | "application.suspend"
  | "application.reactivate"
  | "dictionary.approve"
  | "dictionary.reject"
  | "dictionary.request_documents"
  | "dictionary.reserve"
  | "dictionary.mark_protected"
  | "dictionary.entry_add"
  | "dictionary.entry_remove"
  | "name.reserve"
  | "name.release"
  | "name.suspend"
  | "name.reactivate"
  | "name.revoke"
  | "namespace.approve"
  | "namespace.reject"
  | "namespace.suspend"
  | "identifier.suspend"
  | "identifier.reactivate"
  | "identifier.revoke"
  | "identifier.reclaim"
  | "complaint.resolve"
  | "complaint.request_evidence"
  | "provider.approve"
  | "provider.suspend"
  | "provider.reactivate"
  | "provider.revoke_access"
  | "system.update_settings";

export type AdminAuditEntry = {
  id: string;
  at: string;
  adminId: string;
  adminUsername: string;
  action: AdminAuditAction;
  resourceType: string;
  resourceId: string;
  previousState?: string | null;
  newState?: string | null;
  reason?: string | null;
  message?: string | null;
  authorizationReference?: string | null;
};

export type AdminApplicationKind = "business" | "provider" | "namespace";

export type AdminApplicationStatus =
  | "not_submitted"
  | "submitted"
  | "under_review"
  | "additional_info_requested"
  | "approved"
  | "rejected"
  | "suspended";

export type AdminApplication = {
  id: string;
  kind: AdminApplicationKind;
  status: AdminApplicationStatus;
  displayName: string;
  contactEmail?: string;
  website?: string;
  country?: string;
  summary?: string;
  payload: Record<string, string>;
  submittedAt?: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  documentRequest?: {
    required: string;
    reason: string;
    message: string;
    requestedAt: string;
    requestedBy: string;
  };
  documentResponse?: {
    message: string;
    note?: string;
    submittedAt: string;
  };
  namespaceSlug?: string;
};

export type DictionaryRequestStatus =
  | "pending_review"
  | "additional_info_requested"
  | "verified"
  | "rejected";

export type DictionaryRequest = {
  id: string;
  name: string;
  applicantLabel: string;
  applicantKind: "business" | "merchant" | "individual" | "other";
  purpose: string;
  status: DictionaryRequestStatus;
  submittedAt: string;
  evidenceNotes?: string;
  relatedIdentifiers?: string[];
  applicationId?: string;
  documentRequest?: AdminApplication["documentRequest"];
  decision?: {
    by: string;
    at: string;
    note?: string;
  };
  history: Array<{
    at: string;
    by: string;
    action: string;
    note?: string;
  }>;
};

export type AdminSystemSettings = {
  registrationSafetySeconds: number;
  updateSafetySeconds: number;
  removalCooldownSeconds: number;
  resolveRateLimitPerMinute: number;
  registerRateLimitPerMinute: number;
};

export type AdminStoreData = {
  users: AdminUser[];
  audit: AdminAuditEntry[];
  applications: AdminApplication[];
  dictionaryRequests: DictionaryRequest[];
  /** Soft protected names managed by admins (add/remove). Hard reserved stay separate. */
  dictionaryEntries: string[];
  /** Demo registry row status overrides until operator API is wired live */
  registryDemoOverrides?: Record<string, { status: string; updatedAt: string }>;
  settings: AdminSystemSettings;
};

export function effectivePermissions(user: AdminUser): AdminPermission[] {
  if (user.permissions.length > 0) {
    return user.permissions;
  }
  return PERMISSIONS_BY_ACCOUNT_TYPE[user.accountType];
}

export function hasPermission(
  user: Pick<AdminUser, "accountType" | "permissions" | "status">,
  permission: AdminPermission,
): boolean {
  if (user.status !== "active") return false;
  const grants =
    user.permissions.length > 0
      ? user.permissions
      : PERMISSIONS_BY_ACCOUNT_TYPE[user.accountType];
  return grants.includes(permission);
}
