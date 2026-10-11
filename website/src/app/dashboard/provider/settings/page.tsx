"use client";

import { EmptyState } from "@/components/dashboard/EmptyState";
import { PageHeader } from "@/components/dashboard/PageHeader";
import { TrackGate } from "@/components/dashboard/TrackGate";

export default function ProviderSettingsPage() {
  return (
    <TrackGate
      track="provider"
      title="Settings are locked"
      description="Provider settings unlock after approval."
    >
      <div>
        <PageHeader
          eyebrow="Wallet provider"
          title="Settings"
          description="Provider profile and notification preferences for this console."
        />
        <EmptyState
          title="Settings coming soon"
          description="Session is managed via Privy sign-in in the console header."
        />
      </div>
    </TrackGate>
  );
}
