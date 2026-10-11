import { MarketingStaticPage } from "@/components/MarketingStaticPage";
import Link from "next/link";

export default function GrantsPage() {
  return (
    <MarketingStaticPage
      eyebrow="Company"
      title="Grants / Research"
      lede="Supporting open protocol research, wallet interoperability, and emerging-market payment rails."
    >
      <p>
        Rezva is building in public. We welcome academic collaboration, wallet sandbox grants, and
        research that advances identifier-based payment resolution without locking users into
        proprietary address books.
      </p>
      <p>
        Topics of interest include resolver privacy, protected-name policy, namespace governance, and
        cross-chain destination safety periods.
      </p>
      <p>
        Reach out via <Link href="/contact">contact</Link> with a short proposal - funding cycles
        are not open yet, but we track credible research partners early.
      </p>
    </MarketingStaticPage>
  );
}
