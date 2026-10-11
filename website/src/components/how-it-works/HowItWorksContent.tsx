import { HowItWorksFlowVisual } from "@/components/how-it-works/HowItWorksFlow";
import { HowItWorksSectionNav } from "@/components/how-it-works/HowItWorksSectionNav";
import {
  HowItWorksIdentifiers,
  HowItWorksMerchants,
  HowItWorksOverview,
  HowItWorksUsers,
  HowItWorksWallets,
} from "@/components/how-it-works/HowItWorksSections";
import { howItWorksIntro } from "@/components/how-it-works/data";
import "./how-it-works.css";

type HowItWorksContentProps = {
  className?: string;
};

export function HowItWorksContent({ className }: HowItWorksContentProps) {
  return (
    <div className={`hiw-shell ${className ?? ""}`.trim()}>
      <HowItWorksSectionNav />
      <div className="hiw-main how-it-works-page">
        <h1>How It Works</h1>
        <p className="how-it-works-lede docs-page-lede">{howItWorksIntro}</p>

        <HowItWorksOverview />
        <HowItWorksFlowVisual />
        <HowItWorksUsers />
        <HowItWorksMerchants />
        <HowItWorksWallets />
        <HowItWorksIdentifiers />
      </div>
    </div>
  );
}
