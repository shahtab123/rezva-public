import type { ApplicationStatus } from "./application-types";
import { isApproved } from "./application-types";

export type DashboardNavItem = {
  label: string;
  href: string;
  /** Shown when track is not approved */
  lockedLabel?: string;
  requiresApproval?: boolean;
};

export type DashboardNavSection = {
  id: "overview" | "business" | "provider" | "free-api" | "developers" | "support";
  label: string;
  href?: string;
  items?: DashboardNavItem[];
  /** Pin section to the bottom of the sidebar nav */
  placement?: "bottom";
};

export const dashboardNav: DashboardNavSection[] = [
  {
    id: "overview",
    label: "Overview",
    href: "/dashboard",
  },
  {
    id: "business",
    label: "Business / Users",
    items: [
      {
        label: "Apply",
        href: "/dashboard/business/apply",
        lockedLabel: "Apply",
        requiresApproval: false,
      },
      {
        label: "Profile / Name",
        href: "/dashboard/business/profile",
        requiresApproval: true,
      },
      {
        label: "Identifiers",
        href: "/dashboard/business/identifiers",
        requiresApproval: true,
      },
      {
        label: "Payment Destinations",
        href: "/dashboard/business/payment-destinations",
        requiresApproval: true,
      },
      {
        label: "Activity",
        href: "/dashboard/business/activity",
        requiresApproval: true,
      },
      {
        label: "Complaints",
        href: "/dashboard/business/complaints",
        requiresApproval: true,
      },
      {
        label: "Settings",
        href: "/dashboard/business/settings",
        requiresApproval: true,
      },
    ],
  },
  {
    id: "provider",
    label: "Wallet Provider",
    items: [
      {
        label: "Apply",
        href: "/dashboard/provider/apply",
        lockedLabel: "Apply",
        requiresApproval: false,
      },
      {
        label: "Overview",
        href: "/dashboard/provider/overview",
        requiresApproval: true,
      },
      {
        label: "Integration",
        href: "/dashboard/provider/integration",
        requiresApproval: true,
      },
      {
        label: "API Keys",
        href: "/dashboard/provider/api-keys",
        requiresApproval: true,
      },
      {
        label: "API Usage",
        href: "/dashboard/provider/api-usage",
        requiresApproval: true,
      },
      {
        label: "Webhooks",
        href: "/dashboard/provider/webhooks",
        requiresApproval: true,
      },
      {
        label: "Integration sandbox",
        href: "/dashboard/provider/sandbox",
        requiresApproval: true,
      },
      {
        label: "Namespaces",
        href: "/dashboard/provider/namespaces",
        requiresApproval: true,
      },
      {
        label: "Settings",
        href: "/dashboard/provider/settings",
        requiresApproval: true,
      },
    ],
  },
  {
    id: "free-api",
    label: "Free API",
    href: "/dashboard/free-api",
  },
  {
    id: "developers",
    label: "Developers",
    placement: "bottom",
    items: [
      { label: "Docs", href: "/docs/introduction/overview" },
      { label: "SDKs", href: "/dashboard/developers#sdks" },
      { label: "Sandbox guide", href: "/dashboard/developers#sandbox" },
    ],
  },
  {
    id: "support",
    label: "Support",
    href: "/dashboard/support",
    placement: "bottom",
  },
];

export const dashboardNavMain = dashboardNav.filter(
  (section) => section.placement !== "bottom",
);

export const dashboardNavBottom = dashboardNav.filter(
  (section) => section.placement === "bottom",
);

export function resolveSectionItems(
  section: DashboardNavSection,
  status: ApplicationStatus,
): DashboardNavItem[] {
  if (!section.items) {
    return [];
  }

  const approved = isApproved(status);

  if (section.id === "business" || section.id === "provider") {
    if (!approved) {
      return [
        {
          label: "Apply",
          href:
            section.id === "business"
              ? "/dashboard/business/apply"
              : "/dashboard/provider/apply",
        },
      ];
    }

    return section.items.filter((item) => item.requiresApproval);
  }

  return section.items;
}
