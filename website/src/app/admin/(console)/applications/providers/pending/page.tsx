import { ApplicationsFilteredPage } from "@/components/admin/ApplicationsFilteredPage";

export default function Page() {
  return (
    <ApplicationsFilteredPage
      eyebrow="Wallet providers"
      title="Pending review"
      description="Wallet provider applications awaiting operator decision."
      kind="provider"
      status="pending"
    />
  );
}
