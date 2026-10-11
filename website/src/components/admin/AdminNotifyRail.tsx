import Link from "next/link";
import { AlertTriangle, BookMarked, Building2, Wallet } from "lucide-react";

export type AdminQueueBadges = {
  pendingBusiness: number;
  pendingProvider: number;
  pendingDictionary: number;
  newComplaints: number;
};

type NotifyItem = {
  href: string;
  label: string;
  count: number;
  icon: typeof Building2;
  tone?: "warn" | "danger";
};

export function AdminNotifyRail({ badges }: { badges: AdminQueueBadges }) {
  const items: NotifyItem[] = [
    {
      href: "/admin/applications/businesses/pending",
      label: "Business pending review",
      count: badges.pendingBusiness,
      icon: Building2,
      tone: "warn",
    },
    {
      href: "/admin/applications/providers/pending",
      label: "Provider pending review",
      count: badges.pendingProvider,
      icon: Wallet,
      tone: "warn",
    },
    {
      href: "/admin/registry/name-reviews",
      label: "Protected name queue",
      count: badges.pendingDictionary,
      icon: BookMarked,
      tone: "warn",
    },
    {
      href: "/admin/complaints/new",
      label: "New complaints",
      count: badges.newComplaints,
      icon: AlertTriangle,
      tone: "danger",
    },
  ];

  return (
    <nav className="admin-notify-rail" aria-label="Queue notifications">
      {items.map((item) => {
        const Icon = item.icon;
        const hasCount = item.count > 0;
        return (
          <Link
            key={item.href}
            href={item.href}
            className="admin-notify-btn"
            data-tone={hasCount ? item.tone : undefined}
            data-active={hasCount ? "true" : undefined}
            title={`${item.label}${hasCount ? ` (${item.count})` : ""}`}
            aria-label={`${item.label}${hasCount ? `: ${item.count}` : ""}`}
          >
            <Icon className="admin-notify-icon" aria-hidden />
            {hasCount ? (
              <span className="admin-notify-badge" data-tone={item.tone}>
                {item.count > 99 ? "99+" : item.count}
              </span>
            ) : null}
          </Link>
        );
      })}
    </nav>
  );
}
