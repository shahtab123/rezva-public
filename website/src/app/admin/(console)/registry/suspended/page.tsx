import { AdminPageHeader, AdminStatus, statusTone, AdminDataSourceNotice } from "@/components/admin/ui";
import { AdminRowActions } from "@/components/admin/AdminRowAction";
import { RegistrySuspendReactivateAction } from "@/components/admin/RegistrySuspendReactivateActions";
import {
  DEMO_DESTINATIONS,
  withDemoRegistryStatus,
} from "@/lib/admin/demo-registry";
import { getAdminSuspendedRegistryRows } from "@/lib/admin/live-registry";
import { getRegistryDemoOverrides } from "@/lib/admin/store";
import { adminHasPermission } from "@/lib/admin/session";

export default async function SuspendedRemovedPage() {
  const canWrite = await adminHasPermission("registry:write");
  const { identifiers, names, live } = await getAdminSuspendedRegistryRows();
  const destinations = withDemoRegistryStatus(DEMO_DESTINATIONS, getRegistryDemoOverrides()).filter(
    (item) => ["suspended", "removed", "revoked"].includes(item.status),
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry"
        title="Suspended"
        description="Non-active registry records. Use Reactivate (✓ icon) to restore suspended items to active. Revoked or removed items need a separate protocol procedure."
      />
      <AdminDataSourceNotice
        live={live}
        liveLabel="Identifiers and profile names are loaded from the operator API."
        demoLabel="Showing demo identifier/name data. Configure OPERATOR_API_KEY for live suspended records."
      />

      <div className="admin-grid admin-grid-2">
        <section className="admin-card">
          <h2>Identifiers</h2>
          <div className="admin-table-wrap" style={{ border: 0, marginTop: 8 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Identifier</th>
                  <th>Status</th>
                  <th className="admin-col-actions" />
                </tr>
              </thead>
              <tbody>
                {identifiers.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="admin-empty">
                      None suspended.
                    </td>
                  </tr>
                ) : (
                  identifiers.map((row) => (
                    <tr key={row.id}>
                      <td>
                        <span className="admin-code">{row.display}</span>
                      </td>
                      <td>
                        <AdminStatus tone={statusTone(row.status)}>{row.status}</AdminStatus>
                      </td>
                      <td>
                        {canWrite && row.status === "suspended" ? (
                          <AdminRowActions>
                            <RegistrySuspendReactivateAction
                              resourceType="identifier"
                              resourceId={row.id}
                              status={row.status}
                              label={row.display}
                            />
                          </AdminRowActions>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>

        <section className="admin-card">
          <h2>Profile / Names</h2>
          <div className="admin-table-wrap" style={{ border: 0, marginTop: 8 }}>
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Name</th>
                  <th>Status</th>
                  <th className="admin-col-actions" />
                </tr>
              </thead>
              <tbody>
                {names.length === 0 ? (
                  <tr>
                    <td colSpan={3} className="admin-empty">
                      None suspended.
                    </td>
                  </tr>
                ) : (
                  names.map((row) => (
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
                        {canWrite && row.status === "suspended" ? (
                          <AdminRowActions>
                            <RegistrySuspendReactivateAction
                              resourceType="native_name"
                              resourceId={row.id}
                              status={row.status}
                              label={`name “${row.name}”`}
                            />
                          </AdminRowActions>
                        ) : null}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </section>
      </div>

      <section className="admin-card" style={{ marginTop: 14 }}>
        <h2>Payment destinations</h2>
        <p className="admin-lede" style={{ marginBottom: 10 }}>
          Destination listing is still demo-only until an operator destinations endpoint ships.
        </p>
        <div className="admin-table-wrap" style={{ border: 0, marginTop: 8 }}>
          <table className="admin-table">
            <thead>
              <tr>
                <th>Destination</th>
                <th>Status</th>
                <th className="admin-col-actions" />
              </tr>
            </thead>
            <tbody>
              {destinations.length === 0 ? (
                <tr>
                  <td colSpan={3} className="admin-empty">
                    None suspended.
                  </td>
                </tr>
              ) : (
                destinations.map((row) => (
                  <tr key={row.id}>
                    <td>
                      <span className="admin-code">
                        {row.chain}/{row.asset}
                      </span>
                      <div className="admin-cell-sub">{row.address}</div>
                    </td>
                    <td>
                      <AdminStatus tone={statusTone(row.status)}>{row.status}</AdminStatus>
                    </td>
                    <td>
                      {canWrite && row.status === "suspended" ? (
                        <AdminRowActions>
                          <RegistrySuspendReactivateAction
                            resourceType="payment_destination"
                            resourceId={row.id}
                            status={row.status}
                            label={`destination ${row.address}`}
                          />
                        </AdminRowActions>
                      ) : null}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
