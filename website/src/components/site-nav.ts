export type SiteNavItem =
  | {
      label: string;
      href: string;
      external?: false;
    }
  | {
      label: string;
      href: string;
      external: true;
    };

/** Right-side header links (before Log in / account). */
export const siteNavLinks: SiteNavItem[] = [
  { label: "How it works", href: "/how-it-works" },
  { label: "Use cases", href: "/use-cases" },
  { label: "Docs", href: "/docs/introduction/overview" },
];

/** @deprecated Use siteNavLinks */
export const siteNavPrimary: SiteNavItem[] = siteNavLinks;

/** @deprecated Use siteNavLinks */
export const siteNavSecondary: SiteNavItem[] = [];

export const youtubeUrl = "https://www.youtube.com/@Rezva-o5s";

/** Footer resource links (formerly in the header). */
export const siteFooterResourceLinks: SiteNavItem[] = [
  { label: "Integrate", href: "/integrate" },
  { label: "Docs", href: "/docs/introduction/overview" },
];
