"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import {
  Activity,
  AlertTriangle,
  BookMarked,
  ClipboardList,
  Database,
  FileText,
  Fingerprint,
  Gauge,
  Globe,
  History,
  Key,
  LayoutDashboard,
  Server,
  Settings,
  Shield,
  Timer,
  Users,
  Wallet,
} from "lucide-react";
import { adminNavBottom, adminNavMain } from "./nav";
import type { AdminNavSection } from "./nav";

const navIcons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "/admin": LayoutDashboard,
  "/admin/applications": FileText,
  "/admin/applications/businesses": FileText,
  "/admin/applications/businesses/pending": ClipboardList,
  "/admin/applications/providers": Wallet,
  "/admin/applications/providers/pending": ClipboardList,
  "/admin/registry/identifiers": Fingerprint,
  "/admin/registry/names": BookMarked,
  "/admin/registry/name-reviews": ClipboardList,
  "/admin/registry/namespaces": Globe,
  "/admin/dictionary/reserved": Shield,
  "/admin/registry/reserved": Shield,
  "/admin/registry/destinations": Database,
  "/admin/registry/suspended": AlertTriangle,
  "/admin/dictionary": BookMarked,
  "/admin/complaints/new": AlertTriangle,
  "/admin/complaints/under-review": ClipboardList,
  "/admin/complaints/resolved": Shield,
  "/admin/providers": Server,
  "/admin/providers/api-access": Key,
  "/admin/providers/suspended": AlertTriangle,
  "/admin/activity/registry": History,
  "/admin/activity/providers": Activity,
  "/admin/activity/admin": Users,
  "/admin/system/identifier-types": Fingerprint,
  "/admin/system/safety-periods": Timer,
  "/admin/system/rate-limits": Gauge,
  "/admin/system/settings": Settings,
};

const groupIcons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  business: FileText,
  "wallet-providers": Wallet,
  registry: Database,
  dictionary: BookMarked,
  complaints: AlertTriangle,
  activity: Activity,
  system: Settings,
};

function NavIcon({ href }: { href: string }) {
  const Icon = navIcons[href] ?? LayoutDashboard;
  return <Icon className="admin-nav-icon" aria-hidden />;
}

function isActive(pathname: string, href: string): boolean {
  if (href === "/admin") return pathname === "/admin";
  return pathname === href || pathname.startsWith(`${href}/`);
}

function NavBadge({ count, tone }: { count: number; tone?: "warn" | "danger" }) {
  if (count <= 0) return null;
  return (
    <span className="admin-nav-badge" data-tone={tone ?? "warn"}>
      {count > 99 ? "99+" : count}
    </span>
  );
}

function NavSection({
  section,
  pathname,
  badges,
  onNavigate,
}: {
  section: AdminNavSection;
  pathname: string;
  badges?: Record<string, number>;
  onNavigate?: () => void;
}) {
  if (section.href) {
    return (
      <Link
        href={section.href}
        className="admin-nav-item"
        data-active={isActive(pathname, section.href) || undefined}
        onClick={onNavigate}
      >
        <NavIcon href={section.href} />
        <span className="admin-nav-label">{section.label}</span>
        <NavBadge
          count={badges?.[section.href] ?? 0}
          tone={section.href.includes("/complaints/") ? "danger" : "warn"}
        />
      </Link>
    );
  }

  const GroupIcon = groupIcons[section.id] ?? LayoutDashboard;
  const trackActive = (section.items ?? []).some((item) => isActive(pathname, item.href));

  return (
    <section className="admin-nav-group" data-active={trackActive || undefined}>
      <div className="admin-nav-group-head">
        <span className="admin-nav-group-title">
          <GroupIcon className="admin-nav-group-icon" aria-hidden />
          {section.label}
        </span>
      </div>
      <ul className="admin-nav-group-list">
        {(section.items ?? []).map((item) => (
          <li key={item.href}>
            <Link
              href={item.href}
              className="admin-nav-item admin-nav-item-nested"
              data-active={isActive(pathname, item.href) || undefined}
              onClick={onNavigate}
            >
              <NavIcon href={item.href} />
              <span className="admin-nav-label">{item.label}</span>
              <NavBadge
                count={badges?.[item.href] ?? 0}
                tone={item.href.includes("/complaints/") ? "danger" : "warn"}
              />
            </Link>
          </li>
        ))}
      </ul>
    </section>
  );
}

export function AdminNav({ badges }: { badges?: Record<string, number> }) {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const closeMobile = () => setMobileOpen(false);

  return (
    <>
      <button
        type="button"
        className="admin-nav-toggle"
        aria-expanded={mobileOpen}
        aria-controls="admin-sidebar-nav"
        onClick={() => setMobileOpen((open) => !open)}
      >
        Menu
      </button>

      <nav
        id="admin-sidebar-nav"
        className="admin-nav"
        aria-label="Admin"
        data-open={mobileOpen || undefined}
      >
        <div className="admin-nav-main">
          {adminNavMain.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              pathname={pathname}
              badges={badges}
              onNavigate={closeMobile}
            />
          ))}
        </div>
        <div className="admin-nav-bottom">
          {adminNavBottom.map((section) => (
            <NavSection
              key={section.id}
              section={section}
              pathname={pathname}
              badges={badges}
              onNavigate={closeMobile}
            />
          ))}
        </div>
      </nav>

      {mobileOpen ? (
        <button
          type="button"
          className="admin-nav-backdrop"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      ) : null}
    </>
  );
}
