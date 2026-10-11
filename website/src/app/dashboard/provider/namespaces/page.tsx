"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { useNamespaceState } from "@/components/dashboard/NamespaceStateProvider";
import {
  canApplyForNamespace,
  formatNamespaceDot,
  isNamespaceActive,
  isNamespacePending,
  namespaceStatusLabels,
  registrationPolicyLabels,
  type NamespaceStatus,
} from "@/components/dashboard/namespace-types";

function statusTone(status: NamespaceStatus): string {
  if (status === "active") return "success";
  if (status === "rejected" || status === "suspended") return "danger";
  if (isNamespacePending(status)) return "info";
  return "neutral";
}

export default function ProviderNamespacesPage() {
  return (
    <TrackGate
      track="provider"
      title="Namespaces are locked"
      description="Provider namespaces unlock after wallet provider approval."
    >
      <NamespacesContent />
    </TrackGate>
  );
}

function NamespacesContent() {
  const { ready, state } = useNamespaceState();
  const canApply = canApplyForNamespace(state);
  const namespaces = state.namespaces;

  if (!ready) {
    return <div className="dash-panel">Loading namespaces…</div>;
  }

  return (
    <div>
      <PageHeader
        eyebrow="Wallet provider"
        title="Namespaces"
        description="Own a payment namespace like .redotpay. Your app handles user accounts, pricing, and purchases - Rezva registers and resolves names only."
        actions={
          canApply ? (
            <Link
              className="dash-btn dash-btn-primary"
              href="/dashboard/provider/namespaces/apply"
            >
              Apply for namespace
            </Link>
          ) : null
        }
      />

      <div className="dash-notice">
        We do not store your customers, emails, or billing records. Aggregate
        usage metrics and registry events only.
      </div>

      {namespaces.length === 0 ? (
        <section className="dash-empty">
          <div className="dash-empty-mark" aria-hidden="true" />
          <h2>Create your payment namespace</h2>
          <p>
            After approval, users in your wallet can claim names such as{" "}
            <span className="dash-code">shahtab.redotpay</span>. You manage
            availability, pricing, and checkout in your own infrastructure; your
            app registers names through our provider API.
          </p>
          <Link
            className="dash-btn dash-btn-primary"
            href="/dashboard/provider/namespaces/apply"
          >
            Apply for namespace
          </Link>
        </section>
      ) : (
        <div className="dash-ns-list">
          {namespaces.map((ns) => (
            <article key={ns.slug} className="dash-card">
              <div className="dash-card-top">
                <div>
                  <h2>{formatNamespaceDot(ns.slug)}</h2>
                  <p className="dash-meta" style={{ marginTop: 4 }}>
                    {ns.description ?? "No description"}
                    {" · "}
                    {registrationPolicyLabels[ns.registrationPolicy]}
                  </p>
                </div>
                <span
                  className={`dash-status dash-status-${statusTone(ns.status)}`}
                >
                  <span className="dash-status-dot" aria-hidden="true" />
                  {namespaceStatusLabels[ns.status]}
                </span>
              </div>

              {isNamespaceActive(ns.status) ? (
                <>
                  <div className="dash-stat-strip">
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
                      <span>Registrations this month</span>
                    </div>
                    <div>
                      <strong>
                        {ns.usage.removalsThisMonth.toLocaleString()}
                      </strong>
                      <span>Removals this month</span>
                    </div>
                    <div>
                      <strong>
                        {ns.usage.resolutionRequestsThisMonth.toLocaleString()}
                      </strong>
                      <span>Resolution requests</span>
                    </div>
                  </div>
                  <div className="dash-card-actions">
                    <Link
                      className="dash-btn dash-btn-primary"
                      href={`/dashboard/provider/namespaces/${ns.slug}`}
                    >
                      Manage namespace
                    </Link>
                    <Link
                      className="dash-btn dash-btn-secondary"
                      href={`/dashboard/provider/namespaces/${ns.slug}/names`}
                    >
                      View names
                    </Link>
                    <Link
                      className="dash-btn dash-btn-secondary"
                      href={`/dashboard/provider/namespaces/${ns.slug}/add-wallet`}
                    >
                      Add wallet
                    </Link>
                  </div>
                </>
              ) : isNamespacePending(ns.status) ? (
                <div className="dash-notice" style={{ marginTop: 12 }}>
                  Pending operator review. Namespace status is managed by Rezva
                  operators and will appear here when the registry is updated.
                </div>
              ) : ns.status === "rejected" ? (
                <div className="dash-card-actions">
                  <p className="dash-meta">
                    {ns.rejectionReason ??
                      "This namespace application was not approved."}
                  </p>
                  <Link
                    className="dash-btn dash-btn-primary"
                    href="/dashboard/provider/namespaces/apply"
                  >
                    Reapply
                  </Link>
                </div>
              ) : (
                <p className="dash-meta">
                  Namespace is {namespaceStatusLabels[ns.status].toLowerCase()}.
                </p>
              )}
            </article>
          ))}
        </div>
      )}
    </div>
  );
}
