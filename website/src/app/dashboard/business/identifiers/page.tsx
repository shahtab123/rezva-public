"use client";

import { useEffect, useMemo, useState, type FormEvent } from "react";
import Link from "next/link";
import { IdentifierLabel } from "@/components/dashboard/IdentifierLabel";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { PaymentDestinationFields } from "@/components/dashboard/PaymentDestinationFields";
import { TrackGate, useTrackAccess } from "@/components/dashboard/TrackGate";
import {
  canRegisterDashboardIdentifier,
  countDashboardIdentifiers,
  DASHBOARD_MAX_IDENTIFIERS,
  dashboardIdentifierLimitMessage,
} from "@/lib/dashboard/identifier-limits";
import {
  registerRegistryIdentifier,
  useRegistryIdentifiers,
} from "@/lib/dashboard/registry-hooks";
import {
  describeRegistrationSafetyPolicy,
  getRegistrationSafetySeconds,
  pendingActivationLabel,
} from "@/lib/dashboard/registration-safety";
import {
  DEFAULT_PAYMENT_ASSET,
  DEFAULT_PAYMENT_NETWORK,
  normalizePaymentOption,
  resolvePaymentSelection,
} from "@/lib/dashboard/payment-options";

const IDENTIFIER_TYPES = [
  "phone",
  "email",
  "bangla_qr",
  "paypal",
  "bkash",
  "merchant_id",
  "custom",
] as const;

export default function BusinessIdentifiersPage() {
  return (
    <TrackGate
      track="business"
      title="Identifiers are locked"
      description="Identifier registration unlocks after business approval."
    >
      <IdentifiersContent />
    </TrackGate>
  );
}

function IdentifiersContent() {
  const { controllerWallet } = useTrackAccess("business");
  const { identifiers, loading, error, refresh } = useRegistryIdentifiers(controllerWallet);
  const [type, setType] = useState<(typeof IDENTIFIER_TYPES)[number]>("email");
  const [value, setValue] = useState("");
  const [chain, setChain] = useState(DEFAULT_PAYMENT_NETWORK.id);
  const [asset, setAsset] = useState(DEFAULT_PAYMENT_ASSET.symbol);
  const [address, setAddress] = useState("");
  const [busy, setBusy] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (controllerWallet) {
      setAddress((current) => current || controllerWallet);
    }
  }, [controllerWallet]);

  const counted = useMemo(
    () => countDashboardIdentifiers(identifiers),
    [identifiers],
  );
  const canRegister = canRegisterDashboardIdentifier(identifiers);
  const overLegacyLimit = counted > DASHBOARD_MAX_IDENTIFIERS;

  const hasPendingIdentifiers = useMemo(
    () =>
      identifiers.some(
        (row) => row.status === "pending" || row.status === "update_pending",
      ),
    [identifiers],
  );

  const missingBusinessName = useMemo(
    () => identifiers.length > 0 && identifiers.every((row) => !row.business_name),
    [identifiers],
  );

  useEffect(() => {
    if (!hasPendingIdentifiers) return;
    const interval = window.setInterval(() => {
      void refresh();
    }, getRegistrationSafetySeconds() <= 0 ? 3_000 : 30_000);
    return () => window.clearInterval(interval);
  }, [hasPendingIdentifiers, refresh]);

  async function onSubmit(event: FormEvent) {
    event.preventDefault();
    setFormError(null);
    if (!controllerWallet) {
      setFormError("Link a controller wallet before registering identifiers.");
      return;
    }
    if (!canRegister) {
      setFormError(dashboardIdentifierLimitMessage(counted));
      return;
    }
    if (!value.trim()) {
      setFormError("Enter an identifier value.");
      return;
    }
    if (!address.trim()) {
      setFormError("Choose the wallet that should receive payments.");
      return;
    }
    if (!/^0x[a-fA-F0-9]{40}$/.test(address.trim())) {
      setFormError("Enter a valid EVM receiving address (0x…, 40 hex characters).");
      return;
    }
    const selection = resolvePaymentSelection(chain, asset);
    if (!selection) {
      setFormError("Choose a supported network and currency.");
      return;
    }
    setBusy(true);
    try {
      const paymentOption = normalizePaymentOption({
        ...selection,
        address: address.trim(),
      });
      if (!paymentOption) {
        setFormError("Could not build a payment destination.");
        setBusy(false);
        return;
      }
      await registerRegistryIdentifier(controllerWallet, {
        type,
        value: value.trim(),
        payment_options: [paymentOption],
      });
      setValue("");
      await refresh();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : "Registration failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div>
      <PageHeader
        eyebrow="Business / Users"
        title="Identifiers"
        description="Create an email, phone, or other identifier people can pay. Compatible wallets that integrate Rezva resolve can look it up. Dashboard accounts can register up to two identifiers."
      />

      <div className="dash-notice" style={{ marginTop: 16 }}>
        <strong>Registration safety period</strong>
        <p className="dash-meta" style={{ marginTop: 8 }}>
          {describeRegistrationSafetyPolicy()} While pending, wallets cannot treat the
          identifier as payment-ready. No admin approval is required.
        </p>
      </div>

      <div className="dash-notice" style={{ marginTop: 16 }}>
        <strong>
          Limit: {counted}/{DASHBOARD_MAX_IDENTIFIERS} via dashboard
          {overLegacyLimit ? " (existing identifiers kept)" : ""}
        </strong>
        <p className="dash-meta" style={{ marginTop: 8 }}>
          {overLegacyLimit
            ? dashboardIdentifierLimitMessage(counted)
            : `Business / Users dashboard registrations are capped at ${DASHBOARD_MAX_IDENTIFIERS}. Wallet providers that offer Merchant Setup set their own per-controller limits — see the docs.`}{" "}
          <Link href="/docs/for-merchants/register-an-identifier">Read identifier limits</Link>.
        </p>
      </div>

      {missingBusinessName ? (
        <div className="dash-notice" style={{ marginTop: 16 }}>
          <strong>Claim a name first</strong>
          <p className="dash-meta" style={{ marginTop: 8 }}>
            Wallets show your Profile / Name as the merchant title. Without it,
            payers only see the identifier (for example your email address).
          </p>
        </div>
      ) : null}

      <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
        {canRegister ? (
          <form className="dash-card" onSubmit={onSubmit}>
            <h2>Register identifier</h2>
            <p className="dash-meta" style={{ marginTop: 8 }}>
              {counted} of {DASHBOARD_MAX_IDENTIFIERS} used. Pick the receiving
              wallet that should get paid when someone resolves this identifier.
            </p>
            <label className="dash-field is-wide" style={{ marginTop: 12 }}>
              <span className="dash-field-label">Type</span>
              <select value={type} onChange={(e) => setType(e.target.value as typeof type)}>
                {IDENTIFIER_TYPES.map((item) => (
                  <option key={item} value={item}>
                    {item}
                  </option>
                ))}
              </select>
            </label>
            <label className="dash-field is-wide">
              <span className="dash-field-label">Value</span>
              <input
                value={value}
                onChange={(e) => setValue(e.target.value)}
                placeholder={
                  type === "bangla_qr"
                    ? "Paste the full QR text"
                    : type === "phone"
                      ? "e.g. +8801840123456"
                      : type === "email"
                        ? "e.g. ops@example.com"
                        : type === "custom"
                          ? "Any label, link, or handle"
                          : type === "paypal"
                            ? "e.g. shopname"
                            : "Identifier value"
                }
                disabled={!controllerWallet || busy}
              />
            </label>
            {type === "bangla_qr" ? (
              <p className="dash-meta">
                Paste the full QR string. Resolve matches that same string.
              </p>
            ) : null}
            {type === "custom" ? (
              <p className="dash-meta">
                Free-form value (URL, handle, shop code, etc.). Only raw crypto
                addresses and names like <code>name.eth</code> are blocked.
              </p>
            ) : null}

            <p className="dash-meta" style={{ marginTop: 16 }}>
              How should people pay this identifier?
            </p>
            <PaymentDestinationFields
              values={{ chain, asset, address }}
              onChange={(next) => {
                setChain(next.chain);
                setAsset(next.asset);
                setAddress(next.address);
              }}
              disabled={!controllerWallet || busy}
              addressHint="Defaults to your linked controller wallet."
            />

            {formError ? <p className="dash-field-error is-visible">{formError}</p> : null}
            <div className="dash-card-actions">
              <button
                type="submit"
                className="dash-btn dash-btn-primary"
                disabled={!controllerWallet || busy}
              >
                {busy ? "Registering…" : "Register"}
              </button>
            </div>
          </form>
        ) : (
          <article className="dash-card">
            <h2>Register identifier</h2>
            <p className="dash-meta" style={{ marginTop: 12 }}>
              {loading
                ? "Loading…"
                : dashboardIdentifierLimitMessage(counted)}
            </p>
            <div className="dash-card-actions">
              <Link className="dash-btn dash-btn-secondary" href="/docs/for-merchants/register-an-identifier">
                View limits in docs
              </Link>
            </div>
          </article>
        )}

        <article className="dash-card">
          <h2>Registered identifiers</h2>
          {loading ? (
            <p className="dash-meta" style={{ marginTop: 12 }}>
              Loading…
            </p>
          ) : error ? (
            <p className="dash-field-error is-visible">{error}</p>
          ) : identifiers.length === 0 ? (
            <p className="dash-meta" style={{ marginTop: 12 }}>
              No identifiers yet. Register one to get started.
            </p>
          ) : (
            <div className="dash-table-wrap" style={{ marginTop: 12 }}>
              <table className="dash-table">
                <thead>
                  <tr>
                    <th>Business / identifier</th>
                    <th>Status</th>
                    <th>Pays with</th>
                  </tr>
                </thead>
                <tbody>
                  {identifiers.map((row) => {
                    const activationHint = pendingActivationLabel(
                      row.status,
                      row.pending_activation_at,
                    );
                    const destination = row.payment_options?.[0];
                    return (
                      <tr key={row.id}>
                        <td>
                          <IdentifierLabel identifier={row} />
                        </td>
                        <td>
                          <span className="dash-status">{row.status}</span>
                          {activationHint ? (
                            <>
                              <br />
                              <span className="dash-meta">{activationHint}</span>
                            </>
                          ) : row.status === "active" ? (
                            <>
                              <br />
                              <span className="dash-meta">Payment-ready</span>
                            </>
                          ) : null}
                        </td>
                        <td>
                          {destination ? (
                            <>
                              {destination.asset} on {destination.chain}
                              <br />
                              <span
                                className="dash-code"
                                style={{ overflowWrap: "anywhere" }}
                              >
                                {destination.address.slice(0, 10)}…
                              </span>
                            </>
                          ) : (
                            "-"
                          )}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </article>
      </div>
    </div>
  );
}
