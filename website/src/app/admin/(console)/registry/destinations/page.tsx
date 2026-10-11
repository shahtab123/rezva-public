import { AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";
import { AdminUserDashboardHint } from "@/components/admin/AdminUserDashboardHint";
import { AdminRowActions } from "@/components/admin/AdminRowAction";
import { RegistrySuspendReactivateAction } from "@/components/admin/RegistrySuspendReactivateActions";
import { DEMO_DESTINATIONS, filterByQuery, withDemoRegistryStatus } from "@/lib/admin/demo-registry";
import { getRegistryDemoOverrides } from "@/lib/admin/store";
import { adminHasPermission } from "@/lib/admin/session";

export default async function DestinationsPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const canWrite = await adminHasPermission("registry:write");
  const rows = filterByQuery(
    withDemoRegistryStatus(DEMO_DESTINATIONS, getRegistryDemoOverrides()),
    q,
    (item) => `${item.chain} ${item.asset} ${item.address} ${item.identifierId}`,
  );

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry"
        title="Payment destinations"
        description="Chain, asset, and address mappings businesses attach to identifiers - what wallets receive when they resolve payment_ready."
      />
      <div className="admin-notice">
        Demo data only - live destination listing is not wired to the operator API yet. Identifier
        and name panels use live data when OPERATOR_API_KEY is configured.
      </div>
      <AdminUserDashboardHint
        dashboardHref="/dashboard/business/payment-destinations"
        dashboardLabel="Payment Destinations"
      />

      <form className="admin-search" method="get">
        <input
          name="q"
          defaultValue={q ?? ""}
          placeholder="Search chain, asset, address…"
          aria-label="Search destinations"
        />
        <button type="submit" className="admin-btn">
          Search
        </button>
      </form>

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact">
          <thead>
            <tr>
              <th>Chain / asset</th>
              <th>Address</th>
              <th>Identifier</th>
              <th>Status</th>
              <th>Updated</th>
              <th className="admin-col-actions" />
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={row.id}>
                <td>
                  {row.chain} / {row.asset}
                </td>
                <td>
                  <span className="admin-code">{row.address}</span>
                </td>
                <td>
                  <span className="admin-code">{row.identifierId}</span>
                </td>
                <td>
                  <AdminStatus tone={statusTone(row.status)}>{row.status}</AdminStatus>
                </td>
                <td className="admin-cell-muted">
                  {new Date(row.updatedAt).toLocaleDateString()}
                </td>
                <td>
                  {canWrite ? (
                  <AdminRowActions>
                    <RegistrySuspendReactivateAction
                      resourceType="payment_destination"
                      resourceId={row.id}
                      status={row.status}
                      label={`destination ${row.address}`}
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
