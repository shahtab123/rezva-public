import { redirect } from "next/navigation";

export default async function LegacyDictionaryReviewRedirect({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  redirect(`/admin/registry/name-reviews/${id}`);
}
