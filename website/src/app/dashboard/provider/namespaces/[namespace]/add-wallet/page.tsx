"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { useState, type FormEvent } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentDestinationFields } from "@/components/dashboard/PaymentDestinationFields";
import { TrackGate } from "@/components/dashboard/TrackGate";
import { useNamespaceState } from "@/components/dashboard/NamespaceStateProvider";
import {
  formatNamespaceDot,
  isNamespaceActive,
} from "@/components/dashboard/namespace-types";
import {
  DEFAULT_PAYMENT_ASSET,
  DEFAULT_PAYMENT_NETWORK,
} from "@/lib/dashboard/payment-options";

export default function AddWalletNamePage() {
  return (
    <TrackGate
      track="provider"
      title="Namespaces are locked"
      description="Provider namespaces unlock after wallet provider approval."
    >
      <AddWalletContent />
    </TrackGate>
  );
}

function AddWalletContent() {
  const params = useParams<{ namespace: string }>();
  const slug = String(params.namespace ?? "");
  const { ready, getNamespace, registerWalletName } = useNamespaceState();
  const ns = getNamespace(slug);
  const [label, setLabel] = useState("example");
  const [chain, setChain] = useState(DEFAULT_PAYMENT_NETWORK.id);
  const [asset, setAsset] = useState(DEFAULT_PAYMENT_ASSET.symbol);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

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
          title={`Add wallet · ${formatNamespaceDot(ns.slug)}`}
          description="Add a payable name after the namespace is active."
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

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setMessage(null);
    setError(null);
    setBusy(true);
    const result = await registerWalletName(ns!.slug, {
      label,
      address,
      chain,
      asset,
    });
    setBusy(false);
    if (!result.ok) {
      setError(result.error);
      return;
    }
    setMessage(`Added ${result.fullName}. Resolve it in the wallet as type provider_name.`);
    setLabel("");
  }

  return (
    <div>
      <PageHeader
        eyebrow="Wallet provider"
        title={`Add wallet · ${formatNamespaceDot(ns.slug)}`}
        description="Register a test name and receiving wallet so you can resolve it from a client wallet."
        actions={
          <Link
            className="dash-btn dash-btn-secondary"
            href={`/dashboard/provider/namespaces/${ns.slug}/names`}
          >
            View names
          </Link>
        }
      />

      <div className="dash-notice">
        Production wallets register names through the provider API after the user
        authorizes in your app. This form is for local testing.
      </div>

      <form className="dash-card" style={{ marginTop: 16, maxWidth: 560 }} onSubmit={onSubmit}>
        <h2>Test wallet name</h2>
        <label className="dash-field is-wide" style={{ marginTop: 12 }}>
          <span className="dash-field-label">Name</span>
          <span className="dash-inline-actions">
            <input
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="example"
              autoComplete="off"
              disabled={busy}
            />
            <span className="dash-code">{formatNamespaceDot(ns.slug)}</span>
          </span>
          <span className="dash-meta" style={{ marginTop: 6 }}>
            Resolves as{" "}
            <span className="dash-code">
              {`${label.trim().toLowerCase() || "example"}.${ns.slug}`}
            </span>
          </span>
        </label>

        <PaymentDestinationFields
          values={{ chain, asset, address }}
          onChange={(next) => {
            setChain(next.chain);
            setAsset(next.asset);
            setAddress(next.address);
          }}
          disabled={busy}
          addressHint="Wallet that should receive payments for this name."
        />

        {error ? <p className="dash-field-error is-visible">{error}</p> : null}
        {message ? <p className="dash-meta" style={{ marginTop: 12 }}>{message}</p> : null}

        <div className="dash-card-actions">
          <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
            {busy ? "Adding…" : "Add wallet"}
          </button>
        </div>
      </form>
    </div>
  );
}
