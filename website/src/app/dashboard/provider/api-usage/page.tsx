"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ProviderErrorBanner,
  ProviderLoadingState,
  ProviderProvisionPanel,
} from "@/components/dashboard/ProviderPanels";
import { useProviderState } from "@/components/dashboard/ProviderStateProvider";
import { TrackGate } from "@/components/dashboard/TrackGate";

export default function ProviderApiUsagePage() {
  const { state, ready } = useProviderState();
  const { account, usage } = state;

  return (
    <TrackGate
      track="provider"
      title="API usage is locked"
      description="Usage metrics unlock after provider approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="API usage"
          description="Resolve volume and rate-limit visibility for your provider credential."
        />
        <ProviderLoadingState />
        {ready ? (
          <>
            <ProviderProvisionPanel />
            <ProviderErrorBanner />
            {account ? (
              <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
                <article className="dash-card">
                  <h2>Per-minute limit</h2>
                  <div className="dash-stat" style={{ marginTop: 16 }}>
                    <strong>{usage?.minute_count ?? 0}</strong>
                    <span className="dash-meta">
                      of {account.limits.requests_per_minute} requests
                    </span>
                    {usage?.minute_reset_at ? (
                      <span className="dash-meta">
                        Resets {new Date(usage.minute_reset_at).toLocaleTimeString()}
                      </span>
                    ) : null}
                  </div>
                </article>
                <article className="dash-card">
                  <h2>Daily limit</h2>
                  <div className="dash-stat" style={{ marginTop: 16 }}>
                    <strong>{usage?.day_count ?? 0}</strong>
                    <span className="dash-meta">
                      of {account.limits.requests_per_day} requests
                    </span>
                    {usage?.day_reset_at ? (
                      <span className="dash-meta">
                        Resets {new Date(usage.day_reset_at).toLocaleString()}
                      </span>
                    ) : null}
                  </div>
                </article>
                <article className="dash-card" style={{ gridColumn: "1 / -1" }}>
                  <h2>Last activity</h2>
                  <p className="dash-meta" style={{ marginTop: 12 }}>
                    {account.last_used_at
                      ? `Last resolve: ${new Date(account.last_used_at).toLocaleString()}`
                      : "No resolve requests recorded yet."}
                  </p>
                </article>
              </div>
            ) : state.needsProvision ? (
              <p className="dash-meta" style={{ marginTop: 16 }}>
                Usage metrics appear after you provision provider credentials.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </TrackGate>
  );
}
