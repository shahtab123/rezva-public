"use client";

import Link from "next/link";
import { ApplicationStatusBadge } from "./ApplicationStatusBadge";
import { ApplicationForm } from "./ApplicationForm";
import { ApplicationSummary } from "./ApplicationSummary";
import { DocumentResponseForm } from "./DocumentResponseForm";
import type { FormPreviewField } from "./FormPreview";
import {
  canReapply,
  hasSubmittedApplication,
  isPendingReview,
  needsAdditionalInfo,
  type TrackApplication,
} from "./application-types";
import { useDashboardState } from "./DashboardStateProvider";

export function ApplicationLanding({
  track,
  title,
  lede,
  application,
  fields,
  benefits,
}: {
  track: "business" | "provider";
  title: string;
  lede: string;
  application: TrackApplication;
  fields: FormPreviewField[];
  benefits: string[];
}) {
  const { submitApplication, respondToDocumentRequest } = useDashboardState();
  const pending = isPendingReview(application.status);
  const additionalInfo = needsAdditionalInfo(application.status);
  const rejected = application.status === "rejected";
  const approved = application.status === "approved";
  const showForm = canReapply(application.status) || rejected;
  const showSummary = hasSubmittedApplication(application.status) && !showForm;

  const continueHref =
    track === "business"
      ? "/dashboard/business/profile"
      : "/dashboard/provider/overview";

  return (
    <div className="dash-apply">
      <header className="dash-apply-intro">
        <div className="dash-apply-intro-copy">
          <p className="dash-eyebrow">
            {track === "business" ? "Business / Users track" : "Wallet provider track"}
          </p>
          <h1>{title}</h1>
          <p className="dash-page-lede">{lede}</p>
          <div className="dash-apply-status-row">
            <ApplicationStatusBadge status={application.status} />
            {application.submittedAt ? (
              <span className="dash-meta">
                Submitted {new Date(application.submittedAt).toLocaleString()}
              </span>
            ) : null}
          </div>
        </div>

        {!approved ? (
          <div className="dash-apply-benefits" aria-label="What unlocks after approval">
            <p className="dash-apply-benefits-label">After approval</p>
            <ul>
              {benefits.map((item, index) => (
                <li key={item}>
                  <span>{String(index + 1).padStart(2, "0")}</span>
                  {item}
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </header>

      {approved ? (
        <section className="dash-apply-banner is-success">
          <div>
            <h2>You’re approved</h2>
            <p>
              This track is unlocked. Continue to manage your{" "}
              {track === "business"
                ? "profile and identifiers."
                : "provider integration."}
            </p>
          </div>
          <Link className="dash-btn dash-btn-primary" href={continueHref}>
            Open {track === "business" ? "business" : "provider"} console
          </Link>
        </section>
      ) : null}

      {additionalInfo && application.documentRequest ? (
        <section className="dash-apply-banner is-warn">
          <div>
            <h2>Additional information requested</h2>
            <p>
              An operator needs more before this application can proceed. Management pages
              stay locked until review completes.
            </p>
            <dl className="dash-doc-request">
              <div>
                <dt>Required</dt>
                <dd>{application.documentRequest.required}</dd>
              </div>
              <div>
                <dt>Reason</dt>
                <dd>{application.documentRequest.reason}</dd>
              </div>
              <div>
                <dt>Message</dt>
                <dd>{application.documentRequest.message}</dd>
              </div>
              <div>
                <dt>Requested</dt>
                <dd>
                  {new Date(application.documentRequest.requestedAt).toLocaleString()} by{" "}
                  {application.documentRequest.requestedBy}
                </dd>
              </div>
            </dl>
          </div>
        </section>
      ) : null}

      {additionalInfo ? (
        <section className="dash-apply-sheet">
          <div className="dash-apply-sheet-head">
            <h2>Send additional information</h2>
            <p>
              Reply with what you provided and any reference the reviewer should know. Status
              returns to under review after you submit.
            </p>
          </div>
          <DocumentResponseForm
            onSubmit={(input) => respondToDocumentRequest(track, input)}
          />
        </section>
      ) : null}

      {pending ? (
        <section className="dash-apply-banner is-pending">
          <div>
            <h2>
              {application.status === "submitted"
                ? "Application submitted"
                : "Under review"}
            </h2>
            <p>
              We’re reviewing your details. Management pages stay locked until a decision is
              made - no further action is needed right now.
            </p>
            {application.documentResponse ? (
              <p className="dash-meta">
                Additional info sent{" "}
                {new Date(application.documentResponse.submittedAt).toLocaleString()}
              </p>
            ) : null}
          </div>
        </section>
      ) : null}

      {rejected ? (
        <section className="dash-apply-banner is-danger">
          <div>
            <h2>Application rejected</h2>
            <p>
              {application.rejectionReason ??
                "This application was not approved. Update your details and reapply when ready."}
            </p>
          </div>
        </section>
      ) : null}

      {showSummary ? <ApplicationSummary application={application} /> : null}

      {showForm ? (
        <section className="dash-apply-sheet">
          <div className="dash-apply-sheet-head">
            <div>
              <h2>{rejected ? "Reapply" : "Application"}</h2>
              <p>
                Tell us who you are and how you’ll use Rezva. You can edit this later after
                approval.
              </p>
            </div>
          </div>
          <ApplicationForm
            fields={fields}
            submitLabel={rejected ? "Submit reapplication" : "Submit application"}
            onSubmit={(payload) => submitApplication(track, payload)}
          />
        </section>
      ) : null}
    </div>
  );
}
