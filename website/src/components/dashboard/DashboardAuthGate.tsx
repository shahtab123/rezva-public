"use client";

import { usePrivy } from "@privy-io/react-auth";
import type { ReactNode } from "react";

export function DashboardAuthGate({ children }: { children: ReactNode }) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <div className="dash-auth-gate">
        <div className="dash-auth-card">
          <p className="dash-eyebrow">Dashboard</p>
          <h1>Loading session…</h1>
          <p>Checking authentication.</p>
        </div>
      </div>
    );
  }

  if (!authenticated) {
    return (
      <div className="dash-auth-gate">
        <div className="dash-auth-card">
          <p className="dash-eyebrow">Dashboard</p>
          <h1>Sign in to continue</h1>
          <p>
            Log in to open the resolution console. After sign-in you stay here;
            logging out returns you to the homepage.
          </p>
          <button
            type="button"
            className="dash-btn dash-btn-primary"
            onClick={() => void login()}
          >
            Log in
          </button>
        </div>
      </div>
    );
  }

  return <>{children}</>;
}
