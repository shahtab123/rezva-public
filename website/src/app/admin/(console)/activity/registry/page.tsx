import { ActivityAuditTable } from "@/components/admin/ActivityAuditTable";
import { listRegistryActivity } from "@/lib/admin/activity";

export default function Page() {
  return (
    <ActivityAuditTable
      eyebrow="Activity"
      title="Registry events"
      description="Privileged registry, namespace, dictionary, identifier, name, and complaint actions from the admin audit log."
      entries={listRegistryActivity(200)}
      emptyMessage="No registry-related admin actions recorded yet."
    />
  );
}
