"use client";

import Link from "next/link";
import { ApplicationStatusBadge } from "@/components/dashboard/ApplicationStatusBadge";
import { isApproved } from "@/components/dashboard/application-types";
import { useDashboardState } from "@/components/dashboard/DashboardStateProvider";

export default function DashboardOverviewPage() {
  const { applications } = useDashboardState();
  const { business, provider } = applications;

  return (
    <div>
      <section className="dash-overview-hero">
        <p className="dash-eyebrow">Overview</p>
        <h1>One console for merchants and wallets.</h1>
        <p className="dash-page-lede">
          Apply as a business or individual user to register identifiers, or as a
          wallet provider to integrate resolution. Each track unlocks only after
          approval.
        </p>
        <div className="dash-overview-strip">
          <div>
            <strong>Shared entry</strong>
            <span>Same dashboard, separate approval tracks</span>
          </div>
          <div>
            <strong>Privy session</strong>
            <span>Sign-in required for apply and status</span>
          </div>
          <div>
            <strong>Server sync</strong>
            <span>Applications stored for operator review</span>
          </div>
        </div>
      </section>

      <div className="dash-notice">
        Applications sync to the server when you submit. Status updates from operator review
        appear here after refresh. Registry mutation wiring comes next.
      </div>

      <div className="dash-grid dash-grid-2">
        <article className="dash-card">
          <div className="dash-card-top">
            <h2>Business / Users</h2>
            <ApplicationStatusBadge status={business.status} />
          </div>
          <p>
            For merchants, operators, and individual users who need native names,
            identifiers, and payment destinations across compatible wallets.
          </p>
          <ul className="dash-list">
            <li>Register protocol identifiers</li>
            <li>Manage payment destinations</li>
            <li>Review activity and settings</li>
          </ul>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-primary" href="/dashboard/business/apply">
              {isApproved(business.status) ? "Open Business / Users" : "Apply as business or user"}
            </Link>
            {isApproved(business.status) ? (
              <Link className="dash-btn dash-btn-secondary" href="/dashboard/business/profile">
                Open profile
              </Link>
            ) : null}
          </div>
        </article>

        <article className="dash-card">
          <div className="dash-card-top">
            <h2>Wallet provider</h2>
            <ApplicationStatusBadge status={provider.status} />
          </div>
          <p>
            For wallets and platforms integrating resolution - API access,
            usage, webhooks, and sandbox tooling after approval.
          </p>
          <ul className="dash-list">
            <li>Integration guidance</li>
            <li>API keys and usage</li>
            <li>Webhooks and sandbox</li>
          </ul>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-primary" href="/dashboard/provider/apply">
              {isApproved(provider.status) ? "View provider track" : "Apply as provider"}
            </Link>
            {isApproved(provider.status) ? (
              <Link className="dash-btn dash-btn-secondary" href="/dashboard/provider/overview">
                Open overview
              </Link>
            ) : null}
          </div>
        </article>
      </div>

      <div className="dash-grid dash-grid-3" style={{ marginTop: 16 }}>
        <article className="dash-card">
          <h3>Developers</h3>
          <p>Docs, SDKs, and live API health for protocol integration.</p>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-secondary" href="/dashboard/developers">
              Open developers
            </Link>
          </div>
        </article>
        <article className="dash-card">
          <h3>Support</h3>
          <p>Help channels and escalation paths once production support is live.</p>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-secondary" href="/dashboard/support">
              Open support
            </Link>
          </div>
        </article>
        <article className="dash-card">
          <h3>Protocol docs</h3>
          <p>Public specification and technical reference on the marketing site.</p>
          <div className="dash-card-actions">
            <Link className="dash-btn dash-btn-secondary" href="/docs/introduction/overview">
              View docs
            </Link>
          </div>
        </article>
      </div>
    </div>
  );
}
