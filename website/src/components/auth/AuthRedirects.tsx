"use client";

import { useEffect, useRef } from "react";
import { usePathname, useRouter } from "next/navigation";
import { usePrivy } from "@privy-io/react-auth";
import { resolveAuthRedirect } from "./auth-redirects-logic";

/** Must render under PrivyProvider (wired from PrivyProviders). */
export function AuthRedirects() {
  const { ready, authenticated } = usePrivy();
  const router = useRouter();
  const pathname = usePathname();
  const bootstrapped = useRef(false);
  const wasAuthenticated = useRef(false);

  useEffect(() => {
    const next = resolveAuthRedirect({
      ready,
      bootstrapped: bootstrapped.current,
      wasAuthenticated: wasAuthenticated.current,
      authenticated,
      pathname,
    });
    bootstrapped.current = next.bootstrapped;
    wasAuthenticated.current = next.wasAuthenticated;
    if (next.redirectTo) {
      router.replace(next.redirectTo);
    }
  }, [authenticated, ready, pathname, router]);

  return null;
}
