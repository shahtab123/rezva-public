"use client";

import { AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";
import { AdminRowAction, AdminRowActions } from "@/components/admin/AdminRowAction";
import { RegistrySuspendReactivateAction } from "@/components/admin/RegistrySuspendReactivateActions";
import { privilegedRegistryAction } from "@/lib/admin/actions";
import { DEMO_PROVIDERS, type DemoProvider } from "@/lib/admin/demo-registry";

export function ProvidersPanel({
  filter,
  title,
  description,
  rows = DEMO_PROVIDERS,
  canManage = true,
}: {
  filter: "all" | "api" | "suspended";
  title: string;
  description: string;
  rows?: DemoProvider[];
  canManage?: boolean;
}) {
  const filtered = rows.filter((item) => {
    if (filter === "suspended") return item.status === "suspended" || item.status === "revoked";
    if (filter === "api") return item.status === "approved";
    return true;
  });

  return (
    <div>
      <AdminPageHeader eyebrow="Providers" title={title} description={description} />
      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact">
          <thead>
            <tr>
              <th>Provider</th>
              <th>Status</th>
              <th>Production</th>
              <th>API (30d)</th>
              <th className="admin-col-actions" />
            </tr>
          </thead>
          <tbody>
            {filtered.map((row) => (
              <tr key={row.id}>
                <td>
                  <strong>{row.name}</strong>
                  <div className="admin-cell-sub">{row.website}</div>
                </td>
                <td>
                  <AdminStatus tone={statusTone(row.status)}>{row.status}</AdminStatus>
                </td>
                <td>{row.productionAccess ? "granted" : "revoked"}</td>
                <td>{row.apiCalls30d}</td>
                <td>
                  {canManage ? (
                  <AdminRowActions>
                    <RegistrySuspendReactivateAction
                      resourceType="provider"
                      resourceId={row.id}
                      status={row.status}
                      label={`provider “${row.name}”`}
                    />
                    <AdminRowAction
                      action={privilegedRegistryAction}
                      label="Revoke API access"
                      icon="shieldOff"
                      confirmMessage={`Revoke production API access for “${row.name}”?`}
                      hiddenFields={{
                        action: "provider.revoke_access",
                        permission: "providers:manage",
                        resourceType: "provider",
                        resourceId: row.id,
                        previousState: String(row.productionAccess),
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
