"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { usePrivyMounted } from "./auth/PrivyProviders";

export function LoginToIntegrateButton({
  className = "button button-primary",
  showArrow = false,
  label = "Log in to integrate",
}: {
  className?: string;
  showArrow?: boolean;
  label?: string;
}) {
  const mounted = usePrivyMounted();

  const arrow = showArrow ? (
    <svg aria-hidden="true" viewBox="0 0 20 20" fill="none">
      <path
        d="M4 10h12M11 5l5 5-5 5"
        stroke="currentColor"
        strokeWidth="1.5"
      />
    </svg>
  ) : null;

  if (!mounted) {
    return (
      <button type="button" className={className} disabled>
        {label} {arrow}
      </button>
    );
  }

  return (
    <LoginToIntegrateButtonInner className={className} arrow={arrow} label={label} />
  );
}

function LoginToIntegrateButtonInner({
  className,
  arrow,
  label,
}: {
  className: string;
  arrow: ReactNode;
  label: string;
}) {
  const { ready, authenticated, login } = usePrivy();

  if (!ready) {
    return (
      <button type="button" className={className} disabled>
        …
      </button>
    );
  }

  if (authenticated) {
    return (
      <Link className={className} href="/dashboard">
        Go to dashboard
      </Link>
    );
  }

  return (
    <button type="button" className={className} onClick={() => void login()}>
      {label} {arrow}
    </button>
  );
}
