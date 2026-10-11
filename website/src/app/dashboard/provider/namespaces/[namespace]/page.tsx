"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { useNamespaceState } from "@/components/dashboard/NamespaceStateProvider";
import {
  formatNamespaceDot,
  isNamespaceActive,
  namespaceStatusLabels,
  registrationPolicyLabels,
} from "@/components/dashboard/namespace-types";

export default function ManageNamespacePage() {
  return (
    <TrackGate
      track="provider"
      title="Namespaces are locked"
      description="Provider namespaces unlock after wallet provider approval."
    >
      <ManageContent />
    </TrackGate>
  );
}

function ManageContent() {
  const params = useParams<{ namespace: string }>();
  const slug = String(params.namespace ?? "");
  const { ready, getNamespace, getEventsForNamespace } = useNamespaceState();
  const ns = getNamespace(slug);

  if (!ready) {
    return <div className="dash-panel">Loading…</div>;
  }

  if (!ns) {
    return (
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Namespace not found"
          description="This namespace is not on your account."
        />
        <Link className="dash-btn dash-btn-secondary" href="/dashboard/provider/namespaces">
          Back to namespaces
        </Link>
      </div>
    );
  }

  const events = getEventsForNamespace(ns.slug);

  return (
    <div>
      <PageHeader
        eyebrow="Wallet provider"
        title={formatNamespaceDot(ns.slug)}
        description="Registry view of your payment namespace. Customer accounts and sales stay in your app."
        actions={
          isNamespaceActive(ns.status) ? (
            <div className="dash-card-actions" style={{ margin: 0 }}>
              <Link
                className="dash-btn dash-btn-primary"
                href={`/dashboard/provider/namespaces/${ns.slug}/names`}
              >
                Manage names
              </Link>
              <Link
                className="dash-btn dash-btn-secondary"
                href={`/dashboard/provider/namespaces/${ns.slug}/add-wallet`}
              >
                Add wallet
              </Link>
            </div>
          ) : null
        }
      />

      <div className="dash-grid dash-grid-2">
        <article className="dash-card">
          <h2>Namespace</h2>
          <dl className="dash-dl">
            <div>
              <dt>Namespace</dt>
              <dd>
                <span className="dash-code">{formatNamespaceDot(ns.slug)}</span>
              </dd>
            </div>
            <div>
              <dt>Status</dt>
              <dd>{namespaceStatusLabels[ns.status]}</dd>
            </div>
            <div>
              <dt>Description</dt>
              <dd>{ns.description ?? "-"}</dd>
            </div>
            <div>
              <dt>Registration policy</dt>
              <dd>{registrationPolicyLabels[ns.registrationPolicy]}</dd>
            </div>
            <div>
              <dt>Reserved names</dt>
              <dd>
                {ns.reservedNames.length
                  ? ns.reservedNames.map((name) => (
                      <span key={name} className="dash-chip">
                        {name}
                      </span>
                    ))
                  : "-"}
              </dd>
            </div>
            {ns.activatedAt ? (
              <div>
                <dt>Activated</dt>
                <dd>{new Date(ns.activatedAt).toLocaleString()}</dd>
              </div>
            ) : null}
          </dl>
        </article>

        <article className="dash-card">
          <h2>Aggregate usage</h2>
          <p className="dash-meta">
            Protocol-level metrics for billing and capacity - not individual
            customer charges.
          </p>
          <div className="dash-stat-strip is-compact">
            <div>
              <strong>{ns.usage.activeNames.toLocaleString()}</strong>
              <span>Active names</span>
            </div>
            <div>
              <strong>{ns.usage.totalNames.toLocaleString()}</strong>
              <span>Total names</span>
            </div>
            <div>
              <strong>
                {ns.usage.registrationsThisMonth.toLocaleString()}
              </strong>
              <span>Registrations</span>
            </div>
            <div>
              <strong>{ns.usage.removalsThisMonth.toLocaleString()}</strong>
              <span>Removals</span>
            </div>
            <div>
              <strong>
                {ns.usage.resolutionRequestsThisMonth.toLocaleString()}
              </strong>
              <span>Resolutions</span>
            </div>
          </div>
        </article>
      </div>

      <article className="dash-card" style={{ marginTop: 16 }}>
        <h2>Activity</h2>
        <p className="dash-meta">
          Registry-level events only. No provider customer PII.
        </p>
        {events.length === 0 ? (
          <p className="dash-meta">No events yet.</p>
        ) : (
          <ul className="dash-activity-list">
            {events.map((event) => (
              <li key={event.id}>
                <time dateTime={event.at}>
                  {new Date(event.at).toLocaleString()}
                </time>
                <span>{event.summary}</span>
              </li>
            ))}
          </ul>
        )}
      </article>

      <div className="dash-card-actions" style={{ marginTop: 16 }}>
        <Link className="dash-btn dash-btn-secondary" href="/dashboard/provider/namespaces">
          All namespaces
        </Link>
      </div>
    </div>
  );
}
