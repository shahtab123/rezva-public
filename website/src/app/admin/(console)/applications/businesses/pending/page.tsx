import { ApplicationsFilteredPage } from "@/components/admin/ApplicationsFilteredPage";

export default function Page() {
  return (
    <ApplicationsFilteredPage
      eyebrow="Business"
      title="Pending review"
      description="Business track applications awaiting operator decision."
      kind="business"
      status="pending"
    />
  );
}
