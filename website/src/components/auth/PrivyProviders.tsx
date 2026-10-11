"use client";

import { PrivyProvider } from "@privy-io/react-auth";
import { createContext, useContext, type ReactNode } from "react";
import { AuthRedirects } from "./AuthRedirects";

const PrivyMountedContext = createContext(false);

export function usePrivyMounted(): boolean {
  return useContext(PrivyMountedContext);
}

/** Root-layout only - never nest this under dashboard or marketing layouts. */
export function PrivyProviders({ children }: { children: ReactNode }) {
  const appId = process.env.NEXT_PUBLIC_PRIVY_APP_ID?.trim();

  if (!appId) {
    return (
      <PrivyMountedContext.Provider value={false}>
        {children}
      </PrivyMountedContext.Provider>
    );
  }

  // Keep exactly one React child under PrivyProvider.
  // Missing-key warnings that still appear when opening the login modal come from
  // Privy’s internal wallet list UI (known SDK issue), not from this wrapper.
  return (
    <PrivyProvider
      appId={appId}
      config={{
        loginMethods: ["email", "wallet", "google"],
        appearance: {
          theme: "light",
          accentColor: "#ff2d6a",
          // EVM-only: controller wallets are 0x addresses; skip Solana connectors.
          walletChainType: "ethereum-only",
        },
        embeddedWallets: {
          ethereum: {
            createOnLogin: "users-without-wallets",
          },
        },
      }}
    >
      <PrivyAppTree>{children}</PrivyAppTree>
    </PrivyProvider>
  );
}

function PrivyAppTree({ children }: { children: ReactNode }) {
  return (
    <PrivyMountedContext.Provider value={true}>
      <AuthRedirects />
      {children}
    </PrivyMountedContext.Provider>
  );
}
