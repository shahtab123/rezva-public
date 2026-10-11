import Link from "next/link";

/** Maps an admin registry view to the matching business dashboard screen. */
export function AdminUserDashboardHint({
  dashboardHref,
  dashboardLabel,
}: {
  dashboardHref: string;
  dashboardLabel: string;
}) {
  return (
    <div className="admin-notice admin-notice-hint">
      <strong>Same as user dashboard:</strong> Business / Users →{" "}
      <Link href={dashboardHref}>{dashboardLabel}</Link>. Admin is the operator view of that
      data plus enforcement actions.
    </div>
  );
}
