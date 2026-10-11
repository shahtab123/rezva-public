"use client";

import * as Tabs from "@radix-ui/react-tabs";
import {
  CheckCircle2,
  Code2,
  Settings2,
  ShieldCheck,
  WalletCards,
} from "lucide-react";

const modes = {
  resolver: {
    icon: Code2,
    eyebrow: "Smallest start",
    title: "Look up only",
    description:
      "Add name and QR lookup to the send screen you already have. You still build and sign payments yourself.",
    capabilities: [
      "Look up phones, QR codes, emails, and wallet names",
      "Show who they are paying and how",
      "Keep your current confirm and send flow",
      "No need to build a merchant signup UI",
    ],
    endpoint: "POST /v1/resolve",
    response: "payment_options[]",
    fit: "Best if you just want users to pay with familiar names.",
  },
  setup: {
    icon: Settings2,
    eyebrow: "Full wallet product",
    title: "Look up + merchant setup",
    description:
      "Same lookup, plus tools so shops can register names and payment destinations inside your wallet.",
    capabilities: [
      "Everything in Look up only",
      "Help shops register names and QR codes",
      "Let them set where money should arrive",
      "Support updates and status in your UI",
    ],
    endpoint: "POST /v1/identifiers",
    response: "controller_authorization",
    fit: "Best if shops should onboard without leaving your app.",
  },
} as const;

function ModeContent({ mode }: { mode: keyof typeof modes }) {
  const data = modes[mode];
  const ModeIcon = data.icon;

  return (
    <Tabs.Content className="wallet-tab-content" value={mode}>
      <div className="wallet-mode-heading">
        <span className="wallet-mode-icon">
          <ModeIcon aria-hidden="true" />
        </span>
        <div>
          <small>{data.eyebrow}</small>
          <h3>{data.title}</h3>
        </div>
        <span className="wallet-scope">
          <ShieldCheck aria-hidden="true" />
          Scoped access
        </span>
      </div>

      <p className="wallet-mode-description">{data.description}</p>

      <div className="wallet-capabilities">
        {data.capabilities.map((capability) => (
          <div key={capability}>
            <CheckCircle2 aria-hidden="true" />
            <span>{capability}</span>
          </div>
        ))}
      </div>

      <div className="wallet-api-preview">
        <div>
          <span />
          <span />
          <span />
          <small>Integration surface</small>
        </div>
        <code>
          <b>{data.endpoint}</b>
          <span>{data.response}</span>
        </code>
      </div>

      <div className="wallet-mode-footer">
        <p>
          <strong>Best for</strong>
          {data.fit}
        </p>
      </div>
    </Tabs.Content>
  );
}

export function WalletIntegrationPanel() {
  return (
    <div className="wallet-config-card">
      <div className="wallet-config-header">
        <div>
          <span className="wallet-header-icon">
            <WalletCards aria-hidden="true" />
          </span>
          <div>
            <small>For wallet apps</small>
            <strong>How deep do you want to integrate?</strong>
          </div>
        </div>
        <span className="wallet-availability">Approved access</span>
      </div>

      <Tabs.Root className="wallet-tabs" defaultValue="resolver">
        <Tabs.List className="wallet-tabs-list" aria-label="Integration level">
          <Tabs.Trigger value="resolver">Look up only</Tabs.Trigger>
          <Tabs.Trigger value="setup">Look up + setup</Tabs.Trigger>
        </Tabs.List>
        <ModeContent mode="resolver" />
        <ModeContent mode="setup" />
      </Tabs.Root>
    </div>
  );
}
