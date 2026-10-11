"use client";

import QRCode from "qrcode";
import { useCallback, useEffect, useState } from "react";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";

type Credential = {
  id: string;
  key_prefix: string;
  status: "ACTIVE" | "REVOKED";
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  limits: { requests_per_minute: number; requests_per_day: number };
};

type Usage = {
  requests_per_minute: number;
  requests_per_day: number;
  minute_count: number;
  day_count: number;
  minute_reset_at: string | null;
  day_reset_at: string | null;
};

type Merchant = {
  identifier: { id: string; type: string; value: string; status: string; controller: string };
  qr_payload: { resolver_url: string; type: string; value: string };
  safety: {
    testnet_chain: string;
    asset: string;
    wallet_address: string;
    token_contract: string;
    warning: string;
  };
};

type TestPayment = {
  id: string;
  transaction_hash: string;
  network: string;
  asset: string;
  amount: string;
  amount_raw: string;
  sender: string;
  recipient: string;
  timestamp: string;
  confirmation_status: string;
  testnet: boolean;
  block_number: number | null;
};

export default function FreeApiPage() {
  const [credential, setCredential] = useState<Credential | null>(null);
  const [usage, setUsage] = useState<Usage | null>(null);
  const [merchant, setMerchant] = useState<Merchant | null>(null);
  const [payments, setPayments] = useState<TestPayment[]>([]);
  const [qrDataUrl, setQrDataUrl] = useState<string | null>(null);
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [lastPaymentCheck, setLastPaymentCheck] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [paymentsLoading, setPaymentsLoading] = useState(false);
  const [busy, setBusy] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);

  const applyMerchant = useCallback(async (next: Merchant) => {
    setMerchant(next);
    setQrDataUrl(
      await QRCode.toDataURL(JSON.stringify(next.qr_payload), {
        errorCorrectionLevel: "M",
        margin: 2,
        width: 260,
      }),
    );
  }, []);

  const refreshMerchant = useCallback(async () => {
    const response = await dashboardFetch("/api/dashboard/free-api/test-merchant");
    if (!response.ok) {
      setMerchant(null);
      setQrDataUrl(null);
      const body = (await response.json().catch(() => ({}))) as { error?: string };
      throw new Error(body.error ?? "Could not load Test Merchant.");
    }
    await applyMerchant((await response.json()) as Merchant);
  }, [applyMerchant]);

  const refreshPayments = useCallback(async () => {
    setPaymentsLoading(true);
    try {
      const response = await dashboardFetch("/api/dashboard/free-api/payments");
      if (!response.ok) {
        // Merchant QR is loaded separately — do not blank the page on RPC sync failures.
        throw new Error("Could not refresh detected payments.");
      }
      const data = (await response.json()) as {
        merchant?: {
          identifier_id: string;
          identifier_value: string;
          qr_payload: { resolver_url: string; type: string; value: string };
          wallet_address: string;
          network: string;
          asset: string;
          token_contract: string;
        };
        payments: TestPayment[];
      };
      setPayments(data.payments ?? []);
      if (data.merchant) {
        await applyMerchant({
          identifier: {
            id: data.merchant.identifier_id,
            type: "custom",
            value: data.merchant.identifier_value,
            status: "active",
            controller: data.merchant.wallet_address,
          },
          qr_payload: data.merchant.qr_payload,
          safety: {
            testnet_chain: data.merchant.network,
            asset: data.merchant.asset,
            wallet_address: data.merchant.wallet_address,
            token_contract: data.merchant.token_contract,
            warning: "Only send funds after confirming the selected network and destination.",
          },
        });
      }
      setLastPaymentCheck(new Date().toISOString());
    } finally {
      setPaymentsLoading(false);
    }
  }, [applyMerchant]);

  const refresh = useCallback(async () => {
    const response = await dashboardFetch("/api/dashboard/free-api/key");
    if (!response.ok) throw new Error("Could not load Free API credentials.");
    const data = (await response.json()) as { credential: Credential | null };
    setCredential(data.credential);
    if (data.credential?.status === "ACTIVE") {
      const usageResponse = await dashboardFetch("/api/dashboard/free-api/usage");
      if (usageResponse.ok) {
        setUsage(((await usageResponse.json()) as { usage: Usage }).usage);
      }
    } else {
      setUsage(null);
    }
    // Shared Test Merchant is always shown — it does not depend on a Free API key.
    await refreshMerchant();
    void refreshPayments().catch(() => {
      // Keep merchant QR visible if the Base Sepolia scan is temporarily unavailable.
    });
  }, [refreshMerchant, refreshPayments]);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
        .catch((cause) =>
          setError(cause instanceof Error ? cause.message : "Could not load Free API."),
        )
        .finally(() => setLoading(false));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  useEffect(() => {
    const interval = window.setInterval(() => {
      void refreshPayments().catch(() => {
        // Keep the last successful payment scan visible during transient RPC failures.
      });
    }, 15_000);
    return () => window.clearInterval(interval);
  }, [refreshPayments]);

  async function runAction(action: "generate" | "regenerate" | "revoke") {
    setBusy(action);
    setError(null);
    setPlainKey(null);
    try {
      const response =
        action === "generate"
          ? await dashboardFetch("/api/dashboard/free-api/key", { method: "POST" })
          : action === "regenerate"
            ? await dashboardFetch("/api/dashboard/free-api/key", {
                method: "PATCH",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ action }),
              })
            : await dashboardFetch("/api/dashboard/free-api/key", { method: "DELETE" });
      const data = (await response.json()) as {
        error?: string;
        api_key?: string;
        credential?: Credential;
      };
      if (!response.ok) throw new Error(data.error ?? "Free API request failed.");
      if (data.api_key) setPlainKey(data.api_key);
      await refresh();
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Free API request failed.");
    } finally {
      setBusy(null);
    }
  }

  const totalReceived = payments.reduce((total, payment) => {
    const amount = Number(payment.amount);
    return Number.isFinite(amount) ? total + amount : total;
  }, 0);
  const totalReceivedLabel = totalReceived.toFixed(6).replace(/\.?0+$/, "") || "0";

  return (
    <div>
      <PageHeader
        eyebrow="Free API"
        title="Build and test with a free resolver key"
        description="Generate approval-free resolver access for prototypes and use the shared protocol Test Merchant."
      />

      <div className="dash-notice">
        Free API keys can only resolve identifiers. They cannot register, update,
        suspend, or access operator data.
      </div>

      <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
        <article className="dash-card">
          <h2>Free resolver access</h2>
          <p className="dash-meta">
            Your key is shown only when it is generated or regenerated. Rezva
            stores a hash, so copy it into your local integration immediately.
          </p>
          {credential ? (
            <div className="dash-stack" style={{ marginTop: 16 }}>
              <p>
                Status: <span className="dash-status">{credential.status}</span>
              </p>
              <p className="dash-meta">
                Prefix: <span className="dash-code">{credential.key_prefix}…</span>
              </p>
              {plainKey ? (
                <div className="dash-notice" style={{ overflowWrap: "anywhere" }}>
                  <strong>Copy this key now:</strong>
                  <br />
                  <span className="dash-code">{plainKey}</span>
                </div>
              ) : null}
              <div className="dash-card-actions">
                {credential.status === "ACTIVE" ? (
                  <>
                    <button className="dash-btn dash-btn-primary" onClick={() => runAction("regenerate")} disabled={busy !== null}>
                      {busy === "regenerate" ? "Regenerating…" : "Regenerate key"}
                    </button>
                    <button className="dash-btn dash-btn-secondary" onClick={() => runAction("revoke")} disabled={busy !== null}>
                      {busy === "revoke" ? "Revoking…" : "Revoke"}
                    </button>
                  </>
                ) : (
                  <button className="dash-btn dash-btn-primary" onClick={() => runAction("generate")} disabled={busy !== null}>
                    {busy === "generate" ? "Generating…" : "Generate new key"}
                  </button>
                )}
              </div>
            </div>
          ) : (
            <button className="dash-btn dash-btn-primary" style={{ marginTop: 16 }} onClick={() => runAction("generate")} disabled={busy !== null}>
              {busy === "generate" ? "Generating…" : "Generate free API key"}
            </button>
          )}
        </article>

        <article className="dash-card">
          <h2>Usage limits</h2>
          <p className="dash-meta">Small shared limits keep this tier safe for testing.</p>
          <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
            <div className="dash-stat">
              <span className="dash-meta">Per minute</span>
              <strong>{credential?.limits.requests_per_minute ?? 10}</strong>
              <span className="dash-meta">{usage?.minute_count ?? 0} used</span>
            </div>
            <div className="dash-stat">
              <span className="dash-meta">Per day</span>
              <strong>{credential?.limits.requests_per_day ?? 100}</strong>
              <span className="dash-meta">{usage?.day_count ?? 0} used</span>
            </div>
          </div>
          <ul className="dash-list">
            <li>Resolver access only</li>
            <li>Use the provider track for production credentials</li>
            <li>Do not commit the key to source control</li>
          </ul>
        </article>
      </div>

      <article className="dash-card" style={{ marginTop: 16 }}>
        <h2>Test Merchant</h2>
        <p className="dash-meta">
          All developers see the same persistent protocol demo identifier,
          payment destination, and QR code. Scan it from a wallet that uses the
          public Rezva resolve API.
        </p>
        {merchant ? (
          <div className="dash-grid dash-grid-2" style={{ marginTop: 20 }}>
            <div className="dash-stack">
              {qrDataUrl ? (
                // eslint-disable-next-line @next/next/no-img-element
                <img src={qrDataUrl} alt="Test Merchant resolver QR code" width={260} height={260} />
              ) : null}
              <p className="dash-meta">
                Scan this QR from an integrated wallet. It always resolves to
                the shared protocol demo destination via the public API.
              </p>
            </div>
            <div className="dash-stack">
              <p>
                Identifier: <span className="dash-code">{merchant.identifier.value}</span>
              </p>
              <div className="dash-stat">
                <span className="dash-meta">Currency to add</span>
                <strong>{merchant.safety.asset}</strong>
                <span className="dash-meta">Network: {merchant.safety.testnet_chain}</span>
                <span className="dash-meta">Sender gas: Base Sepolia ETH</span>
              </div>
              <div className="dash-stat">
                <span className="dash-meta">Recipient wallet address</span>
                <span className="dash-code" style={{ overflowWrap: "anywhere" }}>
                  {merchant.safety.wallet_address}
                </span>
              </div>
              <div className="dash-stat">
                <span className="dash-meta">USDC token contract</span>
                <span className="dash-code" style={{ overflowWrap: "anywhere" }}>
                  {merchant.safety.token_contract}
                </span>
              </div>
              <pre className="dash-code" style={{ whiteSpace: "pre-wrap", overflowWrap: "anywhere" }}>
                {JSON.stringify(merchant.qr_payload, null, 2)}
              </pre>
              <div className="dash-notice">
                <strong>Protocol test merchant:</strong> send only testnet{" "}
                <span className="dash-code">{merchant.safety.asset}</span> on{" "}
                <span className="dash-code">{merchant.safety.testnet_chain}</span>.
                This is not a real merchant. Confirm the token contract and
                recipient before sending.
              </div>
            </div>
          </div>
        ) : (
          <div className="dash-notice" style={{ marginTop: 16 }}>
            {loading
              ? "Loading shared Test Merchant…"
              : "Shared Test Merchant is not configured in this registry environment."}
          </div>
        )}
        {error ? <p className="dash-error" style={{ marginTop: 16 }}>{error}</p> : null}
      </article>

      <article className="dash-card" style={{ marginTop: 16 }}>
        <h2>Detected payments</h2>
        <p className="dash-meta">
          The dashboard automatically scans recent Base Sepolia{" "}
          {merchant?.safety.asset ?? "USDC"} transfers to the shared wallet and
          refreshes every 15 seconds. Confirmed transfers appear below with the
          amount received.
          {merchant?.safety.wallet_address ? (
            <>
              <br />
              BaseScan URL:{" "}
              <a
                href={`https://sepolia.basescan.org/address/${merchant.safety.wallet_address}`}
                target="_blank"
                rel="noreferrer"
                style={{ overflowWrap: "anywhere" }}
              >
                https://sepolia.basescan.org/address/{merchant.safety.wallet_address}
              </a>
            </>
          ) : null}
        </p>
        <div className="dash-grid dash-grid-2" style={{ marginTop: 16 }}>
          <div className="dash-stat">
            <span className="dash-meta">Total received</span>
            <strong>{totalReceivedLabel} {merchant?.safety.asset ?? "USDC"}</strong>
            <span className="dash-meta">Base Sepolia testnet</span>
          </div>
          <div className="dash-stat">
            <span className="dash-meta">Confirmed payments</span>
            <strong>{payments.length}</strong>
            <span className="dash-meta">
              {paymentsLoading
                ? "Scanning ledger…"
                : lastPaymentCheck
                  ? `Last checked ${new Date(lastPaymentCheck).toLocaleTimeString()}`
                  : "Waiting for first scan"}
            </span>
          </div>
        </div>
        {payments.length ? (
          <div className="dash-table-wrap" style={{ marginTop: 20 }}>
            <table className="dash-table">
              <thead>
                <tr>
                  <th>Received</th>
                  <th>Network</th>
                  <th>Sender</th>
                  <th>Recipient</th>
                  <th>Block</th>
                  <th>Time</th>
                  <th>Transaction</th>
                </tr>
              </thead>
              <tbody>
                {payments.map((payment) => (
                  <tr key={payment.transaction_hash}>
                    <td>
                      <strong>{payment.amount} {payment.asset}</strong>
                      <br />
                      <span className="dash-meta">{payment.confirmation_status}</span>
                    </td>
                    <td>
                      {payment.network}
                      <br />
                      <span className="dash-meta">
                        {payment.testnet ? "testnet" : "mainnet"}
                      </span>
                    </td>
                    <td>
                      <span className="dash-code" title={payment.sender}>
                        {payment.sender.slice(0, 10)}…{payment.sender.slice(-8)}
                      </span>
                    </td>
                    <td>
                      <span className="dash-code" title={payment.recipient}>
                        {payment.recipient.slice(0, 10)}…{payment.recipient.slice(-8)}
                      </span>
                    </td>
                    <td>{payment.block_number ?? "-"}</td>
                    <td>{new Date(payment.timestamp).toLocaleString()}</td>
                    <td>
                      <a
                        href={`https://sepolia.basescan.org/tx/${payment.transaction_hash}`}
                        target="_blank"
                        rel="noreferrer"
                      >
                        BaseScan
                      </a>
                      <br />
                      <span className="dash-code" title={payment.transaction_hash}>
                        {payment.transaction_hash.slice(0, 10)}…
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <p className="dash-meta" style={{ marginTop: 16 }}>
            {paymentsLoading || loading
              ? "Rebuilding the payment ledger from Base Sepolia / BaseScan…"
              : "No confirmed payments detected in the shared Test Merchant ledger yet."}
          </p>
        )}
      </article>
    </div>
  );
}
