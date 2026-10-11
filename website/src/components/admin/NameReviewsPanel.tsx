import Link from "next/link";
import { Eye } from "lucide-react";
import { listDictionaryRequests } from "@/lib/admin/store";
import { AdminFilterTabs, AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";
import { AdminUserDashboardHint } from "@/components/admin/AdminUserDashboardHint";
import type { DictionaryRequest } from "@/lib/admin/types";

export const NAME_REVIEW_TABS = [
  { id: "pending", label: "Pending", href: "/admin/registry/name-reviews?status=pending" },
  { id: "verified", label: "Verified", href: "/admin/registry/name-reviews?status=verified" },
  { id: "rejected", label: "Rejected", href: "/admin/registry/name-reviews?status=rejected" },
] as const;

export type NameReviewTabId = (typeof NAME_REVIEW_TABS)[number]["id"];

const TAB_COPY: Record<
  NameReviewTabId,
  { title: string; description: string; status: DictionaryRequest["status"] | "pending" }
> = {
  pending: {
    title: "Protected name queue",
    description:
      "When a business claims a protected dictionary name (e.g. a brand) on Profile / Name, it lands here as pending_review until you approve or reject.",
    status: "pending",
  },
  verified: {
    title: "Protected name queue",
    description: "Protected name claims you approved - the business name can go active.",
    status: "verified",
  },
  rejected: {
    title: "Protected name queue",
    description: "Protected name claims you denied or reserved - matches rejected claims on the user side.",
    status: "rejected",
  },
};

export function NameReviewsTable({ items }: { items: DictionaryRequest[] }) {
  if (items.length === 0) {
    return <div className="admin-empty">No name review requests in this view.</div>;
  }
  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-table-compact">
        <thead>
          <tr>
            <th>Name</th>
            <th>Applicant</th>
            <th>Status</th>
            <th className="admin-col-actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td>
                <span className="admin-code">{item.name}</span>
              </td>
              <td>
                <strong>{item.applicantLabel}</strong>
                <div className="admin-cell-sub">{item.purpose}</div>
              </td>
              <td>
                <AdminStatus tone={statusTone(item.status)}>
                  {item.status.replaceAll("_", " ")}
                </AdminStatus>
              </td>
              <td>
                <Link
                  className="admin-icon-btn"
                  href={`/admin/registry/name-reviews/${item.id}`}
                  title="Review name"
                  aria-label="Review name"
                >
                  <Eye className="admin-icon-btn-svg" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

export function NameReviewsPage({ tab }: { tab: NameReviewTabId }) {
  const copy = TAB_COPY[tab];
  const items = listDictionaryRequests({ status: copy.status });

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry"
        title={copy.title}
        description={copy.description}
      />
      <AdminUserDashboardHint
        dashboardHref="/dashboard/business/profile"
        dashboardLabel="Profile / Name (elevated review)"
      />
      <AdminFilterTabs tabs={[...NAME_REVIEW_TABS]} active={tab} />
      <NameReviewsTable items={items} />
    </div>
  );
}

/** @deprecated Use NameReviewsPage - kept for legacy route redirects */
export function NameReviewsFilteredPage({
  title,
  description,
  status,
}: {
  title: string;
  description: string;
  status: DictionaryRequest["status"] | "pending";
}) {
  const items = listDictionaryRequests({ status });
  return (
    <div>
      <AdminPageHeader eyebrow="Registry" title={title} description={description} />
      <NameReviewsTable items={items} />
    </div>
  );
}
