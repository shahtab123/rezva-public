"use client";

import { useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import {
  ProviderErrorBanner,
  ProviderLoadingState,
  ProviderProvisionPanel,
} from "@/components/dashboard/ProviderPanels";
import { useProviderState } from "@/components/dashboard/ProviderStateProvider";
import { PROVIDER_WEBHOOK_EVENTS } from "@/components/dashboard/provider-types";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";

type WebhookDelivery = {
  id: string;
  event: string;
  status: string;
  http_status: number | null;
  error_message: string | null;
  attempted_at: string;
};

function WebhookDeliveries({ webhookId }: { webhookId: string }) {
  const [deliveries, setDeliveries] = useState<WebhookDelivery[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function load() {
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardFetch(
        `/api/dashboard/provider/webhooks/${webhookId}/deliveries`,
      );
      const data = (await response.json()) as {
        deliveries?: WebhookDelivery[];
        error?: { message?: string };
      };
      if (!response.ok) {
        throw new Error(data.error?.message ?? "Could not load deliveries.");
      }
      setDeliveries(data.deliveries ?? []);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Could not load deliveries.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="dash-stack" style={{ marginTop: 8 }}>
      <button
        className="dash-btn dash-btn-secondary"
        type="button"
        onClick={() => void load()}
        disabled={loading}
      >
        {loading ? "Loading…" : "View recent deliveries"}
      </button>
      {error ? <p className="dash-error">{error}</p> : null}
      {deliveries?.length ? (
        <ul className="dash-list">
          {deliveries.map((delivery) => (
            <li key={delivery.id}>
              <span className="dash-code">{delivery.event}</span> -{" "}
              <span className="dash-status">{delivery.status}</span>
              {delivery.http_status ? ` (HTTP ${delivery.http_status})` : null}
              <br />
              <span className="dash-meta">
                {new Date(delivery.attempted_at).toLocaleString()}
                {delivery.error_message ? ` - ${delivery.error_message}` : ""}
              </span>
            </li>
          ))}
        </ul>
      ) : deliveries ? (
        <p className="dash-meta">No delivery attempts recorded yet.</p>
      ) : null}
    </div>
  );
}

export default function ProviderWebhooksPage() {
  const { state, ready, busy, createWebhook, updateWebhook, deleteWebhook } =
    useProviderState();
  const [url, setUrl] = useState("https://");
  const [events, setEvents] = useState<string[]>([PROVIDER_WEBHOOK_EVENTS[0]]);
  const [signingSecret, setSigningSecret] = useState<string | null>(null);
  const [formError, setFormError] = useState<string | null>(null);

  function toggleEvent(event: string) {
    setEvents((current) =>
      current.includes(event)
        ? current.filter((item) => item !== event)
        : [...current, event],
    );
  }

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSigningSecret(null);
    const result = await createWebhook({ url: url.trim(), events });
    if (!result.ok) {
      setFormError(result.error);
      return;
    }
    setSigningSecret(result.signingSecret);
    setUrl("https://");
    setEvents([PROVIDER_WEBHOOK_EVENTS[0]]);
  }

  return (
    <TrackGate
      track="provider"
      title="Webhooks are locked"
      description="Webhook configuration unlocks after provider approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Webhooks"
          description="Signed event delivery for registry and complaint outcomes."
        />
        <div className="dash-notice">
          Webhook endpoints receive signed POST payloads when subscribed events
          occur. Verify signatures with the signing secret using HMAC-SHA256 over
          <span className="dash-code"> timestamp + "." + body</span> (see{" "}
          <span className="dash-code">X-Rezva-Signature</span>).
        </div>
        <ProviderLoadingState />
        {ready ? (
          <>
            <ProviderProvisionPanel />
            <ProviderErrorBanner />
            {state.account ? (
              <>
                <article className="dash-card" style={{ marginTop: 16 }}>
                  <h2>Add endpoint</h2>
                  <form className="dash-stack" style={{ marginTop: 16 }} onSubmit={handleCreate}>
                    <label className="dash-field">
                      <span>HTTPS URL</span>
                      <input
                        className="dash-input"
                        value={url}
                        onChange={(event) => setUrl(event.target.value)}
                        placeholder="https://api.example.com/rezva/webhooks"
                        required
                      />
                    </label>
                    <fieldset>
                      <legend className="dash-meta">Events</legend>
                      <div className="dash-stack">
                        {state.availableWebhookEvents.map((event) => (
                          <label key={event} className="dash-check">
                            <input
                              type="checkbox"
                              checked={events.includes(event)}
                              onChange={() => toggleEvent(event)}
                            />
                            <span className="dash-code">{event}</span>
                          </label>
                        ))}
                      </div>
                    </fieldset>
                    <button
                      className="dash-btn dash-btn-primary"
                      type="submit"
                      disabled={busy !== null}
                    >
                      {busy === "webhook-create" ? "Creating…" : "Create webhook"}
                    </button>
                    {formError ? <p className="dash-error">{formError}</p> : null}
                    {signingSecret ? (
                      <div className="dash-notice" style={{ overflowWrap: "anywhere" }}>
                        <strong>Copy this signing secret now:</strong>
                        <br />
                        <span className="dash-code">{signingSecret}</span>
                      </div>
                    ) : null}
                  </form>
                </article>

                <article className="dash-card" style={{ marginTop: 16 }}>
                  <h2>Configured endpoints</h2>
                  {state.webhooks.length ? (
                    <div className="dash-table-wrap" style={{ marginTop: 16 }}>
                      <table className="dash-table">
                        <thead>
                          <tr>
                            <th>URL</th>
                            <th>Events</th>
                            <th>Status</th>
                            <th>Actions</th>
                          </tr>
                        </thead>
                        <tbody>
                          {state.webhooks.map((webhook) => (
                            <tr key={webhook.id}>
                              <td style={{ overflowWrap: "anywhere" }}>{webhook.url}</td>
                              <td>{webhook.events.join(", ")}</td>
                              <td>
                                <span className="dash-status">{webhook.status}</span>
                              </td>
                              <td>
                                <div className="dash-card-actions">
                                  <button
                                    className="dash-btn dash-btn-secondary"
                                    disabled={busy !== null}
                                    onClick={() =>
                                      void updateWebhook(webhook.id, {
                                        status:
                                          webhook.status === "ACTIVE"
                                            ? "DISABLED"
                                            : "ACTIVE",
                                      })
                                    }
                                  >
                                    {webhook.status === "ACTIVE" ? "Disable" : "Enable"}
                                  </button>
                                  <button
                                    className="dash-btn dash-btn-secondary"
                                    disabled={busy !== null}
                                    onClick={() => void deleteWebhook(webhook.id)}
                                  >
                                    Delete
                                  </button>
                                </div>
                                <WebhookDeliveries webhookId={webhook.id} />
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  ) : (
                    <p className="dash-meta" style={{ marginTop: 16 }}>
                      No webhook endpoints configured yet.
                    </p>
                  )}
                </article>
              </>
            ) : state.needsProvision ? (
              <p className="dash-meta" style={{ marginTop: 16 }}>
                Provision provider credentials before configuring webhooks.
              </p>
            ) : null}
          </>
        ) : null}
      </div>
    </TrackGate>
  );
}
