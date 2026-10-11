import type { TrackApplication } from "./application-types";

export function ApplicationSummary({ application }: { application: TrackApplication }) {
  if (!application.payload || Object.keys(application.payload).length === 0) {
    return null;
  }

  return (
    <section className="dash-apply-summary">
      <h2>Submitted information</h2>
      <p className="dash-apply-summary-lede">
        Read-only copy of what you sent. Updates require a new submission after rejection or
        when operators request changes.
      </p>
      <dl className="dash-dl">
        {Object.entries(application.payload).map(([key, value]) => (
          <div key={key}>
            <dt>{key}</dt>
            <dd>{value || "-"}</dd>
          </div>
        ))}
      </dl>
      {application.submittedAt ? (
        <p className="dash-meta">
          First submitted {new Date(application.submittedAt).toLocaleString()}
          {application.reviewedAt
            ? ` · Last update ${new Date(application.reviewedAt).toLocaleString()}`
            : null}
        </p>
      ) : null}
    </section>
  );
}
