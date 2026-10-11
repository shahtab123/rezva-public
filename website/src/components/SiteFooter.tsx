import Link from "next/link";
import { BrandMark } from "@/components/BrandMark";
import { siteFooterResourceLinks, youtubeUrl } from "@/components/site-nav";

const companyLinks = [
  { label: "About", href: "/about" },
  { label: "Contact", href: "/contact" },
] as const;

const legalLinks = [
  { label: "Terms", href: "/terms" },
  { label: "Privacy", href: "/privacy" },
  { label: "Report / Dispute", href: "/report" },
] as const;

function YouTubeIcon() {
  return (
    <svg aria-hidden="true" viewBox="0 0 24 24" width="28" height="28" fill="currentColor">
      <path d="M23.5 6.2a3 3 0 0 0-2.1-2.1C19.5 3.5 12 3.5 12 3.5s-7.5 0-9.4.6A3 3 0 0 0 .5 6.2 31.5 31.5 0 0 0 0 12a31.5 31.5 0 0 0 .5 5.8 3 3 0 0 0 2.1 2.1c1.9.6 9.4.6 9.4.6s7.5 0 9.4-.6a3 3 0 0 0 2.1-2.1A31.5 31.5 0 0 0 24 12a31.5 31.5 0 0 0-.5-5.8ZM9.75 15.5v-7l6.2 3.5-6.2 3.5Z" />
    </svg>
  );
}

export function SiteFooter() {
  return (
    <footer className="site-footer">
      <div className="site-footer-inner">
        <div className="site-footer-top">
          <div className="site-footer-brand-col">
            <Link className="brand footer-brand" href="/">
              <BrandMark size={28} />
              <span>Rezva</span>
            </Link>
            <p className="site-footer-tagline">
              Universal payment resolution - one protocol for identifiers, names, and destinations.
            </p>
          </div>

          <nav className="site-footer-nav" aria-label="Resources">
            <h2>Resources</h2>
            <ul>
              {siteFooterResourceLinks.map((link) => (
                <li key={link.href}>
                  {link.external ? (
                    <a href={link.href} target="_blank" rel="noreferrer">
                      {link.label}
                    </a>
                  ) : (
                    <Link href={link.href}>{link.label}</Link>
                  )}
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer-nav" aria-label="Company">
            <h2>Company</h2>
            <ul>
              {companyLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>

          <nav className="site-footer-nav" aria-label="Legal">
            <h2>Legal</h2>
            <ul>
              {legalLinks.map((link) => (
                <li key={link.href}>
                  <Link href={link.href}>{link.label}</Link>
                </li>
              ))}
            </ul>
          </nav>
        </div>

        <div className="site-footer-bottom">
          <p>© 2026 Rezva</p>
          <a
            className="site-footer-social"
            href={youtubeUrl}
            target="_blank"
            rel="noreferrer"
            aria-label="Rezva on YouTube"
          >
            <YouTubeIcon />
          </a>
        </div>
      </div>
    </footer>
  );
}
