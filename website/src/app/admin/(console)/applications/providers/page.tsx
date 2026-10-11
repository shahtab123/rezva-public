import { ApplicationsFilteredPage } from "@/components/admin/ApplicationsFilteredPage";

export default function Page() {
  return (
    <ApplicationsFilteredPage
      eyebrow="Wallet providers"
      title="Provider applications"
      description="Wallet and platform integrations requesting resolve access."
      kind="provider"
    />
  );
}
