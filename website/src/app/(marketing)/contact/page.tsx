import { MarketingStaticPage } from "@/components/MarketingStaticPage";
import Link from "next/link";

export default function ContactPage() {
  return (
    <MarketingStaticPage
      eyebrow="Company"
      title="Contact"
      lede="Partnerships, integrations, and operator inquiries."
    >
      <p>
        Email us at{" "}
        <a href="mailto:contact@rezva.xyz">contact@rezva.xyz</a>.
      </p>
      <p>
        For wallet integrations and provider onboarding, start with the{" "}
        <Link href="/integrate">integrate</Link> page and the provider application in the dashboard.
      </p>
      <p>
        Security researchers: responsible disclosure guidelines will be published here. Do not send
        production keys or secrets through public channels.
      </p>
    </MarketingStaticPage>
  );
}
