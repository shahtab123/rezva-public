"use client";

import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ProviderErrorBanner,
  ProviderLoadingState,
  ProviderProvisionPanel,
} from "@/components/dashboard/ProviderPanels";
import { useProviderState } from "@/components/dashboard/ProviderStateProvider";
import { TrackGate } from "@/components/dashboard/TrackGate";

const resolverOnlySteps = [
  "Provision your provider API key",
  "Send resolve requests with Authorization: Bearer <key>",
  "Handle active, pending, removed, and revoked identifier states",
  "Surface payment options and trust metadata in your wallet UI",
];

const merchantSetupSteps = [
  ...resolverOnlySteps,
  "Attach controller wallet headers for registry mutations",
  "Register identifiers on behalf of users when permitted",
  "Manage payment destinations for merchant integrations",
];

export default function ProviderIntegrationPage() {
  const { state, ready } = useProviderState();
  const { provider } = state;
  const steps =
    provider?.integration_level === "RESOLVER_ONLY"
      ? resolverOnlySteps
      : merchantSetupSteps;

  return (
    <TrackGate
      track="provider"
      title="Integration is locked"
      description="Integration checklist unlocks after provider approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Integration"
          description="RESOLVER_ONLY vs RESOLVER_PLUS_MERCHANT_SETUP and required resolve UX."
        />
        <ProviderLoadingState />
        {ready ? (
          <>
            <ProviderProvisionPanel />
            <ProviderErrorBanner />
            {provider ? (
              <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
                <article className="dash-card">
                  <h2>Integration level</h2>
                  <p className="dash-meta" style={{ marginTop: 12 }}>
                    Your account is configured as{" "}
                    <span className="dash-code">{provider.integration_level}</span>.
                  </p>
                  {provider.integration_level === "RESOLVER_ONLY" ? (
                    <p className="dash-meta">
                      Resolver-only providers may resolve identifiers but cannot
                      perform registry management mutations.
                    </p>
                  ) : (
                    <p className="dash-meta">
                      Merchant setup providers may resolve identifiers and perform
                      registry mutations when paired with a controller wallet.
                    </p>
                  )}
                </article>
                <article className="dash-card">
                  <h2>Resolve endpoint</h2>
                  <pre className="dash-code" style={{ marginTop: 12, whiteSpace: "pre-wrap" }}>
                    POST /v1/resolve{"\n"}
                    Authorization: Bearer &lt;provider_api_key&gt;{"\n"}
                    {`{ "type": "custom", "value": "merchant-id" }`}
                  </pre>
                </article>
                <article className="dash-card" style={{ gridColumn: "1 / -1" }}>
                  <h2>Checklist</h2>
                  <ol className="dash-list" style={{ marginTop: 12 }}>
                    {steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ol>
                </article>
              </div>
            ) : state.needsProvision ? (
              <p className="dash-meta" style={{ marginTop: 16 }}>
                Provision credentials to view your integration checklist.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </TrackGate>
  );
}
