"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { useNamespaceState } from "@/components/dashboard/NamespaceStateProvider";
import {
  canApplyForNamespace,
  formatNamespaceDot,
  registrationPolicyLabels,
  type NamespaceRegistrationPolicy,
} from "@/components/dashboard/namespace-types";

function parseReservedNames(text: string): string[] {
  return text
    .split(/[,\n]/)
    .map((part) => part.trim().toLowerCase().replace(/[^a-z0-9-]/g, ""))
    .filter(Boolean);
}

export default function NamespaceApplyPage() {
  return (
    <TrackGate
      track="provider"
      title="Namespaces are locked"
      description="Provider namespaces unlock after wallet provider approval."
    >
      <ApplyForm />
    </TrackGate>
  );
}

function ApplyForm() {
  const router = useRouter();
  const { ready, state, submitNamespaceApplication } = useNamespaceState();
  const [slug, setSlug] = useState("");
  const [description, setDescription] = useState("");
  const [policy, setPolicy] =
    useState<NamespaceRegistrationPolicy>("provider_managed_pricing");
  const [reservedText, setReservedText] = useState("support, admin, official");
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  if (!ready) {
    return <div className="dash-panel">Loading…</div>;
  }

  if (!canApplyForNamespace(state)) {
    return (
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Apply for namespace"
          description="You already have a namespace under review or active."
        />
        <div className="dash-notice">
          Manage your existing namespace from the Namespaces page.
        </div>
        <Link className="dash-btn dash-btn-secondary" href="/dashboard/provider/namespaces">
          Back to namespaces
        </Link>
      </div>
    );
  }

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setBusy(true);
    setError(null);
    const result = await submitNamespaceApplication({
      slug,
      description,
      registrationPolicy: policy,
      reservedNames: parseReservedNames(reservedText),
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    router.push("/dashboard/provider/namespaces");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Wallet provider"
        title="Apply for namespace"
        description="Request a payment namespace for your wallet. Pricing, user accounts, and checkout stay in your app - we only register and resolve names."
      />

      <form className="dash-apply-form dash-apply-sheet" onSubmit={onSubmit}>
        <div className="dash-apply-form-group">
          <h3>Namespace</h3>
          <div className="dash-form-grid">
            <label className="dash-field is-wide">
              <span className="dash-field-label">
                Namespace slug
                <span className="dash-field-required" aria-hidden="true">
                  *
                </span>
              </span>
              <input
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="redotpay"
                autoComplete="off"
                required
              />
              <span className="dash-field-hint">
                Public form:{" "}
                <span className="dash-code">
                  {slug.trim()
                    ? formatNamespaceDot(slug)
                    : ".yourwallet"}
                </span>{" "}
                - names become{" "}
                <span className="dash-code">
                  user
                  {slug.trim() ? formatNamespaceDot(slug) : ".yourwallet"}
                </span>
              </span>
            </label>

            <label className="dash-field is-wide">
              <span className="dash-field-label">Description</span>
              <textarea
                rows={3}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Wallet product and how names will be used"
              />
              <span className="dash-field-hint">
                Shown in your namespace management console - not a customer-facing listing.
              </span>
            </label>

            <label className="dash-field is-wide is-select">
              <span className="dash-field-label">
                Registration policy
                <span className="dash-field-required" aria-hidden="true">
                  *
                </span>
              </span>
              <span className="dash-select-wrap">
                <select
                  value={policy}
                  onChange={(e) =>
                    setPolicy(e.target.value as NamespaceRegistrationPolicy)
                  }
                  required
                >
                  {(
                    Object.entries(registrationPolicyLabels) as [
                      NamespaceRegistrationPolicy,
                      string,
                    ][]
                  ).map(([value, label]) => (
                    <option key={value} value={value}>
                      {label}
                    </option>
                  ))}
                </select>
              </span>
              <span className="dash-field-hint">
                Declares how your app issues names. Actual pricing and checkout run
                on your side.
              </span>
            </label>

            <label className="dash-field is-wide">
              <span className="dash-field-label">Reserved names</span>
              <textarea
                rows={2}
                value={reservedText}
                onChange={(e) => setReservedText(e.target.value)}
                placeholder="support, admin, official"
              />
              <span className="dash-field-hint">
                Comma-separated labels blocked from public claim in your policy
                (registry-level reserve).
              </span>
            </label>
          </div>
        </div>

        {error ? <p className="dash-field-error is-visible">{error}</p> : null}

        <div className="dash-apply-form-footer">
          <p>
            You will register names via the provider API after approval. No
            customer database is created here.
          </p>
          <div className="dash-card-actions">
            <Link
              className="dash-btn dash-btn-secondary"
              href="/dashboard/provider/namespaces"
            >
              Cancel
            </Link>
            <button
              type="submit"
              className="dash-btn dash-btn-primary"
              disabled={busy}
            >
              {busy ? "Submitting…" : "Submit application"}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
