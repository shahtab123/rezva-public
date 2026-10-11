import Link from "next/link";
import { Eye } from "lucide-react";
import { AdminPageHeader, AdminStatus, statusTone } from "@/components/admin/ui";
import { AdminRowAction, AdminRowActions } from "@/components/admin/AdminRowAction";
import { privilegedRegistryAction } from "@/lib/admin/actions";
import { DEMO_COMPLAINTS, type DemoComplaint } from "@/lib/admin/demo-registry";

const FILTER: Record<string, DemoStatus[]> = {
  new: ["submitted"],
  "under-review": ["under_review"],
  resolved: ["resolved", "rejected"],
};

type DemoStatus = (typeof DEMO_COMPLAINTS)[number]["status"];

export function ComplaintsPanel({
  filter,
  title,
  canResolve = true,
  rows: rowsProp,
  live = false,
}: {
  filter: keyof typeof FILTER;
  title: string;
  canResolve?: boolean;
  rows?: DemoComplaint[];
  live?: boolean;
}) {
  const allowed = FILTER[filter];
  const source = rowsProp ?? DEMO_COMPLAINTS;
  const rows = source.filter((item) => allowed.includes(item.status));

  return (
    <div>
      <AdminPageHeader
        eyebrow="Complaints"
        title={title}
        description={
          live
            ? "Live complaints from the registry worker."
            : "Submitted → Under review → Resolved / Rejected."
        }
      />

      <div className="admin-table-wrap">
        <table className="admin-table admin-table-compact">
          <thead>
            <tr>
              <th>Subject</th>
              <th>Target</th>
              <th>Status</th>
              <th>Submitted</th>
              <th className="admin-col-actions" />
            </tr>
          </thead>
          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={5} className="admin-empty">
                  Queue clear.
                </td>
              </tr>
            ) : (
              rows.map((row) => (
                <tr key={row.id}>
                  <td>
                    <strong>{row.subject}</strong>
                    <div className="admin-cell-sub">{row.summary}</div>
                  </td>
                  <td>
                    <span className="admin-code">{row.target}</span>
                  </td>
                  <td>
                    <AdminStatus tone={statusTone(row.status)}>
                      {row.status.replaceAll("_", " ")}
                    </AdminStatus>
                  </td>
                  <td className="admin-cell-muted">
                    {new Date(row.submittedAt).toLocaleDateString()}
                  </td>
                  <td>
                    {canResolve ? (
                    <AdminRowActions>
                      {row.status === "submitted" ? (
                        <AdminRowAction
                          action={privilegedRegistryAction}
                          label="Start review"
                          icon="eye"
                          danger={false}
                          confirmMessage={`Move complaint ${row.id} under review?`}
                          reasonDefault="Accepted for review"
                          hiddenFields={{
                            action: "complaint.request_evidence",
                            permission: "complaints:resolve",
                            resourceType: "complaint",
                            resourceId: row.id,
                            previousState: row.status,
                            newState: "under_review",
                          }}
                        />
                      ) : null}
                      {row.status !== "resolved" && row.status !== "rejected" ? (
                        <>
                          <AdminRowAction
                            action={privilegedRegistryAction}
                            label="Request evidence"
                            icon="fileQuestion"
                            danger={false}
                            confirmMessage="Request additional evidence?"
                            reasonLabel="What is required"
                            hiddenFields={{
                              action: "complaint.request_evidence",
                              permission: "complaints:resolve",
                              resourceType: "complaint",
                              resourceId: row.id,
                              previousState: row.status,
                              newState: "under_review",
                            }}
                          />
                          <AdminRowAction
                            action={privilegedRegistryAction}
                            label="Resolve"
                            icon="checkCircle2"
                            danger={false}
                            confirmMessage={`Resolve complaint ${row.id}?`}
                            reasonLabel="Resolution"
                            reasonPlaceholder="Warning / suspend / reclaim…"
                            hiddenFields={{
                              action: "complaint.resolve",
                              permission: "complaints:resolve",
                              resourceType: "complaint",
                              resourceId: row.id,
                              previousState: row.status,
                              newState: "resolved",
                            }}
                          />
                          <AdminRowAction
                            action={privilegedRegistryAction}
                            label="Reject complaint"
                            icon="xCircle"
                            confirmMessage={`Reject complaint ${row.id}?`}
                            hiddenFields={{
                              action: "complaint.resolve",
                              permission: "complaints:resolve",
                              resourceType: "complaint",
                              resourceId: row.id,
                              previousState: row.status,
                              newState: "rejected",
                            }}
                          />
                        </>
                      ) : (
                        <Link
                          className="admin-icon-btn"
                          href="/admin/activity/admin"
                          title="View audit"
                          aria-label="View audit"
                        >
                          <Eye className="admin-icon-btn-svg" aria-hidden />
                        </Link>
                      )}
                    </AdminRowActions>
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
    </div>
  );
}
