import { ApplicationsFilteredPage } from "@/components/admin/ApplicationsFilteredPage";

export default function Page() {
  return (
    <ApplicationsFilteredPage
      eyebrow="Business"
      title="Business applications"
      description="Merchant / controller applications for the business track."
      kind="business"
    />
  );
}
