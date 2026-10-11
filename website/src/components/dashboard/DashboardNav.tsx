"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState, type ComponentType } from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  Activity,
  BarChart3,
  BookOpen,
  CreditCard,
  FileText,
  FlaskConical,
  Fingerprint,
  Key,
  LayoutDashboard,
  LifeBuoy,
  LogOut,
  Menu,
  Package,
  Plug,
  Settings,
  Store,
  TestTube,
  User,
  Wallet,
  Webhook,
  X,
  Zap,
  AtSign,
} from "lucide-react";
import { userDisplayName, userSecondaryLabel } from "@/components/auth/auth-utils";
import { BrandMark } from "@/components/BrandMark";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { useDashboardState } from "./DashboardStateProvider";
import { dashboardNavBottom, dashboardNavMain, resolveSectionItems } from "./nav";
import type { DashboardNavSection } from "./nav";

const navIcons: Record<string, ComponentType<{ className?: string; "aria-hidden"?: boolean }>> = {
  "/dashboard": LayoutDashboard,
  "/dashboard/business/apply": FileText,
  "/dashboard/business/profile": User,
  "/dashboard/business/identifiers": Fingerprint,
  "/dashboard/business/payment-destinations": CreditCard,
  "/dashboard/business/activity": Activity,
  "/dashboard/business/complaints": LifeBuoy,
  "/dashboard/business/settings": Settings,
  "/dashboard/provider/apply": FileText,
  "/dashboard/provider/overview": LayoutDashboard,
  "/dashboard/provider/integration": Plug,
  "/dashboard/provider/api-keys": Key,
  "/dashboard/provider/api-usage": BarChart3,
  "/dashboard/provider/webhooks": Webhook,
  "/dashboard/provider/sandbox": FlaskConical,
  "/dashboard/provider/namespaces": AtSign,
  "/dashboard/provider/settings": Settings,
  "/dashboard/free-api": Zap,
  "/docs/introduction/overview": BookOpen,
  "/dashboard/developers": BookOpen,
  "/dashboard/developers#sdks": Package,
  "/dashboard/developers#sandbox": TestTube,
  "/dashboard/support": LifeBuoy,
};

function NavIcon({ href }: { href: string }) {
  const Icon = navIcons[href] ?? ChevronFallback;
  return <Icon className="dash-nav-icon" aria-hidden />;
}

function ChevronFallback({ className }: { className?: string }) {
  return (
    <svg className={className} viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <circle cx="8" cy="8" r="2.5" fill="currentColor" />
    </svg>
  );
}

function trackIcon(sectionId: string) {
  if (sectionId === "business") return Store;
  if (sectionId === "provider") return Wallet;
  if (sectionId === "developers") return BookOpen;
  return LayoutDashboard;
}

function renderNavSection(
  section: DashboardNavSection,
  pathname: string,
  applications: ReturnType<typeof useDashboardState>["applications"],
  closeMobile: () => void,
) {
  if (section.href) {
    const active = isLinkActive(pathname, section.href);
    return (
      <Link
        key={section.id}
        href={section.href}
        className="dash-nav-item"
        data-active={active || undefined}
        onClick={closeMobile}
      >
        <NavIcon href={section.href} />
        <span>{section.label}</span>
      </Link>
    );
  }

  const status =
    section.id === "business"
      ? applications.business.status
      : section.id === "provider"
        ? applications.provider.status
        : null;

  const items = resolveSectionItems(section, status ?? "not_applied");
  const TrackIcon = trackIcon(section.id);
  const trackActive = items.some((item) => isLinkActive(pathname, item.href));

  return (
    <section
      key={section.id}
      className="dash-nav-group"
      data-active={trackActive || undefined}
    >
      <div className="dash-nav-group-head">
        <span className="dash-nav-group-title">
          <TrackIcon className="dash-nav-group-icon" aria-hidden />
          {section.label}
        </span>
        {status ? <ApplicationStatusBadge status={status} compact /> : null}
      </div>

      <ul className="dash-nav-group-list">
        {items.map((item) => {
          const active = isLinkActive(pathname, item.href);
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className="dash-nav-item dash-nav-item-nested"
                data-active={active || undefined}
                onClick={closeMobile}
              >
                <NavIcon href={item.href} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </section>
  );
}

function userInitials(name: string): string {
  return (
    name
      .split(/\s+/)
      .map((part) => part[0])
      .filter(Boolean)
      .slice(0, 2)
      .join("")
      .toUpperCase() || "?"
  );
}

function isLinkActive(pathname: string, href: string): boolean {
  const base = href.split("#")[0]!;
  if (base === "/dashboard") {
    return pathname === "/dashboard";
  }
  return pathname === base || pathname.startsWith(`${base}/`);
}

export function DashboardNav() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const { applications, controllerWallet, ready } = useDashboardState();
  const { user, logout } = usePrivy();
  const name = userDisplayName(user);
  const secondary = userSecondaryLabel(user);

  function closeMobile() {
    setMobileOpen(false);
  }

  return (
    <>
      <button
        type="button"
        className="dash-nav-toggle"
        aria-expanded={mobileOpen}
        aria-controls="dash-sidebar"
        onClick={() => setMobileOpen((open) => !open)}
      >
        <Menu className="dash-nav-toggle-icon" aria-hidden />
        Menu
      </button>

      <aside
        id="dash-sidebar"
        className="dash-sidebar"
        data-open={mobileOpen || undefined}
      >
        <div className="dash-sidebar-head">
          <Link href="/" className="dash-brand" aria-label="Rezva home" onClick={closeMobile}>
            <BrandMark className="dash-brand-mark" size={36} />
            <span className="dash-brand-text">
              <strong>Rezva</strong>
              <small>Resolution console</small>
            </span>
          </Link>
          <button
            type="button"
            className="dash-sidebar-close"
            aria-label="Close navigation"
            onClick={closeMobile}
          >
            <X aria-hidden />
          </button>
        </div>

        <nav className="dash-sidebar-nav" aria-label="Dashboard">
          <div className="dash-sidebar-nav-main">
            {dashboardNavMain.map((section) =>
              renderNavSection(section, pathname, applications, closeMobile),
            )}
          </div>
          <div className="dash-sidebar-nav-bottom">
            {dashboardNavBottom.map((section) =>
              renderNavSection(section, pathname, applications, closeMobile),
            )}
          </div>
        </nav>

        <div className="dash-sidebar-foot">
          <div className="dash-user-card">
            <div className="dash-user-avatar" aria-hidden="true">
              {ready ? userInitials(name) : "…"}
            </div>
            <div className="dash-user-meta">
              <p className="dash-user-name">{ready ? name : "Loading…"}</p>
              {secondary ? (
                <p className="dash-user-detail" title={secondary}>
                  {secondary}
                </p>
              ) : null}
              <p className="dash-user-detail" title={controllerWallet ?? undefined}>
                {controllerWallet
                  ? `Wallet ${controllerWallet.slice(0, 6)}…${controllerWallet.slice(-4)}`
                  : "No wallet linked"}
              </p>
            </div>
          </div>

          <div className="dash-foot-actions">
            <button
              type="button"
              className="dash-foot-btn dash-foot-btn-logout"
              onClick={() => void logout()}
            >
              <LogOut aria-hidden />
              Log out
            </button>
          </div>
        </div>
      </aside>

      {mobileOpen ? (
        <button
          type="button"
          className="dash-nav-backdrop"
          aria-label="Close navigation"
          onClick={closeMobile}
        />
      ) : null}
    </>
  );
}
