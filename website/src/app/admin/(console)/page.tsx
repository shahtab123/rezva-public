import Link from "next/link";
import { overviewCounts, listApplications, listDictionaryRequests, listAudit } from "@/lib/admin/store";
import { AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";

export default async function AdminOverviewPage() {
  const counts = await overviewCounts();
  const pendingApps = (await listApplications({ status: "pending" })).slice(0, 5);
  const pendingDict = listDictionaryRequests({ status: "pending" }).slice(0, 5);
  const recentAudit = listAudit(8);

  return (
    <div>
      <AdminPageHeader
        eyebrow="Overview"
        title="Protocol control plane"
        description="Review queues for applications, protected-name dictionary requests, and privileged admin actions. Business and provider dashboards remain separate."
      />

      <div className="admin-notice">
        Auth.js credentials login is temporary. Accounts support types and permissions
        for a future higher-security auth upgrade. Default local user:{" "}
        <span className="admin-code">admin</span> / <span className="admin-code">admin</span>.
      </div>

      <div className="admin-grid admin-grid-4">
        <div className="admin-card admin-stat">
          <strong>{counts.pendingApplications}</strong>
          <span>Pending applications</span>
        </div>
        <div className="admin-card admin-stat">
          <strong>{counts.pendingDictionary}</strong>
          <span>
            <Link href="/admin/registry/name-reviews?status=pending" style={{ color: "inherit" }}>
              Protected names
            </Link>
          </span>
        </div>
        <div className="admin-card admin-stat">
          <strong>{counts.dictionaryEntries}</strong>
          <span>
            <Link href="/admin/dictionary" style={{ color: "inherit" }}>
              Dictionary entries
            </Link>
          </span>
        </div>
        <div className="admin-card admin-stat">
          <strong>{counts.auditEvents}</strong>
          <span>Audit events</span>
        </div>
        <div className="admin-card admin-stat">
          <strong>{counts.adminUsers}</strong>
          <span>Admin accounts</span>
        </div>
      </div>

      <div className="admin-grid admin-grid-2" style={{ marginTop: 14 }}>
        <section className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12, alignItems: "center" }}>
            <h2>Pending applications</h2>
            <div style={{ display: "flex", gap: 8 }}>
              <Link className="admin-btn admin-btn-ghost" href="/admin/applications/businesses/pending">
                Business
              </Link>
              <Link className="admin-btn admin-btn-ghost" href="/admin/applications/providers/pending">
                Providers
              </Link>
            </div>
          </div>
          {pendingApps.length === 0 ? (
            <p className="admin-empty">Queue clear.</p>
          ) : (
            <div className="admin-table-wrap" style={{ border: 0, marginTop: 8 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Applicant</th>
                    <th>Kind</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingApps.map((app) => (
                    <tr key={app.id}>
                      <td>
                        <Link href={`/admin/applications/${app.id}`}>{app.displayName}</Link>
                      </td>
                      <td>{app.kind}</td>
                      <td>
                        <AdminStatus tone={statusTone(app.status)}>
                          {app.status.replaceAll("_", " ")}
                        </AdminStatus>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>

        <section className="admin-card">
          <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
            <h2>Protected name queue</h2>
            <Link className="admin-btn admin-btn-ghost" href="/admin/registry/name-reviews?status=pending">
              View all
            </Link>
          </div>
          {pendingDict.length === 0 ? (
            <p className="admin-empty">Queue clear.</p>
          ) : (
            <div className="admin-table-wrap" style={{ border: 0, marginTop: 8 }}>
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Name</th>
                    <th>Applicant</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {pendingDict.map((item) => (
                    <tr key={item.id}>
                      <td>
                        <Link href={`/admin/registry/name-reviews/${item.id}`}>
                          <span className="admin-code">{item.name}</span>
                        </Link>
                      </td>
                      <td>{item.applicantLabel}</td>
                      <td>
                        <AdminStatus tone={statusTone(item.status)}>
                          {item.status.replaceAll("_", " ")}
                        </AdminStatus>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </section>
      </div>

      <section className="admin-card" style={{ marginTop: 14 }}>
        <div style={{ display: "flex", justifyContent: "space-between", gap: 12 }}>
          <h2>Recent admin actions</h2>
          <Link className="admin-btn admin-btn-ghost" href="/admin/activity/admin">
            Full audit
          </Link>
        </div>
        <ul className="admin-history">
          {recentAudit.map((entry) => (
            <li key={entry.id}>
              <time dateTime={entry.at}>{new Date(entry.at).toLocaleString()}</time>
              <span>
                <strong>{entry.adminUsername}</strong> · {entry.action} · {entry.resourceType}/
                {entry.resourceId}
              </span>
            </li>
          ))}
          {recentAudit.length === 0 ? <li>No admin actions yet.</li> : null}
        </ul>
      </section>
    </div>
  );
}
