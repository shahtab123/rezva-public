import { listApplications } from "@/lib/admin/store";
import { getOperatorClientConfig } from "@/lib/admin/operator-client";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { AdminDataSourceNotice, AdminPageHeader } from "@/components/admin/ui";
import type { AdminApplication } from "@/lib/admin/types";

export async function ApplicationsFilteredPage({
  eyebrow = "Applications",
  title,
  description,
  kind,
  status,
}: {
  eyebrow?: string;
  title: string;
  description: string;
  kind?: AdminApplication["kind"];
  status?: AdminApplication["status"] | "pending";
}) {
  const items = await listApplications({ kind, status });
  const live = Boolean(getOperatorClientConfig());

  return (
    <div>
      <AdminPageHeader eyebrow={eyebrow} title={title} description={description} />
      <AdminDataSourceNotice
        live={live}
        liveLabel="Applications are loaded from the registry operator API."
        demoLabel="Operator API is not configured - only seeded demo applications are shown. Set OPERATOR_API_KEY to review real submissions."
      />
      <ApplicationsTable items={items} />
      {items.length > 0 ? (
        <p className="admin-lede" style={{ marginTop: 12 }}>
          Open an application to approve, reject, or request documents.
        </p>
      ) : null}
    </div>
  );
}
