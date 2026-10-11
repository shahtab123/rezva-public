import { SiteHeader } from "@/components/SiteHeader";
import { HowItWorksContent } from "@/components/how-it-works/HowItWorksContent";

export default function HowItWorksPage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="how-it-works-route">
        <HowItWorksContent />
      </main>
    </div>
  );
}
