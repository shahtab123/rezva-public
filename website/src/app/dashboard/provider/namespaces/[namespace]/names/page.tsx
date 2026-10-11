"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { useNamespaceState } from "@/components/dashboard/NamespaceStateProvider";
import {
  formatNamespaceDot,
  isNamespaceActive,
  nameStatusLabels,
  type NamespaceNameStatus,
} from "@/components/dashboard/namespace-types";

function nameTone(status: NamespaceNameStatus): string {
  if (status === "active") return "success";
  if (status === "suspended" || status === "removed") return "danger";
  if (status === "reserved") return "info";
  return "neutral";
}

export default function NamespaceNamesPage() {
  return (
    <TrackGate
      track="provider"
      title="Namespaces are locked"
      description="Provider namespaces unlock after wallet provider approval."
    >
      <NamesContent />
    </TrackGate>
  );
}

function NamesContent() {
  const params = useParams<{ namespace: string }>();
  const slug = String(params.namespace ?? "");
  const {
    ready,
    getNamespace,
    getNamesForNamespace,
    reserveName,
    setNameStatus,
  } = useNamespaceState();
  const ns = getNamespace(slug);
  const [query, setQuery] = useState("");
  const [reserveLabel, setReserveLabel] = useState("");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const names = useMemo(() => {
    if (!ns) return [];
    const all = getNamesForNamespace(ns.slug);
    const q = query.trim().toLowerCase();
    if (!q) return all;
    return all.filter(
      (n) =>
        n.label.includes(q) ||
        n.fullName.includes(q) ||
        (n.controllerRef ?? "").includes(q),
    );
  }, [getNamesForNamespace, ns, query]);

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

  if (!isNamespaceActive(ns.status)) {
    return (
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title={`Names · ${formatNamespaceDot(ns.slug)}`}
          description="Names unlock after the namespace is active."
        />
        <Link
          className="dash-btn dash-btn-secondary"
          href={`/dashboard/provider/namespaces/${ns.slug}`}
        >
          Back to namespace
        </Link>
      </div>
    );
  }

  async function onReserve(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    const result = await reserveName(ns!.slug, reserveLabel);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Reserved ${reserveLabel.trim().toLowerCase()}.${ns!.slug}`);
    setReserveLabel("");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Wallet provider"
        title={`Names · ${formatNamespaceDot(ns.slug)}`}
        description="Registry names only - search, reserve, and suspend. No customer profiles or purchase history."
        actions={
          <>
            <Link
              className="dash-btn dash-btn-primary"
              href={`/dashboard/provider/namespaces/${ns.slug}/add-wallet`}
            >
              Add wallet
            </Link>
            <Link
              className="dash-btn dash-btn-secondary"
              href={`/dashboard/provider/namespaces/${ns.slug}`}
            >
              Namespace overview
            </Link>
          </>
        }
      />

      <div className="dash-notice">
        Registration and payment destination updates normally arrive from your
        provider API after the user authorizes in your app.
      </div>

      <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
        <label className="dash-field">
          <span className="dash-field-label">Search names</span>
          <input
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="shahtab, alice…"
          />
        </label>

        <form className="dash-reserve-form" onSubmit={onReserve}>
          <label className="dash-field">
            <span className="dash-field-label">Reserve name</span>
            <span className="dash-inline-actions">
              <input
                value={reserveLabel}
                onChange={(e) => setReserveLabel(e.target.value)}
                placeholder="support"
              />
              <button type="submit" className="dash-btn dash-btn-secondary">
                Reserve
              </button>
            </span>
          </label>
        </form>
      </div>

      {error ? <p className="dash-field-error is-visible">{error}</p> : null}
      {message ? <p className="dash-meta">{message}</p> : null}

      <div className="dash-table-wrap" style={{ marginTop: 16 }}>
        <table className="dash-table">
          <thead>
            <tr>
              <th>Name</th>
              <th>Status</th>
              <th>Registered</th>
              <th>Destination</th>
              <th>Controller ref</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {names.length === 0 ? (
              <tr>
                <td colSpan={6} className="dash-meta">
                  No names match this view.
                </td>
              </tr>
            ) : (
              names.map((name) => (
                <tr key={name.fullName}>
                  <td>
                    <span className="dash-code">{name.fullName}</span>
                  </td>
                  <td>
                    <span
                      className={`dash-status dash-status-${nameTone(name.status)}`}
                      data-compact="true"
                    >
                      <span className="dash-status-dot" aria-hidden="true" />
                      {nameStatusLabels[name.status]}
                    </span>
                  </td>
                  <td>
                    {name.registeredAt
                      ? new Date(name.registeredAt).toLocaleDateString()
                      : "-"}
                  </td>
                  <td>
                    {name.destinationPreview ? (
                      <span className="dash-code">{name.destinationPreview}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    {name.controllerRef ? (
                      <span className="dash-code">{name.controllerRef}</span>
                    ) : (
                      "-"
                    )}
                  </td>
                  <td>
                    <div className="dash-inline-actions">
                      {name.status === "active" ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn-ghost"
                          onClick={() =>
                            void setNameStatus(ns.slug, name.label, "suspended")
                          }
                        >
                          Suspend
                        </button>
                      ) : null}
                      {name.status === "suspended" ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn-ghost"
                          onClick={() =>
                            void setNameStatus(ns.slug, name.label, "active")
                          }
                        >
                          Reinstate
                        </button>
                      ) : null}
                      {name.status !== "removed" ? (
                        <button
                          type="button"
                          className="dash-btn dash-btn-ghost"
                          onClick={() =>
                            void setNameStatus(ns.slug, name.label, "removed")
                          }
                        >
                          Remove
                        </button>
                      ) : null}
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
