"use client";

import Link from "next/link";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate, useTrackAccess } from "@/components/dashboard/TrackGate";

export default function BusinessSettingsPage() {
  return (
    <TrackGate
      track="business"
      title="Settings are locked"
      description="Account settings unlock after business approval."
    >
      <SettingsContent />
    </TrackGate>
  );
}

function SettingsContent() {
  const { controllerWallet } = useTrackAccess("business");

  return (
    <div>
      <PageHeader
        eyebrow="Business"
        title="Settings"
        description="Controller wallet and session preferences for registry writes."
      />

      <section className="dash-card">
        <h2>Controller wallet</h2>
        <p className="dash-page-lede">
          Protocol registry mutations bind to your controller identity. Link a wallet in Privy
          to use it for identifier and destination management when API wiring ships.
        </p>
        {controllerWallet ? (
          <p>
            Linked: <span className="dash-code">{controllerWallet}</span>
          </p>
        ) : (
          <>
            <p>No wallet linked in this Privy session.</p>
            <Link className="dash-btn dash-btn-primary" href="/dashboard">
              Connect wallet via Privy
            </Link>
          </>
        )}
      </section>

      <section className="dash-card" style={{ marginTop: 16 }}>
        <h2>Session</h2>
        <p>Sign-in is managed via Privy in the console header.</p>
      </section>
    </div>
  );
}
