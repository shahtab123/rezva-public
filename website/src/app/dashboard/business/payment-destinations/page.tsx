"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import { IdentifierLabel } from "@/components/dashboard/IdentifierLabel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentDestinationFields } from "@/components/dashboard/PaymentDestinationFields";
import { TrackGate, useTrackAccess } from "@/components/dashboard/TrackGate";
import {
  updateIdentifierDestinations,
  useRegistryIdentifiers,
  type DashboardIdentifier,
} from "@/lib/dashboard/registry-hooks";
import { formatIdentifierSummary } from "@/lib/dashboard/identifier-display";
import {
  DEFAULT_PAYMENT_ASSET,
  DEFAULT_PAYMENT_NETWORK,
  getPaymentNetwork,
  normalizePaymentOption,
  resolvePaymentSelection,
} from "@/lib/dashboard/payment-options";

export default function BusinessPaymentDestinationsPage() {
  return (
    <TrackGate
      track="business"
      title="Payment destinations are locked"
      description="Destination management unlocks after business approval."
    >
      <DestinationsContent />
    </TrackGate>
  );
}

function DestinationsContent() {
  const { controllerWallet } = useTrackAccess("business");
  const { identifiers, loading, error, refresh } = useRegistryIdentifiers(controllerWallet);
  const [selectedId, setSelectedId] = useState("");
  const [chain, setChain] = useState(DEFAULT_PAYMENT_NETWORK.id);
  const [asset, setAsset] = useState(DEFAULT_PAYMENT_ASSET.symbol);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);

  const selected = useMemo(
    () => identifiers.find((item) => item.id === selectedId) ?? null,
    [identifiers, selectedId],
  );

  useEffect(() => {
    if (!identifiers.length) return;
    if (!selectedId || !identifiers.some((item) => item.id === selectedId)) {
      setSelectedId(identifiers[0]!.id);
    }
  }, [identifiers, selectedId]);

  useEffect(() => {
    if (!selected) return;
    const existing = selected.payment_options?.[0];
    if (existing) {
      const knownNetwork = getPaymentNetwork(existing.chain);
      const chainId = knownNetwork?.id ?? DEFAULT_PAYMENT_NETWORK.id;
      const assetSymbol =
        knownNetwork?.assets.find(
          (item) => item.symbol.toUpperCase() === existing.asset.toUpperCase(),
        )?.symbol ??
        knownNetwork?.assets[0]?.symbol ??
        DEFAULT_PAYMENT_ASSET.symbol;
      setChain(chainId);
      setAsset(assetSymbol);
      setAddress(existing.address);
      return;
    }
    setChain(DEFAULT_PAYMENT_NETWORK.id);
    setAsset(DEFAULT_PAYMENT_ASSET.symbol);
    setAddress(controllerWallet ?? "");
  }, [selected, controllerWallet]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    setSaved(false);
    if (!controllerWallet || !selected) {
      setFormError("Select an identifier first.");
      return;
    }
    if (!address.trim()) {
      setFormError("Choose the wallet that should receive payments.");
      return;
    }
    const selection = resolvePaymentSelection(chain, asset);
    if (!selection) {
      setFormError("Choose a supported network and currency.");
      return;
    }
    const paymentOption = normalizePaymentOption({
      ...selection,
      address: address.trim(),
    });
    if (!paymentOption) {
      setFormError("Could not build a payment destination.");
      return;
    }
    setBusy(true);
    try {
      await updateIdentifierDestinations(controllerWallet, selected.id, [paymentOption]);
      setSaved(true);
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Update failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Payment destinations"
        description="Choose which network and currency people use to pay each identifier."
      />

      {loading ? (
        <p className="dash-meta">Loading identifiers…</p>
      ) : error ? (
        <p className="dash-field-error is-visible">{error}</p>
      ) : identifiers.length === 0 ? (
        <div className="dash-notice">
          Register an identifier first on the Identifiers page. Your wallet and payment
          currency are set there, then you can change them here anytime.
        </div>
      ) : (
        <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
          <form className="dash-card" onSubmit={onSubmit}>
            <h2>Update payment details</h2>
            <p className="dash-meta" style={{ marginTop: 8 }}>
              Pick an identifier, confirm the network and currency, and keep your
              receiving wallet. Technical wallet fields are filled in for you.
            </p>
            <label className="dash-field is-wide" style={{ marginTop: 12 }}>
              <span className="dash-field-label">Identifier</span>
              <select
                value={selectedId}
                onChange={(e) => {
                  setSaved(false);
                  setSelectedId(e.target.value);
                }}
                required
              >
                {identifiers.map((item) => (
                  <option key={item.id} value={item.id}>
                    {formatIdentifierSummary({
                      businessName: item.business_name,
                      type: item.type,
                      value: item.value,
                    })}
                  </option>
                ))}
              </select>
            </label>
            <PaymentDestinationFields
              values={{ chain, asset, address }}
              onChange={(next) => {
                setSaved(false);
                setChain(next.chain);
                setAsset(next.asset);
                setAddress(next.address);
              }}
              disabled={busy}
              addressHint="Already filled from this identifier. Change only if payments should go somewhere else."
            />
            {formError ? <p className="dash-field-error is-visible">{formError}</p> : null}
            {saved ? (
              <p className="dash-meta" style={{ marginTop: 12 }}>
                Saved. Wallets that resolve this identifier will see the updated payment
                details.
              </p>
            ) : null}
            <div className="dash-card-actions">
              <button type="submit" className="dash-btn dash-btn-primary" disabled={busy}>
                {busy ? "Saving…" : "Save"}
              </button>
            </div>
          </form>

          <article className="dash-card">
            <h2>Current destinations</h2>
            <DestinationList identifiers={identifiers} />
          </article>
        </div>
      )}
    </div>
  );
}

function DestinationList({ identifiers }: { identifiers: DashboardIdentifier[] }) {
  const rows = identifiers.flatMap((identifier) =>
    (identifier.payment_options ?? []).map((dest, index) => ({
      key: `${identifier.id}-${index}`,
      identifier,
      ...dest,
      status: identifier.status,
      networkLabel:
        getPaymentNetwork(dest.chain)?.label ?? dest.chain,
    })),
  );

  if (rows.length === 0) {
    return (
      <p className="dash-meta" style={{ marginTop: 12 }}>
        No destinations configured yet.
      </p>
    );
  }

  return (
    <div className="dash-table-wrap" style={{ marginTop: 12 }}>
      <table className="dash-table">
        <thead>
          <tr>
            <th>Identifier</th>
            <th>Network</th>
            <th>Currency</th>
            <th>Receives to</th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => (
            <tr key={row.key}>
              <td>
                <IdentifierLabel identifier={row.identifier} />
              </td>
              <td>
                {row.networkLabel}
                <br />
                <span className="dash-meta">{row.network_identifier ?? "-"}</span>
              </td>
              <td>
                {row.asset}
                <br />
                <span className="dash-meta">
                  {row.token_contract ? "Token" : "Native"}
                </span>
              </td>
              <td>
                <span className="dash-code" style={{ overflowWrap: "anywhere" }}>
                  {row.address}
                </span>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
