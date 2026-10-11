import {
  getAdminComplaintPanelRows,
  getAdminIdentifierRows,
  getAdminNameRows,
  getAdminNamespaceRows,
  getAdminProviderRows,
} from "@/lib/admin/live-registry";
import { listApplications, listDictionaryRequests } from "@/lib/admin/store";

export type AdminSearchHit = {
  kind: string;
  id: string;
  label: string;
  sublabel?: string;
  href: string;
};

function matches(query: string, ...parts: (string | undefined)[]): boolean {
  const haystack = parts.filter(Boolean).join(" ").toLowerCase();
  return haystack.includes(query);
}

export async function adminGlobalSearch(query: string, limit = 24): Promise<AdminSearchHit[]> {
  const q = query.trim().toLowerCase();
  if (q.length < 2) return [];

  const hits: AdminSearchHit[] = [];

  for (const app of await listApplications()) {
    if (
      matches(q, app.id, app.displayName, app.contactEmail, app.summary, app.kind, app.status)
    ) {
      hits.push({
        kind: "Application",
        id: app.id,
        label: app.displayName,
        sublabel: `${app.kind} · ${app.status.replaceAll("_", " ")}`,
        href: `/admin/applications/${app.id}`,
      });
    }
  }

  for (const item of listDictionaryRequests()) {
    if (matches(q, item.id, item.name, item.applicantLabel, item.purpose, item.status)) {
      hits.push({
        kind: "Protected name",
        id: item.id,
        label: item.name,
        sublabel: `${item.applicantLabel} · ${item.status.replaceAll("_", " ")}`,
        href: `/admin/registry/name-reviews/${item.id}`,
      });
    }
  }

  const { rows: identifiers } = await getAdminIdentifierRows();
  for (const row of identifiers) {
    if (matches(q, row.id, row.display, row.type, row.normalized, row.controller, row.status)) {
      hits.push({
        kind: "Identifier",
        id: row.id,
        label: row.display,
        sublabel: row.status,
        href: `/admin/registry/identifiers?q=${encodeURIComponent(row.display)}`,
      });
    }
  }

  const { rows: names } = await getAdminNameRows();
  for (const row of names) {
    if (matches(q, row.id, row.name, row.controller, row.status)) {
      hits.push({
        kind: "Profile / Name",
        id: row.id,
        label: row.name,
        sublabel: row.status,
        href: `/admin/registry/names?q=${encodeURIComponent(row.name)}`,
      });
    }
  }

  const { rows: complaints } = await getAdminComplaintPanelRows();
  for (const row of complaints) {
    if (matches(q, row.id, row.subject, row.target, row.summary, row.status)) {
      hits.push({
        kind: "Complaint",
        id: row.id,
        label: row.subject,
        sublabel: `${row.target} · ${row.status.replaceAll("_", " ")}`,
        href:
          row.status === "resolved" || row.status === "rejected"
            ? "/admin/complaints/resolved"
            : row.status === "under_review"
              ? "/admin/complaints/under-review"
              : "/admin/complaints/new",
      });
    }
  }

  const { rows: providers } = await getAdminProviderRows();
  for (const row of providers) {
    if (matches(q, row.id, row.name, row.website, row.status)) {
      hits.push({
        kind: "Provider",
        id: row.id,
        label: row.name,
        sublabel: row.status,
        href: `/admin/providers?q=${encodeURIComponent(row.name)}`,
      });
    }
  }

  const { rows: namespaces } = await getAdminNamespaceRows();
  for (const row of namespaces) {
    if (matches(q, row.slug, row.providerId, row.status, row.description)) {
      hits.push({
        kind: "Namespace",
        id: row.slug,
        label: `.${row.slug}`,
        sublabel: `${row.providerId} · ${row.status.replaceAll("_", " ")}`,
        href: "/admin/registry/namespaces",
      });
    }
  }

  return hits.slice(0, limit);
}
