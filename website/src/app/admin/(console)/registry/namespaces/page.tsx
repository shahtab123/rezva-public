import Link from "next/link";
import {
  approveNamespaceAction,
  rejectNamespaceAction,
  suspendNamespaceAction,
} from "@/lib/admin/actions";
import { getAdminNamespaceRows } from "@/lib/admin/live-registry";
import { adminHasPermission } from "@/lib/admin/session";
import { ConfirmSubmitForm } from "@/components/admin/ConfirmActionForm";
import { AdminDataSourceNotice, AdminPageHeader, AdminReadOnlyNotice, AdminStatus, statusTone } from "@/components/admin/ui";

function isPendingNamespace(status: string): boolean {
  return status === "submitted" || status === "under_review";
}

export default async function AdminNamespacesPage() {
  const canManage = await adminHasPermission("namespaces:manage");
  const { rows, live } = await getAdminNamespaceRows();
  const pending = rows.filter((row) => isPendingNamespace(row.status));
  const active = rows.filter((row) => row.status === "active");
  const other = rows.filter(
    (row) => !isPendingNamespace(row.status) && row.status !== "active",
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry"
        title="Namespaces"
        description="Provider payment namespaces. Applications are created when an approved wallet provider submits from Dashboard → Namespaces → Apply."
      />
      <AdminDataSourceNotice
        live={live}
        liveLabel="Namespaces and usage metrics are loaded from the registry operator API."
        demoLabel="Operator API is not configured. Namespace applications from the provider dashboard will not appear here until OPERATOR_API_KEY is set."
      />

      <section className="admin-card" style={{ marginBottom: 14 }}>
        <h2>Pending namespace applications</h2>
        <p className="admin-lede" style={{ marginBottom: 12 }}>
          These are real submissions from{" "}
          <Link href="/dashboard/provider/namespaces/apply">/dashboard/provider/namespaces/apply</Link>
          . Approve to activate resolution for{" "}
          <span className="admin-code">user.namespace</span> names.
        </p>
        {!canManage ? <AdminReadOnlyNotice permission="namespaces:manage" /> : null}
        <div className="admin-table-wrap">
          <table className="admin-table admin-table-compact">
            <thead>
              <tr>
                <th>Namespace</th>
                <th>Provider</th>
                <th>Policy</th>
                <th>Status</th>
                <th>Submitted</th>
                <th className="admin-col-actions" />
              </tr>
            </thead>
            <tbody>
              {pending.length === 0 ? (
                <tr>
                  <td colSpan={6} className="admin-empty">
                    No pending namespace applications.
                  </td>
                </tr>
              ) : (
                pending.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <span className="admin-code">.{row.slug}</span>
                      {row.description ? (
                        <div className="admin-cell-sub">{row.description}</div>
                      ) : null}
                    </td>
                    <td className="admin-cell-muted">{row.providerId}</td>
                    <td className="admin-cell-muted">{row.registrationPolicy}</td>
                    <td>
                      <AdminStatus tone={statusTone(row.status)}>
                        {row.status.replaceAll("_", " ")}
                      </AdminStatus>
                    </td>
                    <td className="admin-cell-muted">
                      {row.createdAt ? new Date(row.createdAt).toLocaleDateString() : "-"}
                    </td>
                    <td>
                      {canManage ? (
                        <div className="admin-card-actions">
                          <form action={approveNamespaceAction}>
                            <input type="hidden" name="slug" value={row.slug} />
                            <input type="hidden" name="reason" value="Namespace approved" />
                            <button type="submit" className="admin-btn admin-btn-primary">
                              Approve
                            </button>
                          </form>
                          <ConfirmSubmitForm
                            action={rejectNamespaceAction}
                            submitLabel="Reject"
                            confirmMessage={`Reject namespace .${row.slug}?`}
                          >
                            <input type="hidden" name="slug" value={row.slug} />
                            <input type="hidden" name="reason" value="Namespace rejected after review" />
                          </ConfirmSubmitForm>
                        </div>
                      ) : (
                        <span className="admin-cell-muted">-</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>

      <h2 style={{ fontSize: 14, marginBottom: 10 }}>Active namespaces</h2>
      <div className="admin-grid admin-grid-2" style={{ marginBottom: 14 }}>
        {active.length === 0 ? (
          <div className="admin-empty">No active namespaces yet.</div>
        ) : (
          active.map((row) => (
            <article className="admin-card" key={row.slug}>
              <h3>
                <span className="admin-code">.{row.slug}</span>
              </h3>
              <p className="admin-cell-sub" style={{ marginTop: 0 }}>
                Provider {row.providerId} · {row.registrationPolicy.replaceAll("_", " ")}
              </p>
              <div className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
                <div className="admin-stat">
                  <strong>{row.usage.activeNames.toLocaleString()}</strong>
                  <span>Active names</span>
                </div>
                <div className="admin-stat">
                  <strong>{row.usage.totalNames.toLocaleString()}</strong>
                  <span>Total names</span>
                </div>
                <div className="admin-stat">
                  <strong>{row.usage.registrationsThisMonth.toLocaleString()}</strong>
                  <span>Registrations this month</span>
                </div>
                <div className="admin-stat">
                  <strong>0</strong>
                  <span>Customer PII fields exposed</span>
                </div>
              </div>
              {canManage ? (
                <ConfirmSubmitForm
                  action={suspendNamespaceAction}
                  submitLabel="Suspend"
                  confirmMessage={`Suspend namespace .${row.slug}?`}
                  className="admin-card"
                  style={{ marginTop: 12, background: "#12151c" }}
                >
                  <input type="hidden" name="slug" value={row.slug} />
                  <textarea
                    name="reason"
                    required
                    defaultValue="Suspended after operator review"
                    placeholder="Suspension reason"
                  />
                </ConfirmSubmitForm>
              ) : null}
            </article>
          ))
        )}
      </div>

      {other.length > 0 ? (
        <>
          <h2 style={{ fontSize: 14, marginBottom: 10 }}>Other namespaces</h2>
          <div className="admin-table-wrap">
            <table className="admin-table admin-table-compact">
              <thead>
                <tr>
                  <th>Namespace</th>
                  <th>Provider</th>
                  <th>Status</th>
                  <th>Updated</th>
                </tr>
              </thead>
              <tbody>
                {other.map((row) => (
                  <tr key={row.slug}>
                    <td>
                      <span className="admin-code">.{row.slug}</span>
                    </td>
                    <td>{row.providerId}</td>
                    <td>
                      <AdminStatus tone={statusTone(row.status)}>
                        {row.status.replaceAll("_", " ")}
                      </AdminStatus>
                    </td>
                    <td className="admin-cell-muted">
                      {row.updatedAt ? new Date(row.updatedAt).toLocaleDateString() : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      ) : null}
    </div>
  );
}
