export function AdminPageHeader({
  eyebrow,
  title,
  description,
  actions,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}) {
  return (
    <header className="admin-page-header">
      <div>
        {eyebrow ? <p className="admin-eyebrow">{eyebrow}</p> : null}
        <h1>{title}</h1>
        {description ? <p className="admin-lede">{description}</p> : null}
      </div>
      {actions ? <div className="admin-actions">{actions}</div> : null}
    </header>
  );
}

export function AdminStatus({
  tone,
  children,
}: {
  tone: "neutral" | "info" | "success" | "warn" | "danger";
  children: React.ReactNode;
}) {
  return <span className={`admin-status admin-status-${tone}`}>{children}</span>;
}

export function statusTone(
  status: string,
): "neutral" | "info" | "success" | "warn" | "danger" {
  const value = status.toLowerCase();
  if (["approved", "active", "verified", "resolved"].some((s) => value.includes(s))) {
    return "success";
  }
  if (["rejected", "revoked", "suspended", "removed"].some((s) => value.includes(s))) {
    return "danger";
  }
  if (["pending", "submitted", "under_review", "additional", "new"].some((s) => value.includes(s))) {
    return "info";
  }
  if (["warn", "warning"].some((s) => value.includes(s))) {
    return "warn";
  }
  return "neutral";
}

export function AdminReadOnlyNotice({ permission }: { permission: string }) {
  return (
    <div className="admin-notice" style={{ marginBottom: 14 }}>
      Read-only - missing <span className="admin-code">{permission}</span> permission. Contact a
      super admin to request access.
    </div>
  );
}

export function AdminDataSourceNotice({
  live,
  liveLabel = "Showing live data from the registry operator API.",
  demoLabel = "Showing local demo data. Set OPERATOR_API_KEY and NEXT_PUBLIC_API_URL to load live records.",
}: {
  live: boolean;
  liveLabel?: string;
  demoLabel?: string;
}) {
  return <div className="admin-notice">{live ? liveLabel : demoLabel}</div>;
}

export function AdminFilterTabs({
  tabs,
  active,
}: {
  tabs: { label: string; href: string; id: string }[];
  active: string;
}) {
  return (
    <nav className="admin-filter-tabs" aria-label="Filter">
      {tabs.map((tab) => (
        <a
          key={tab.id}
          href={tab.href}
          className="admin-filter-tab"
          data-active={active === tab.id || undefined}
          aria-current={active === tab.id ? "page" : undefined}
        >
          {tab.label}
        </a>
      ))}
    </nav>
  );
}
