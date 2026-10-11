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

export default function ProviderApiKeysPage() {
  const { state, ready, busy, regenerateKey } = useProviderState();
  const { account } = state;

  return (
    <TrackGate
      track="provider"
      title="API keys are locked"
      description="Credential management unlocks after provider approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="API keys"
          description="Provider API keys for resolve and (when allowed) merchant setup."
        />
        <div className="dash-notice">
          Provider keys authorize resolve requests and registry mutations allowed
          by your integration level. They are separate from controller wallet
          authorization.
        </div>
        <ProviderLoadingState />
        {ready ? (
          <article className="dash-card" style={{ marginTop: 16 }}>
            <ProviderProvisionPanel />
            <ProviderErrorBanner />
            {account ? (
              <div className="dash-stack" style={{ marginTop: 16 }}>
                <p>
                  Status: <span className="dash-status">ACTIVE</span>
                </p>
                <p className="dash-meta">
                  Prefix: <span className="dash-code">{account.key_prefix}…</span>
                </p>
                <p className="dash-meta">
                  Created: {new Date(account.created_at).toLocaleString()}
                </p>
                <ProviderKeyReveal />
                <div className="dash-card-actions">
                  <button
                    className="dash-btn dash-btn-primary"
                    onClick={() => void regenerateKey()}
                    disabled={busy !== null}
                  >
                    {busy === "regenerate" ? "Regenerating…" : "Regenerate key"}
                  </button>
                </div>
              </div>
            ) : state.needsProvision ? (
              <p className="dash-meta" style={{ marginTop: 16 }}>
                Provision your provider account to receive an API key.
              </p>
            ) : null}
          </article>
        ) : null}
      </div>
    </TrackGate>
  );
}
