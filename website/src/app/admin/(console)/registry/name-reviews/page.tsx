import { NameReviewsPage, type NameReviewTabId } from "@/components/admin/NameReviewsPanel";

export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ status?: string }>;
}) {
  const { status } = await searchParams;
  const tab: NameReviewTabId =
    status === "verified" || status === "rejected" ? status : "pending";
  return <NameReviewsPage tab={tab} />;
}
