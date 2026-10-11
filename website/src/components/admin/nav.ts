export type AdminNavItem = {
  label: string;
  href: string;
};

export type AdminNavSection = {
  id: string;
  label: string;
  href?: string;
  items?: AdminNavItem[];
  placement?: "bottom";
};

/** Admin sidebar - grouped by participant type, not by workflow status. */
export const adminNav: AdminNavSection[] = [
  { id: "overview", label: "Overview", href: "/admin" },
  {
    id: "applications",
    label: "Applications",
    items: [{ label: "All applications", href: "/admin/applications" }],
  },
  {
    id: "business",
    label: "Business",
    items: [
      { label: "Applications", href: "/admin/applications/businesses" },
      { label: "Pending review", href: "/admin/applications/businesses/pending" },
    ],
  },
  {
    id: "wallet-providers",
    label: "Wallet providers",
    items: [
      { label: "Applications", href: "/admin/applications/providers" },
      { label: "Pending review", href: "/admin/applications/providers/pending" },
      { label: "Active providers", href: "/admin/providers" },
      { label: "API access", href: "/admin/providers/api-access" },
      { label: "Suspended", href: "/admin/providers/suspended" },
      { label: "Namespaces", href: "/admin/registry/namespaces" },
    ],
  },
  {
    id: "registry",
    label: "Registry",
    items: [
      { label: "Identifiers", href: "/admin/registry/identifiers" },
      { label: "Profile / Names", href: "/admin/registry/names" },
      { label: "Protected name queue", href: "/admin/registry/name-reviews" },
      { label: "Payment destinations", href: "/admin/registry/destinations" },
      { label: "Suspended", href: "/admin/registry/suspended" },
    ],
  },
  {
    id: "dictionary",
    label: "Dictionary",
    items: [
      { label: "Protected words", href: "/admin/dictionary" },
      { label: "Hard reserved", href: "/admin/dictionary/reserved" },
    ],
  },
  {
    id: "complaints",
    label: "Complaints",
    items: [
      { label: "New", href: "/admin/complaints/new" },
      { label: "Under review", href: "/admin/complaints/under-review" },
      { label: "Resolved", href: "/admin/complaints/resolved" },
    ],
  },
  {
    id: "activity",
    label: "Activity",
    placement: "bottom",
    items: [
      { label: "Registry events", href: "/admin/activity/registry" },
      { label: "Provider activity", href: "/admin/activity/providers" },
      { label: "Admin actions", href: "/admin/activity/admin" },
    ],
  },
  {
    id: "system",
    label: "System",
    placement: "bottom",
    items: [
      { label: "Identifier types", href: "/admin/system/identifier-types" },
      { label: "Safety periods", href: "/admin/system/safety-periods" },
      { label: "Rate limits", href: "/admin/system/rate-limits" },
      { label: "Settings", href: "/admin/system/settings" },
    ],
  },
];

export const adminNavMain = adminNav.filter((section) => section.placement !== "bottom");
export const adminNavBottom = adminNav.filter((section) => section.placement === "bottom");
