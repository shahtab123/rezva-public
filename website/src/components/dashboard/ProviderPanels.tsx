"use client";

import { useProviderState } from "./ProviderStateProvider";

export function ProviderProvisionPanel() {
  const { state, busy, provision } = useProviderState();
  if (!state.needsProvision) return null;
  return (
    <div className="dash-notice" style={{ marginBottom: 16 }}>
      <strong>Provision your provider credentials</strong>
      <p className="dash-meta" style={{ marginTop: 8 }}>
        Your application is approved. Create your provider record and API key to
        start resolving identifiers.
      </p>
      <button
        className="dash-btn dash-btn-primary"
        style={{ marginTop: 12 }}
        onClick={() => void provision()}
        disabled={busy !== null}
      >
        {busy === "provision" ? "Provisioning…" : "Provision provider account"}
      </button>
    </div>
  );
}

export function ProviderKeyReveal() {
  const { plainKey } = useProviderState();
  if (!plainKey) return null;
  return (
    <div className="dash-notice" style={{ overflowWrap: "anywhere" }}>
      <strong>Copy this key now:</strong>
      <br />
      <span className="dash-code">{plainKey}</span>
    </div>
  );
}

export function ProviderLoadingState() {
  const { ready } = useProviderState();
  if (ready) return null;
  return (
    <div className="dash-panel">
      <p>Loading provider credentials…</p>
    </div>
  );
}

export function ProviderErrorBanner() {
  const { error } = useProviderState();
  if (!error) return null;
  return <p className="dash-error">{error}</p>;
}
