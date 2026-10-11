import { SiteHeader } from "@/components/SiteHeader";
import { IntegrateContent } from "@/components/integrate/IntegrateContent";

export default function IntegratePage() {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="integrate-route">
        <IntegrateContent />
      </main>
    </div>
  );
}
