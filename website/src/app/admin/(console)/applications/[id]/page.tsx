import Link from "next/link";
import { notFound } from "next/navigation";
import { getApplication } from "@/lib/admin/store";
import {
  applicationListHref,
  applicationReviewActions,
  isUserSubmittedApplication,
} from "@/lib/admin/application-review";
import {
  approveApplicationAction,
  rejectApplicationAction,
  requestApplicationDocumentsAction,
  suspendApplicationAction,
  reactivateApplicationAction,
  setProviderProductionAccessAction,
} from "@/lib/admin/actions";
import { ConfirmSubmitForm } from "@/components/admin/ConfirmActionForm";
import { AdminDataSourceNotice, AdminPageHeader, AdminReadOnlyNotice, AdminStatus, statusTone } from "@/components/admin/ui";
import { adminHasPermission } from "@/lib/admin/session";
import { getOperatorClientConfig } from "@/lib/admin/operator-client";

export const dynamic = "force-dynamic";

export default async function ApplicationDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const app = await getApplication(id);
  if (!app) notFound();
  const canReview = await adminHasPermission("applications:review");
  const actions = applicationReviewActions(app);
  const backHref = applicationListHref(app.kind);
  const live = Boolean(getOperatorClientConfig());

  return (
    <div>
      <AdminPageHeader
        eyebrow="Applications"
        title={app.displayName}
        description={`${app.kind} application · privileged review`}
        actions={
          <Link className="admin-btn" href={backHref}>
            Back to list
          </Link>
        }
      />

      <AdminDataSourceNotice
        live={live}
        liveLabel="This application is stored in the registry operator database."
        demoLabel="Operator API is not configured - only local demo applications can be reviewed here."
      />

      {isUserSubmittedApplication(app.id) ? (
        <div className="admin-notice" style={{ marginBottom: 14 }}>
          Real user submission. Approve and reject update the applicant dashboard immediately.
          Suspend/reactivate are disabled for user submissions - use reject instead.
        </div>
      ) : null}

      <div className="admin-grid admin-grid-2">
        <section className="admin-card">
          <h2>Application</h2>
          <dl className="admin-dl">
            <div>
              <dt>Status</dt>
              <dd>
                <AdminStatus tone={statusTone(app.status)}>
                  {app.status.replaceAll("_", " ")}
                </AdminStatus>
              </dd>
            </div>
            <div>
              <dt>Kind</dt>
              <dd>{app.kind}</dd>
            </div>
            <div>
              <dt>Contact</dt>
              <dd>{app.contactEmail ?? "-"}</dd>
            </div>
            <div>
              <dt>Website</dt>
              <dd>{app.website ?? "-"}</dd>
            </div>
            <div>
              <dt>Summary</dt>
              <dd>{app.summary ?? "-"}</dd>
            </div>
            {app.namespaceSlug ? (
              <div>
                <dt>Namespace</dt>
                <dd>
                  <span className="admin-code">.{app.namespaceSlug}</span>
                </dd>
              </div>
            ) : null}
            {app.documentRequest ? (
              <div>
                <dt>Documents requested</dt>
                <dd>
                  {app.documentRequest.required}
                  <br />
                  <span style={{ color: "#93a0b8" }}>
                    {app.documentRequest.message} · by {app.documentRequest.requestedBy}
                  </span>
                </dd>
              </div>
            ) : null}
            {app.documentResponse ? (
              <div>
                <dt>Applicant response</dt>
                <dd>
                  {app.documentResponse.message}
                  {app.documentResponse.note ? (
                    <>
                      <br />
                      <span style={{ color: "#93a0b8" }}>{app.documentResponse.note}</span>
                    </>
                  ) : null}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="admin-card">
          <h2>Submitted fields</h2>
          <dl className="admin-dl">
            {Object.entries(app.payload).map(([key, value]) => (
              <div key={key}>
                <dt>{key}</dt>
                <dd>{value || "-"}</dd>
              </div>
            ))}
          </dl>
        </section>
      </div>

      <section className="admin-card" style={{ marginTop: 14 }}>
        <h2>Admin actions</h2>
        <p className="admin-lede" style={{ marginBottom: 14 }}>
          Destructive outcomes require confirmation. Document requests are prepared for the
          configured email workflow and logged in audit history.
        </p>

        {!canReview ? (
          <AdminReadOnlyNotice permission="applications:review" />
        ) : (
        <div className="admin-grid admin-grid-2">
          {actions.approve ? (
          <form
            action={approveApplicationAction}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Approve</h3>
            <div className="admin-field">
              <label>Reason</label>
              <input name="reason" defaultValue="Application approved" required />
            </div>
            <input type="hidden" name="id" value={app.id} />
            <button type="submit" className="admin-btn admin-btn-primary">
              Approve
            </button>
          </form>
          ) : null}

          {actions.reject ? (
          <ConfirmSubmitForm
            action={rejectApplicationAction}
            submitLabel="Reject"
            confirmMessage={`Reject application “${app.displayName}”?`}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Reject</h3>
            <div className="admin-field">
              <label>Reason</label>
              <textarea name="reason" required placeholder="Why this application is rejected" />
            </div>
            <input type="hidden" name="id" value={app.id} />
          </ConfirmSubmitForm>
          ) : null}

          {actions.requestDocuments ? (
          <form
            action={requestApplicationDocumentsAction}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Request documents</h3>
            <div className="admin-field">
              <label>What is required</label>
              <input name="required" required placeholder="Trade license, ownership letter…" />
            </div>
            <div className="admin-field">
              <label>Reason</label>
              <input name="reason" required placeholder="Why additional proof is needed" />
            </div>
            <div className="admin-field">
              <label>Message</label>
              <textarea name="message" required placeholder="Message shown to the applicant in their dashboard" />
            </div>
            <input type="hidden" name="id" value={app.id} />
            <button type="submit" className="admin-btn">
              Request documents
            </button>
          </form>
          ) : null}

          {actions.suspend ? (
          <ConfirmSubmitForm
            action={suspendApplicationAction}
            submitLabel="Suspend"
            confirmMessage={`Suspend “${app.displayName}”? This is a privileged registry-adjacent action.`}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Suspend</h3>
            <div className="admin-field">
              <label>Reason</label>
              <textarea name="reason" required placeholder="Suspension reason" />
            </div>
            <input type="hidden" name="id" value={app.id} />
          </ConfirmSubmitForm>
          ) : null}

          {actions.reactivate ? (
            <ConfirmSubmitForm
              action={reactivateApplicationAction}
              submitLabel="Reactivate"
              danger={false}
              confirmMessage={`Reactivate “${app.displayName}”? Restores approved status.`}
              className="admin-card"
              style={{ background: "#12151c" }}
            >
              <h3>Reactivate</h3>
              <div className="admin-field">
                <label>Reason</label>
                <textarea
                  name="reason"
                  required
                  defaultValue="Suspension lifted after review"
                  placeholder="Why access is restored"
                />
              </div>
              <input type="hidden" name="id" value={app.id} />
            </ConfirmSubmitForm>
          ) : null}

          {actions.providerProduction ? (
            <>
              <ConfirmSubmitForm
                action={setProviderProductionAccessAction}
                submitLabel="Grant production access"
                danger={false}
                confirmMessage={`Grant production API access to “${app.displayName}”?`}
                className="admin-card"
                style={{ background: "#12151c" }}
              >
                <h3>Grant production access</h3>
                <div className="admin-field">
                  <label>Reason</label>
                  <textarea name="reason" required defaultValue="Provider cleared for production" />
                </div>
                <input type="hidden" name="id" value={app.id} />
                <input type="hidden" name="grant" value="true" />
              </ConfirmSubmitForm>

              <ConfirmSubmitForm
                action={setProviderProductionAccessAction}
                submitLabel="Revoke production access"
                confirmMessage={`Revoke production access for “${app.displayName}”?`}
                className="admin-card"
                style={{ background: "#12151c" }}
              >
                <h3>Revoke production access</h3>
                <div className="admin-field">
                  <label>Reason</label>
                  <textarea name="reason" required placeholder="Why access is revoked" />
                </div>
                <input type="hidden" name="id" value={app.id} />
                <input type="hidden" name="grant" value="false" />
              </ConfirmSubmitForm>
            </>
          ) : null}

          {!actions.approve &&
          !actions.reject &&
          !actions.requestDocuments &&
          !actions.suspend &&
          !actions.reactivate &&
          !actions.providerProduction ? (
            <p className="admin-empty">
              No further review actions for this status. The applicant sees the current state in
              their dashboard.
            </p>
          ) : null}
        </div>
        )}
      </section>
    </div>
  );
}
