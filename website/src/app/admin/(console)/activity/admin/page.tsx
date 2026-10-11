import { listAudit } from "@/lib/admin/store";
import { AdminPageHeader } from "@/components/admin/ui";

export default function AdminAuditPage() {
  const entries = listAudit(200);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Activity"
        title="Admin actions"
        description="Privileged admin audit trail. Actions never silently modify registry state."
      />
      <div className="admin-table-wrap">
        <table className="admin-table">
          <thead>
            <tr>
              <th>Time</th>
              <th>Admin</th>
              <th>Action</th>
              <th>Resource</th>
              <th>State change</th>
              <th>Reason</th>
              <th>Ref</th>
            </tr>
          </thead>
          <tbody>
            {entries.length === 0 ? (
              <tr>
                <td colSpan={7}>No admin actions recorded yet.</td>
              </tr>
            ) : (
              entries.map((entry) => (
                <tr key={entry.id}>
                  <td>{new Date(entry.at).toLocaleString()}</td>
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
                  <td>
                    <span className="admin-code">
                      {entry.authorizationReference ?? "-"}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
