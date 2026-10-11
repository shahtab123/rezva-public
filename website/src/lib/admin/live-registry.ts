import {
  DEMO_IDENTIFIERS,
  DEMO_COMPLAINTS,
  withDemoRegistryStatus,
  type DemoIdentifier,
} from "@/lib/admin/demo-registry";
import { fetchOperatorComplaints, fetchOperatorIdentifiers, fetchOperatorNames, fetchOperatorNamespaces, fetchOperatorProviders } from "@/lib/admin/operator-client";
import { getRegistryDemoOverrides } from "@/lib/admin/store";

export async function getAdminIdentifierRows(): Promise<{
  rows: DemoIdentifier[];
  live: boolean;
}> {
  try {
    const live = await fetchOperatorIdentifiers();
    if (live === null) {
      return { rows: DEMO_IDENTIFIERS, live: false };
    }
    return {
      live: true,
      rows: live.map((row) => ({
        id: String(row.id),
        display: `${String(row.type)}:${String(row.display_value ?? row.normalized_value)}`,
        type: String(row.type),
        normalized: String(row.normalized_value),
        status: String(row.status),
        controller: String(row.controller_wallet ?? "-"),
        destinations: Number(row.destination_count ?? 0),
        updatedAt: String(row.last_updated ?? new Date().toISOString()),
      })),
    };
  } catch {
    return { rows: DEMO_IDENTIFIERS, live: false };
  }
}

export async function getAdminComplaintRows(): Promise<{
  rows: Array<{
    id: string;
    subject: string;
    target: string;
    status: "submitted" | "under_review" | "resolved" | "rejected";
    submittedAt: string;
    summary: string;
  }>;
  live: boolean;
}> {
  try {
    const live = await fetchOperatorComplaints();
    if (live === null) {
      return { rows: [], live: false };
    }
    return {
      live: true,
      rows: live.map((row) => ({
        id: String(row.id),
        subject: String(row.reason ?? "Complaint"),
        target: String(row.identifier_id ?? "-"),
        status: mapComplaintStatus(String(row.status)),
        submittedAt: String(row.created_at ?? new Date().toISOString()),
        summary: String(row.description ?? ""),
      })),
    };
  } catch {
    return { rows: [], live: false };
  }
}

function mapComplaintStatus(status: string): "submitted" | "under_review" | "resolved" | "rejected" {
  const value = status.toLowerCase();
  if (value === "resolved") return "resolved";
  if (value === "rejected") return "rejected";
  if (value.includes("review")) return "under_review";
  return "submitted";
}

export async function getAdminComplaintPanelRows(): Promise<{
  rows: Array<{
    id: string;
    subject: string;
    target: string;
    status: "submitted" | "under_review" | "resolved" | "rejected";
    submittedAt: string;
    summary: string;
  }>;
  live: boolean;
}> {
  const overrides = getRegistryDemoOverrides();
  const { rows: liveRows, live } = await getAdminComplaintRows();
  const source = live ? liveRows : DEMO_COMPLAINTS;
  const rows = source.map((row) => {
    const override = overrides[row.id];
    if (!override) return row;
    return {
      ...row,
      status: override.status as typeof row.status,
    };
  });
  return { live, rows };
}

export async function getAdminNameRows(): Promise<{
  rows: import("@/lib/admin/demo-registry").DemoNativeName[];
  live: boolean;
}> {
  try {
    const live = await fetchOperatorNames();
    if (live === null) {
      const { DEMO_NAMES } = await import("@/lib/admin/demo-registry");
      return { rows: DEMO_NAMES, live: false };
    }
    return {
      live: true,
      rows: live.map((row) => ({
        id: String(row.id),
        name: String(row.name),
        status: String(row.status),
        controller: String(row.controller_wallet ?? "-"),
        reviewTier: row.review_tier ? String(row.review_tier) : undefined,
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
      })),
    };
  } catch {
    const { DEMO_NAMES } = await import("@/lib/admin/demo-registry");
    return { rows: DEMO_NAMES, live: false };
  }
}

export async function getAdminProviderRows(): Promise<{
  rows: import("@/lib/admin/demo-registry").DemoProvider[];
  live: boolean;
}> {
  try {
    const live = await fetchOperatorProviders();
    if (live === null) {
      const { DEMO_PROVIDERS } = await import("@/lib/admin/demo-registry");
      return { rows: DEMO_PROVIDERS, live: false };
    }
    return {
      live: true,
      rows: live.map((row) => ({
        id: String(row.provider_id ?? row.id),
        name: String(row.name),
        status: String(row.status ?? "approved").toLowerCase() as "pending" | "approved" | "suspended" | "revoked",
        productionAccess: String(row.status).toUpperCase() === "APPROVED",
        apiCalls30d: "-",
        website: String(row.website ?? ""),
        updatedAt: String(row.updated_at ?? new Date().toISOString()),
      })),
    };
  } catch {
    const { DEMO_PROVIDERS } = await import("@/lib/admin/demo-registry");
    return { rows: DEMO_PROVIDERS, live: false };
  }
}

const SUSPENDED_IDENTIFIER_STATUSES = new Set(["suspended", "removed", "revoked"]);
const SUSPENDED_NAME_STATUSES = new Set(["suspended", "removed", "revoked", "reserved"]);

export async function getAdminSuspendedRegistryRows(): Promise<{
  identifiers: DemoIdentifier[];
  names: import("@/lib/admin/demo-registry").DemoNativeName[];
  live: boolean;
}> {
  const [{ rows: identifierRows, live: identifiersLive }, { rows: nameRows, live: namesLive }] =
    await Promise.all([getAdminIdentifierRows(), getAdminNameRows()]);
  const overrides = getRegistryDemoOverrides();
  const live = identifiersLive && namesLive;
  const identifiers = withDemoRegistryStatus(identifierRows, overrides).filter((item) =>
    SUSPENDED_IDENTIFIER_STATUSES.has(item.status.toLowerCase()),
  );
  const names = withDemoRegistryStatus(nameRows, overrides).filter((item) =>
    SUSPENDED_NAME_STATUSES.has(item.status.toLowerCase()),
  );
  return { identifiers, names, live };
}

export type AdminNamespaceRow = {
  slug: string;
  providerId: string;
  status: string;
  description: string;
  registrationPolicy: string;
  createdAt: string;
  updatedAt: string;
  usage: {
    totalNames: number;
    activeNames: number;
    registrationsThisMonth: number;
    removalsThisMonth: number;
  };
};

export async function getAdminNamespaceRows(): Promise<{
  rows: AdminNamespaceRow[];
  live: boolean;
}> {
  try {
    const live = await fetchOperatorNamespaces();
    if (live === null) {
      return { rows: [], live: false };
    }
    return {
      live: true,
      rows: live.map((row) => {
        const usage = (row.usage as Record<string, unknown> | undefined) ?? {};
        return {
          slug: String(row.slug ?? ""),
          providerId: String(row.provider_id ?? "-"),
          status: String(row.status ?? "submitted"),
          description: String(row.description ?? ""),
          registrationPolicy: String(row.registration_policy ?? "provider_managed_pricing"),
          createdAt: String(row.created_at ?? ""),
          updatedAt: String(row.updated_at ?? ""),
          usage: {
            totalNames: Number(usage.total_names ?? 0),
            activeNames: Number(usage.active_names ?? 0),
            registrationsThisMonth: Number(usage.registrations_this_month ?? 0),
            removalsThisMonth: Number(usage.removals_this_month ?? 0),
          },
        };
      }),
    };
  } catch {
    return { rows: [], live: false };
  }
}
