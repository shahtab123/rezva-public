"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ProviderErrorBanner,
  ProviderLoadingState,
  ProviderProvisionPanel,
} from "@/components/dashboard/ProviderPanels";
import { useProviderState } from "@/components/dashboard/ProviderStateProvider";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";

const identifierTypes = ["custom", "email", "phone", "provider_name"];

export default function ProviderSandboxPage() {
  const { state, ready } = useProviderState();
  const [type, setType] = useState("custom");
  const [value, setValue] = useState("");
  const [responseBody, setResponseBody] = useState<string | null>(null);
  const [statusCode, setStatusCode] = useState<number | null>(null);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function runResolve(event: React.FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    setResponseBody(null);
    setStatusCode(null);
    try {
      const response = await dashboardFetch("/api/dashboard/provider/sandbox/resolve", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ type, value }),
      });
      const text = await response.text();
      setStatusCode(response.status);
      try {
        setResponseBody(JSON.stringify(JSON.parse(text), null, 2));
      } catch {
        setResponseBody(text);
      }
      if (!response.ok) {
        setError("Resolve request failed. See response below.");
      }
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Resolve request failed.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <TrackGate
      track="provider"
      title="Sandbox is locked"
      description="Sandbox tooling unlocks after provider approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Sandbox"
          description="Exercise resolve against the registry API through the authenticated dashboard."
        />
        <ProviderLoadingState />
        {ready ? (
          <>
            <ProviderProvisionPanel />
            <ProviderErrorBanner />
            {state.account ? (
              <article className="dash-card" style={{ marginTop: 16 }}>
                <h2>Resolve tester</h2>
                <p className="dash-meta" style={{ marginTop: 8 }}>
                  Calls the live registry resolve endpoint using the dashboard
                  service credential. Use test identifiers such as the shared
                  Test Merchant value from the Free API page.
                </p>
                <form className="dash-stack" style={{ marginTop: 16 }} onSubmit={runResolve}>
                  <label className="dash-field">
                    <span>Identifier type</span>
                    <select
                      className="dash-input"
                      value={type}
                      onChange={(event) => setType(event.target.value)}
                    >
                      {identifierTypes.map((item) => (
                        <option key={item} value={item}>
                          {item}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="dash-field">
                    <span>Identifier value</span>
                    <input
                      className="dash-input"
                      value={value}
                      onChange={(event) => setValue(event.target.value)}
                      placeholder="e.g. rezva-test-merchant"
                      required
                    />
                  </label>
                  <button
                    className="dash-btn dash-btn-primary"
                    type="submit"
                    disabled={busy}
                  >
                    {busy ? "Resolving…" : "Run resolve"}
                  </button>
                  {error ? <p className="dash-error">{error}</p> : null}
                  {statusCode !== null ? (
                    <p className="dash-meta">HTTP {statusCode}</p>
                  ) : null}
                  {responseBody ? (
                    <pre className="dash-code" style={{ whiteSpace: "pre-wrap" }}>
                      {responseBody}
                    </pre>
                  ) : null}
                </form>
              </article>
            ) : state.needsProvision ? (
              <p className="dash-meta" style={{ marginTop: 16 }}>
                Provision provider credentials before using the sandbox.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </TrackGate>
  );
}
