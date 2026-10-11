import { DictionaryEntriesPanel } from "@/components/admin/DictionaryEntriesPanel";
import { AdminPageHeader } from "@/components/admin/ui";
import { adminHasPermission } from "@/lib/admin/session";

export default async function DictionaryIndexPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const canReview = await adminHasPermission("dictionary:review");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Dictionary"
        title="Protected words"
        description="Protected-word lists used when a business claims a name on Profile / Name. Hard reserved = blocked forever; protected words = allowed but need your approval."
      />
      <DictionaryEntriesPanel query={q} canReview={canReview} />
    </div>
  );
}
