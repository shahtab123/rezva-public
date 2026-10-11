import Link from "next/link";
import { notFound } from "next/navigation";
import { getDictionaryRequest } from "@/lib/admin/store";
import {
  approveDictionaryAction,
  rejectDictionaryAction,
  requestDictionaryDocumentsAction,
  markDictionaryProtectedAction,
  reserveDictionaryNameAction,
} from "@/lib/admin/actions";
import { ConfirmSubmitForm } from "@/components/admin/ConfirmActionForm";
import { AdminPageHeader, AdminReadOnlyNotice, AdminStatus, statusTone } from "@/components/admin/ui";
import { adminHasPermission } from "@/lib/admin/session";

export default async function NameReviewPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const item = getDictionaryRequest(id);
  if (!item) notFound();
  const canReview = await adminHasPermission("dictionary:review");

  return (
    <div>
      <AdminPageHeader
        eyebrow="Registry · Protected name queue"
        title={item.name}
        description="Elevated verification for protected native names. Documents are not exposed publicly."
        actions={
          <Link className="admin-btn" href="/admin/registry/name-reviews?status=pending">
            Back to queue
          </Link>
        }
      />

      <div className="admin-grid admin-grid-2">
        <section className="admin-card">
          <h2>Request</h2>
          <dl className="admin-dl">
            <div>
              <dt>Requested name</dt>
              <dd>
                <span className="admin-code">{item.name}</span>
              </dd>
            </div>
            <div>
              <dt>Applicant</dt>
              <dd>
                {item.applicantLabel} ({item.applicantKind})
              </dd>
            </div>
            <div>
              <dt>Purpose</dt>
              <dd>{item.purpose}</dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>
                <AdminStatus tone={statusTone(item.status)}>
                  {item.status.replaceAll("_", " ")}
                </AdminStatus>
              </dd>
            </div>
            <div>
              <dt>Evidence notes</dt>
              <dd>{item.evidenceNotes ?? "No documents stored in protocol DB."}</dd>
            </div>
            <div>
              <dt>Related identifiers</dt>
              <dd>
                {item.relatedIdentifiers?.length
                  ? item.relatedIdentifiers.join(", ")
                  : "-"}
              </dd>
            </div>
            {item.applicationId ? (
              <div>
                <dt>Application</dt>
                <dd>
                  <Link href={`/admin/applications/${item.applicationId}`}>
                    {item.applicationId}
                  </Link>
                </dd>
              </div>
            ) : null}
            {item.documentRequest ? (
              <div>
                <dt>Document request</dt>
                <dd>
                  {item.documentRequest.required}
                  <br />
                  Requested {new Date(item.documentRequest.requestedAt).toLocaleString()} by{" "}
                  {item.documentRequest.requestedBy}
                </dd>
              </div>
            ) : null}
            {item.decision ? (
              <div>
                <dt>Decision</dt>
                <dd>
                  {item.decision.note} · {item.decision.by} ·{" "}
                  {new Date(item.decision.at).toLocaleString()}
                </dd>
              </div>
            ) : null}
          </dl>
        </section>

        <section className="admin-card">
          <h2>Review history</h2>
          <ul className="admin-history">
            {item.history.map((event, index) => (
              <li key={`${event.at}-${index}`}>
                <time dateTime={event.at}>{new Date(event.at).toLocaleString()}</time>
                <span>
                  {event.by} · {event.action}
                  {event.note ? ` - ${event.note}` : ""}
                </span>
              </li>
            ))}
          </ul>
        </section>
      </div>

      <section className="admin-card" style={{ marginTop: 14 }}>
        <h2>Admin actions</h2>
        {!canReview ? (
          <AdminReadOnlyNotice permission="dictionary:review" />
        ) : (
        <div className="admin-grid admin-grid-2" style={{ marginTop: 12 }}>
          <form
            action={approveDictionaryAction}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Approve</h3>
            <div className="admin-field">
              <label>Note</label>
              <textarea name="note" defaultValue="Ownership verified - activate name" />
            </div>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="admin-btn admin-btn-primary">
              Approve
            </button>
          </form>

          <ConfirmSubmitForm
            action={rejectDictionaryAction}
            submitLabel="Reject"
            confirmMessage={`Reject protected-name request for “${item.name}”?`}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Reject</h3>
            <div className="admin-field">
              <label>Note</label>
              <textarea name="note" required placeholder="Rejection reason" />
            </div>
            <input type="hidden" name="id" value={item.id} />
          </ConfirmSubmitForm>

          <form
            action={requestDictionaryDocumentsAction}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Request more information</h3>
            <div className="admin-field">
              <label>What is required</label>
              <input name="required" required placeholder="Trademark certificate…" />
            </div>
            <div className="admin-field">
              <label>Reason</label>
              <input name="reason" required />
            </div>
            <div className="admin-field">
              <label>Message</label>
              <textarea name="message" required />
            </div>
            <input type="hidden" name="id" value={item.id} />
            <button type="submit" className="admin-btn">
              Request documents
            </button>
          </form>

          <ConfirmSubmitForm
            action={reserveDictionaryNameAction}
            submitLabel="Reserve name"
            confirmMessage={`Reserve “${item.name}” so it cannot be claimed by this applicant?`}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Reserve name</h3>
            <div className="admin-field">
              <label>Reason</label>
              <textarea name="reason" required defaultValue="Reserved pending further policy review" />
            </div>
            <input type="hidden" name="id" value={item.id} />
          </ConfirmSubmitForm>

          <ConfirmSubmitForm
            action={markDictionaryProtectedAction}
            submitLabel="Mark protected"
            confirmMessage={`Keep “${item.name}” in the protected dictionary and deny activation?`}
            className="admin-card"
            style={{ background: "#12151c" }}
          >
            <h3>Mark protected</h3>
            <p className="admin-lede">
              Keep the label protected and deny applicant activation.
            </p>
            <input type="hidden" name="id" value={item.id} />
          </ConfirmSubmitForm>
        </div>
        )}
      </section>
    </div>
  );
}
