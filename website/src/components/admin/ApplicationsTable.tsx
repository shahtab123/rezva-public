import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminStatus, statusTone } from "@/components/admin/ui";
import type { AdminApplication } from "@/lib/admin/types";

export function ApplicationsTable({ items }: { items: AdminApplication[] }) {
  if (items.length === 0) {
    return <div className="admin-empty">No applications in this view.</div>;
  }

  return (
    <div className="admin-table-wrap">
      <table className="admin-table admin-table-compact">
        <thead>
          <tr>
            <th>Applicant</th>
            <th>Kind</th>
            <th>Contact</th>
            <th>Submitted</th>
            <th>Status</th>
            <th className="admin-col-actions" />
          </tr>
        </thead>
        <tbody>
          {items.map((app) => (
            <tr key={app.id}>
              <td>
                <Link href={`/admin/applications/${app.id}`}>
                  <strong>{app.displayName}</strong>
                </Link>
                {app.summary ? <div className="admin-cell-sub">{app.summary}</div> : null}
              </td>
              <td>{app.kind}</td>
              <td className="admin-cell-muted">{app.contactEmail ?? "-"}</td>
              <td className="admin-cell-muted">
                {app.submittedAt ? new Date(app.submittedAt).toLocaleDateString() : "-"}
              </td>
              <td>
                <AdminStatus tone={statusTone(app.status)}>
                  {app.status.replaceAll("_", " ")}
                </AdminStatus>
              </td>
              <td>
                <Link
                  className="admin-btn admin-btn-ghost"
                  href={`/admin/applications/${app.id}`}
                >
                  Review
                </Link>
                <Link
                  className="admin-icon-btn"
                  href={`/admin/applications/${app.id}`}
                  title="Review application"
                  aria-label="Review application"
                >
                  <Eye className="admin-icon-btn-svg" aria-hidden />
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
