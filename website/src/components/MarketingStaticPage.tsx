import { SiteHeader } from "@/components/SiteHeader";

export function MarketingStaticPage({
  eyebrow,
  title,
  lede,
  children,
}: {
  eyebrow?: string;
  title: string;
  lede?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="site-shell">
      <SiteHeader />
      <main className="static-page">
        <article className="static-page-inner">
          {eyebrow ? <p className="static-page-eyebrow">{eyebrow}</p> : null}
          <h1>{title}</h1>
          {lede ? <p className="static-page-lede">{lede}</p> : null}
          <div className="static-page-body">{children}</div>
        </article>
      </main>
    </div>
  );
}
