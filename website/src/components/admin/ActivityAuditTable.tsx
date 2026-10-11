import { AdminPageHeader } from "@/components/admin/ui";
import type { AdminAuditEntry } from "@/lib/admin/types";

export function ActivityAuditTable({
  eyebrow,
  title,
  description,
  entries,
  emptyMessage = "No matching activity recorded yet.",
}: {
  eyebrow: string;
  title: string;
  description: string;
  entries: AdminAuditEntry[];
  emptyMessage?: string;
}) {
  return (
    <div>
      <AdminPageHeader eyebrow={eyebrow} title={title} description={description} />
      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact">
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Resource</th>
              <th>State change</th>
              <th>Reason</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={6} className="admin-empty">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td className="admin-cell-muted">
                    {new Date(entry.at).toLocaleString()}
                  </td>
                  <td>{entry.adminUsername}</td>
                  <td>
                    <span className="admin-code">{entry.action}</span>
                  </td>
                  <td>
                    {entry.resourceType}/{entry.resourceId}
                  </td>
                  <td>
                    {entry.previousState ?? "-"} → {entry.newState ?? "-"}
                  </td>
                  <td>{entry.reason ?? entry.message ?? "-"}</td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
