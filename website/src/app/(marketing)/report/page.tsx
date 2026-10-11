import Link from "next/link";
import { MarketingStaticPage } from "@/components/MarketingStaticPage";

export default function ReportPage() {
  return (
    <MarketingStaticPage
      eyebrow="Legal"
      title="Report / Dispute"
      lede="Impersonation, trademark conflicts, and unauthorized identifier mappings."
    >
      <p>
        If you believe a registry mapping misrepresents your business, wallet, or trademark, you can
        file a dispute after verifying ownership. Evidence stays private - it is not published in
        resolve responses.
      </p>
      <p>
        Approved businesses can submit complaints from the dashboard. Operators review disputes and
        may warn, suspend, revoke, or reclaim mappings per protocol policy.
      </p>
      <p>
        <Link href="/dashboard/business/complaints">Open business complaints</Link> (requires
        sign-in and an approved business application).
      </p>
    </MarketingStaticPage>
  );
}
