import { ProvidersPanel } from "@/components/admin/ProvidersPanel";
import { withDemoRegistryStatus } from "@/lib/admin/demo-registry";
import { getAdminProviderRows } from "@/lib/admin/live-registry";
import { getRegistryDemoOverrides } from "@/lib/admin/store";
import { adminHasPermission } from "@/lib/admin/session";

export default async function Page() {
  const { rows: sourceRows, live } = await getAdminProviderRows();
  const rows = live
    ? sourceRows
    : withDemoRegistryStatus(sourceRows, getRegistryDemoOverrides());
  const canManage = await adminHasPermission("providers:manage");
  return (
    <ProvidersPanel
      filter="all"
      rows={rows}
      canManage={canManage}
      title="Wallet providers"
      description={
        live
          ? "Live providers from the registry worker."
          : "Approved integrations - not controllers. Review status, production access, and abuse events."
      }
    />
  );
}
