import { ComplaintsPanel } from "@/components/admin/ComplaintsPanel";
import { getAdminComplaintPanelRows } from "@/lib/admin/live-registry";
import { adminHasPermission } from "@/lib/admin/session";

export default async function Page() {
  const canResolve = await adminHasPermission("complaints:resolve");
  const { rows, live } = await getAdminComplaintPanelRows();
  return (
    <ComplaintsPanel
      filter="under-review"
      title="Under review"
      canResolve={canResolve}
      rows={rows}
      live={live}
    />
  );
}
