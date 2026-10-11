import { AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";
import { AdminUserDashboardHint } from "@/components/admin/AdminUserDashboardHint";
import { AdminRowAction, AdminRowActions } from "@/components/admin/AdminRowAction";
import { RegistrySuspendReactivateAction } from "@/components/admin/RegistrySuspendReactivateActions";
import { privilegedRegistryAction } from "@/lib/admin/actions";
import { filterByQuery, withDemoRegistryStatus } from "@/lib/admin/demo-registry";
import { getAdminIdentifierRows } from "@/lib/admin/live-registry";
import { adminHasPermission } from "@/lib/admin/session";
import { getRegistryDemoOverrides } from "@/lib/admin/store";

export default async function IdentifiersPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const canWrite = await adminHasPermission("registry:write");
  const { rows: sourceRows, live } = await getAdminIdentifierRows();
  const rows = filterByQuery(
    live ? sourceRows : withDemoRegistryStatus(sourceRows, getRegistryDemoOverrides()),
    q,
    (item) => `${item.display} ${item.normalized} ${item.controller} ${item.status}`,
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry"
        title="Identifiers"
        description="Phone, email, QR, and other mapped identifiers - same records businesses manage under Dashboard → Identifiers."
      />
      <AdminUserDashboardHint
        dashboardHref="/dashboard/business/identifiers"
        dashboardLabel="Identifiers"
      />
      {live ? (
        <div className="admin-notice">Showing live registry data from the operator API.</div>
      ) : null}

      <form className="admin-search" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search phone:… email:… controller…"
          aria-label="Search identifiers"
        />
        <button type="submit" className="admin-btn">
          Search
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact">
          <thead>
            <tr>
              <th>Identifier</th>
              <th>Status</th>
              <th>Controller</th>
              <th>Dest.</th>
              <th>Updated</th>
              <th className="admin-col-actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="admin-code">{row.display}</span>
                  <div className="admin-cell-sub">{row.normalized}</div>
                </td>
                <td>
                  <AdminStatus tone={statusTone(row.status)}>{row.status}</AdminStatus>
                </td>
                <td>
                  <span className="admin-code">{row.controller}</span>
                </td>
                <td>{row.destinations}</td>
                <td className="admin-cell-muted">
                  {new Date(row.updatedAt).toLocaleDateString()}
                </td>
                <td>
                  {canWrite ? (
                  <AdminRowActions>
                    <RegistrySuspendReactivateAction
                      resourceType="identifier"
                      resourceId={row.id}
                      status={row.status}
                      label={row.display}
                    />
                    <AdminRowAction
                      action={privilegedRegistryAction}
                      label="Revoke"
                      icon="shieldOff"
                      confirmMessage={`Revoke identifier ${row.display}?`}
                      hiddenFields={{
                        action: "identifier.revoke",
                        permission: "registry:write",
                        resourceType: "identifier",
                        resourceId: row.id,
                        previousState: row.status,
                        newState: "revoked",
                      }}
                    />
                    <AdminRowAction
                      action={privilegedRegistryAction}
                      label="Reclaim"
                      icon="alertTriangle"
                      confirmMessage={`Reclaim identifier ${row.display}? Highest-risk admin action.`}
                      hiddenFields={{
                        action: "identifier.reclaim",
                        permission: "registry:write",
                        resourceType: "identifier",
                        resourceId: row.id,
                        previousState: row.status,
                        newState: "reclaimed",
                      }}
                      reasonLabel="Reason / authorization"
                      reasonPlaceholder="Dual-control reference"
                    />
                  </AdminRowActions>
                  ) : (
                    <span className="admin-cell-muted">-</span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
