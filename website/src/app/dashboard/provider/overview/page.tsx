"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ProviderErrorBanner,
  ProviderKeyReveal,
  ProviderLoadingState,
  ProviderProvisionPanel,
} from "@/components/dashboard/ProviderPanels";
import { useProviderState } from "@/components/dashboard/ProviderStateProvider";
import { TrackGate } from "@/components/dashboard/TrackGate";

export default function ProviderOverviewPage() {
  const { state, ready } = useProviderState();
  const { account, provider, usage } = state;

  return (
    <TrackGate
      track="provider"
      title="Provider overview is locked"
      description="Provider tooling unlocks after wallet provider approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Overview"
          description="Integration status, credential health, and resolve readiness for your wallet."
        />
        <ProviderLoadingState />
        {ready ? (
          <>
            <ProviderProvisionPanel />
            <ProviderErrorBanner />
            {account && provider ? (
              <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
                <article className="dash-card">
                  <h2>Provider profile</h2>
                  <div className="dash-stack" style={{ marginTop: 16 }}>
                    <p>
                      Status: <span className="dash-status">{provider.status}</span>
                    </p>
                    <p>
                      Provider ID:{" "}
                      <span className="dash-code">{provider.provider_id}</span>
                    </p>
                    <p>
                      Integration:{" "}
                      <span className="dash-code">{provider.integration_level}</span>
                    </p>
                    <p className="dash-meta">
                      Allowed types:{" "}
                      {provider.allowed_identifier_types.length
                        ? provider.allowed_identifier_types.join(", ")
                        : "All supported types"}
                    </p>
                    {provider.website ? (
                      <p className="dash-meta">
                        Website:{" "}
                        <a href={provider.website} target="_blank" rel="noreferrer">
                          {provider.website}
                        </a>
                      </p>
                    ) : null}
                  </div>
                </article>
                <article className="dash-card">
                  <h2>Credential health</h2>
                  <div className="dash-stack" style={{ marginTop: 16 }}>
                    <p>
                      Key prefix:{" "}
                      <span className="dash-code">{account.key_prefix}…</span>
                    </p>
                    <p className="dash-meta">
                      Last used:{" "}
                      {account.last_used_at
                        ? new Date(account.last_used_at).toLocaleString()
                        : "Not used yet"}
                    </p>
                    <ProviderKeyReveal />
                    <div className="dash-grid dash-grid-2">
                      <div className="dash-stat">
                        <span className="dash-meta">Minute usage</span>
                        <strong>
                          {usage?.minute_count ?? 0} / {account.limits.requests_per_minute}
                        </strong>
                      </div>
                      <div className="dash-stat">
                        <span className="dash-meta">Daily usage</span>
                        <strong>
                          {usage?.day_count ?? 0} / {account.limits.requests_per_day}
                        </strong>
                      </div>
                    </div>
                  </div>
                </article>
              </div>
            ) : state.needsProvision ? (
              <p className="dash-meta" style={{ marginTop: 16 }}>
                Provision your account to see integration status and usage.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </TrackGate>
  );
}
