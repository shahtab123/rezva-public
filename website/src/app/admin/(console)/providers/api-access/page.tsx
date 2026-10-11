import { ProvidersPanel } from "@/components/admin/ProvidersPanel";
import { withDemoRegistryStatus } from "@/lib/admin/demo-registry";
import { getAdminProviderRows } from "@/lib/admin/live-registry";
import { getRegistryDemoOverrides } from "@/lib/admin/store";
import { adminHasPermission } from "@/lib/admin/session";
import { AdminDataSourceNotice } from "@/components/admin/ui";

export default async function Page() {
  const { rows: sourceRows, live } = await getAdminProviderRows();
  const rows = live
    ? sourceRows
    : withDemoRegistryStatus(sourceRows, getRegistryDemoOverrides());
  const canManage = await adminHasPermission("providers:manage");
  return (
    <>
      <AdminDataSourceNotice
        live={live}
        liveLabel="Production API access from the registry operator API."
        demoLabel="Showing demo provider data. Configure OPERATOR_API_KEY for live records."
      />
      <ProvidersPanel
        filter="api"
        rows={rows}
        canManage={canManage}
        title="API access"
        description="Production API access for approved wallet providers. Aggregate usage only."
      />
    </>
  );
}
