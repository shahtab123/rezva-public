"use client";

import { useMemo, useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate, useTrackAccess } from "@/components/dashboard/TrackGate";
import {
  classifyNativeName,
  PROTECTED_REVIEW_HINT,
} from "@/components/dashboard/protected-name-dictionary";
import {
  claimRegistryName,
  useRegistryNames,
  type DashboardName,
} from "@/lib/dashboard/registry-hooks";

export default function BusinessProfilePage() {
  return (
    <TrackGate
      track="business"
      title="Profile is locked"
      description="Approve a business application before managing native names and profile details."
    >
      <ProfileContent />
    </TrackGate>
  );
}

function ProfileContent() {
  const { controllerWallet } = useTrackAccess("business");
  const { names, loading, error, refresh } = useRegistryNames(controllerWallet);
  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  const classification = useMemo(() => classifyNativeName(draft), [draft]);
  const primaryName =
    names.find((row) => row.status === "active") ??
    names.find((row) => row.status === "pending_review") ??
    null;
  const otherNames = names.filter((name) => name.id !== primaryName?.id);
  const canClaim = !loading && !primaryName;

  async function onClaim(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!controllerWallet) {
      setFormError("Link a controller wallet in Privy before claiming a name.");
      return;
    }
    const result = classifyNativeName(draft);
    if (!result.valid) {
      setFormError("Use 3-64 characters: lowercase letters, numbers, and hyphens.");
      return;
    }
    if (result.reserved) {
      setFormError("This name is permanently reserved and cannot be registered.");
      return;
    }
    setBusy(true);
    try {
      await claimRegistryName(controllerWallet, result.normalized);
      setDraft("");
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Claim failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business / Users"
        title="Profile / Name"
        description="Claim the one name wallets show when someone pays you. It becomes resolve.profile.name on every linked identifier."
      />

      {controllerWallet ? (
        <div className="dash-panel" style={{ marginBottom: 16 }}>
          <h2>Controller wallet</h2>
          <p>
            Linked from Privy: <span className="dash-code">{controllerWallet}</span>
          </p>
        </div>
      ) : (
        <div className="dash-notice">
          Link an embedded or external wallet in Privy to register names and identifiers.
        </div>
      )}

      <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
        {canClaim ? (
          <form className="dash-card" onSubmit={onClaim}>
            <h2>Claim name</h2>
            <p className="dash-meta" style={{ marginTop: 8 }}>
              Wallets use this as your title (for example &quot;Coffee Shop&quot;), not
              your email or phone identifier. You only need one.
            </p>
            <label className="dash-field is-wide" style={{ marginTop: 12 }}>
              <span className="dash-field-label">Display name</span>
              <input
                value={draft}
                onChange={(e) => setDraft(e.target.value)}
                placeholder="your-name"
                autoComplete="off"
                disabled={!controllerWallet || busy}
              />
            </label>

            {classification.valid && classification.reserved ? (
              <p className="dash-field-error is-visible">Permanently reserved - not registerable.</p>
            ) : null}
            {classification.valid && !classification.reserved && classification.protected ? (
              <p className="dash-meta" style={{ marginTop: 8 }}>
                {PROTECTED_REVIEW_HINT}
              </p>
            ) : null}
            {formError ? <p className="dash-field-error is-visible">{formError}</p> : null}

            <div className="dash-card-actions">
              <button
                type="submit"
                className="dash-btn dash-btn-primary"
                disabled={!controllerWallet || busy}
              >
                {busy ? "Submitting…" : classification.protected ? "Submit for review" : "Claim name"}
              </button>
            </div>
          </form>
        ) : null}

        <article className="dash-card">
          <h2>Your name</h2>
          {loading ? (
            <p className="dash-meta" style={{ marginTop: 12 }}>
              Loading from registry…
            </p>
          ) : error ? (
            <p className="dash-field-error is-visible">{error}</p>
          ) : primaryName ? (
            <>
              <div style={{ marginTop: 12 }}>
                <NameRow name={primaryName} primary />
              </div>
              <p className="dash-meta" style={{ marginTop: 12 }}>
                One name per account. Wallets show this as your merchant title on linked
                identifiers. Contact support if you need to change it.
              </p>
            </>
          ) : (
            <p className="dash-meta" style={{ marginTop: 12 }}>
              No name registered for this controller wallet yet.
            </p>
          )}
        </article>

        {otherNames.length > 0 ? (
          <article className="dash-card">
            <h2>Other names</h2>
            <p className="dash-meta" style={{ marginTop: 8 }}>
              Older or inactive names on this wallet. Only the primary name is shown to payers.
            </p>
            <ul className="dash-list" style={{ marginTop: 12 }}>
              {otherNames.map((name) => (
                <li key={name.id}>
                  <NameRow name={name} />
                </li>
              ))}
            </ul>
          </article>
        ) : null}
      </div>
    </div>
  );
}

function NameRow({ name, primary }: { name: DashboardName; primary?: boolean }) {
  const active = name.status === "active";
  return (
    <div className="dash-panel" style={{ marginBottom: 10 }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", flexWrap: "wrap" }}>
        <span className="dash-code">{name.name}</span>
        {primary ? <span className="dash-meta">primary</span> : null}
        <span className={`dash-status dash-status-${active ? "success" : "info"}`} data-compact="true">
          <span className="dash-status-dot" aria-hidden="true" />
          {name.status.replaceAll("_", " ")}
        </span>
      </div>
      {name.review_tier === "protected" && name.status === "pending_review" ? (
        <p className="dash-meta" style={{ marginTop: 8 }}>
          {name.review_notes ?? PROTECTED_REVIEW_HINT}
        </p>
      ) : null}
    </div>
  );
}
