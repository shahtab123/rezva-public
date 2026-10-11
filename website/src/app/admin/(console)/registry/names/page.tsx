import { AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";
import { AdminUserDashboardHint } from "@/components/admin/AdminUserDashboardHint";
import { AdminRowAction, AdminRowActions } from "@/components/admin/AdminRowAction";
import { RegistrySuspendReactivateAction } from "@/components/admin/RegistrySuspendReactivateActions";
import { privilegedRegistryAction } from "@/lib/admin/actions";
import { filterByQuery, withDemoRegistryStatus } from "@/lib/admin/demo-registry";
import { getAdminNameRows } from "@/lib/admin/live-registry";
import { adminHasPermission } from "@/lib/admin/session";
import { getRegistryDemoOverrides } from "@/lib/admin/store";

export default async function NativeNamesPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const canWrite = await adminHasPermission("registry:write");
  const { rows: sourceRows, live } = await getAdminNameRows();
  const rows = filterByQuery(
    live ? sourceRows : withDemoRegistryStatus(sourceRows, getRegistryDemoOverrides()),
    q,
    (item) => `${item.name} ${item.status} ${item.controller} ${item.reviewTier ?? ""}`,
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry"
        title="Profile / Names"
        description="Every protocol native name a business claimed - the same record as Dashboard → Profile / Name. Standard names activate immediately; protected dictionary hits stay pending until you approve them in the queue."
      />
      <AdminUserDashboardHint
        dashboardHref="/dashboard/business/profile"
        dashboardLabel="Profile / Name"
      />
      {live ? (
        <div className="admin-notice">Showing live registry names from the operator API.</div>
      ) : null}

      <form className="admin-search" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search native names…"
          aria-label="Search native names"
        />
        <button type="submit" className="admin-btn">
          Search
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Controller</th>
              <th>Tier</th>
              <th>Updated</th>
              <th className="admin-col-actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  <span className="admin-code">{row.name}</span>
                </td>
                <td>
                  <AdminStatus tone={statusTone(row.status)}>
                    {row.status.replaceAll("_", " ")}
                  </AdminStatus>
                </td>
                <td>
                  <span className="admin-code">{row.controller}</span>
                </td>
                <td>{row.reviewTier ?? "standard"}</td>
                <td className="admin-cell-muted">
                  {new Date(row.updatedAt).toLocaleDateString()}
                </td>
                <td>
                  {canWrite ? (
                  <AdminRowActions>
                    <AdminRowAction
                      action={privilegedRegistryAction}
                      label="Reserve"
                      icon="bookmark"
                      danger={false}
                      confirmMessage={`Reserve name “${row.name}”?`}
                      hiddenFields={{
                        action: "name.reserve",
                        permission: "registry:write",
                        resourceType: "native_name",
                        resourceId: row.id,
                        previousState: row.status,
                        newState: "reserved",
                      }}
                    />
                    <RegistrySuspendReactivateAction
                      resourceType="native_name"
                      resourceId={row.id}
                      status={row.status}
                      label={`name “${row.name}”`}
                    />
                    <AdminRowAction
                      action={privilegedRegistryAction}
                      label="Revoke"
                      icon="shieldOff"
                      confirmMessage={`Revoke name “${row.name}”?`}
                      hiddenFields={{
                        action: "name.revoke",
                        permission: "registry:write",
                        resourceType: "native_name",
                        resourceId: row.id,
                        previousState: row.status,
                        newState: "revoked",
                      }}
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
