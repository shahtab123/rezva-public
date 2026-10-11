"use client";

import { useMemo } from "react";
import {
  getPaymentNetwork,
  PAYMENT_NETWORKS,
  resolvePaymentSelection,
} from "@/lib/dashboard/payment-options";

export type PaymentDestinationValues = {
  chain: string;
  asset: string;
  address: string;
};

export function PaymentDestinationFields({
  values,
  onChange,
  disabled,
  addressHint,
}: {
  values: PaymentDestinationValues;
  onChange: (next: PaymentDestinationValues) => void;
  disabled?: boolean;
  addressHint?: string;
}) {
  const network = getPaymentNetwork(values.chain) ?? PAYMENT_NETWORKS[0]!;
  const assets = network.assets;
  const selectedAsset =
    assets.find((item) => item.symbol === values.asset) ?? assets[0]!;
  const resolved = useMemo(
    () => resolvePaymentSelection(network.id, selectedAsset.symbol),
    [network.id, selectedAsset.symbol],
  );

  function setChain(chain: string) {
    const nextNetwork = getPaymentNetwork(chain) ?? PAYMENT_NETWORKS[0]!;
    const nextAsset = nextNetwork.assets[0]!;
    onChange({
      ...values,
      chain: nextNetwork.id,
      asset: nextAsset.symbol,
    });
  }

  function setAsset(asset: string) {
    onChange({ ...values, asset });
  }

  return (
    <>
      <label className="dash-field is-wide">
        <span className="dash-field-label">Network</span>
        <select
          value={network.id}
          onChange={(e) => setChain(e.target.value)}
          disabled={disabled}
        >
          {PAYMENT_NETWORKS.map((item) => (
            <option key={item.id} value={item.id}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dash-field is-wide">
        <span className="dash-field-label">Currency</span>
        <select
          value={selectedAsset.symbol}
          onChange={(e) => setAsset(e.target.value)}
          disabled={disabled}
        >
          {assets.map((item) => (
            <option key={item.symbol} value={item.symbol}>
              {item.label}
            </option>
          ))}
        </select>
      </label>

      <label className="dash-field is-wide">
        <span className="dash-field-label">Wallet that receives payments</span>
        <input
          value={values.address}
          onChange={(e) => onChange({ ...values, address: e.target.value })}
          placeholder="0x…"
          disabled={disabled}
        />
        {addressHint ? <span className="dash-meta">{addressHint}</span> : null}
      </label>

      <div className="dash-notice" style={{ marginTop: 4 }}>
        <p className="dash-meta" style={{ margin: 0 }}>
          Filled in for wallets automatically:
        </p>
        <p className="dash-meta" style={{ marginTop: 6 }}>
          Network ID:{" "}
          <span className="dash-code">{resolved?.network_identifier ?? "-"}</span>
        </p>
        <p className="dash-meta" style={{ marginTop: 4 }}>
          Token contract:{" "}
          <span className="dash-code" style={{ overflowWrap: "anywhere" }}>
            {resolved?.token_contract || "Native asset (no contract)"}
          </span>
        </p>
      </div>
    </>
  );
}
