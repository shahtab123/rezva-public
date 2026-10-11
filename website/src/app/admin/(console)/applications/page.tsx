import { listApplications } from "@/lib/admin/store";
import { getOperatorClientConfig } from "@/lib/admin/operator-client";
import { ApplicationsTable } from "@/components/admin/ApplicationsTable";
import { AdminDataSourceNotice, AdminPageHeader } from "@/components/admin/ui";

export const dynamic = "force-dynamic";

export default async function ApplicationsAllPage() {
  const items = await listApplications();
  const live = Boolean(getOperatorClientConfig());

  return (
    <div>
      <AdminPageHeader
        eyebrow="Applications"
        title="All applications"
        description="Business, wallet provider, and namespace applications awaiting privileged review."
      />
      <AdminDataSourceNotice
        live={live}
        liveLabel="Applications are loaded from the registry operator API."
        demoLabel="Operator API is not configured - only seeded demo applications are shown. Set OPERATOR_API_KEY to review real submissions."
      />
      <ApplicationsTable items={items} />
    </div>
  );
}
