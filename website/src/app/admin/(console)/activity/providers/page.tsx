import { ActivityAuditTable } from "@/components/admin/ActivityAuditTable";
import { listProviderActivity } from "@/lib/admin/activity";

export default function Page() {
  return (
    <ActivityAuditTable
      eyebrow="Activity"
      title="Provider activity"
      description="Provider application reviews, production access changes, and related admin actions."
      entries={listProviderActivity(200)}
      emptyMessage="No provider-related admin actions recorded yet."
    />
  );
}
