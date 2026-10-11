import { SiteFooter } from "@/components/SiteFooter";
import "./marketing-theme.css";
import "./home-editorial.css";

export default function MarketingLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="marketing-root">
      <div className="flex-1">{children}</div>
      <SiteFooter />
    </div>
  );
}
