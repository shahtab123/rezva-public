"use client";

import { DashboardAuthGate } from "./DashboardAuthGate";
import { DashboardNav } from "./DashboardNav";
import { DashboardStateProvider } from "./DashboardStateProvider";
import { NamespaceStateProvider } from "./NamespaceStateProvider";
import { ProviderStateProvider } from "./ProviderStateProvider";

export function DashboardShell({ children }: { children: React.ReactNode }) {
  return (
    <DashboardStateProvider>
      <ProviderStateProvider>
        <NamespaceStateProvider>
          <DashboardAuthGate>
            <div className="dash-app">
              <DashboardNav />
              <div className="dash-main-wrap">
                <div className="dash-mvp-banner" role="status">
                  <strong>MVP preview</strong>
                  <span>
                    Rezva is still early. Use the dashboard for testing and
                    exploration, not for production traffic or real customer
                    funds yet.
                  </span>
                </div>
                <main className="dash-main">{children}</main>
              </div>
            </div>
          </DashboardAuthGate>
        </NamespaceStateProvider>
      </ProviderStateProvider>
    </DashboardStateProvider>
  );
}
