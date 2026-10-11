"use client";

import Link from "next/link";
import { useEffect, useId, useRef, useState } from "react";
import { usePrivy } from "@privy-io/react-auth";
import { userDisplayName } from "./auth-utils";
import { usePrivyMounted } from "./PrivyProviders";

function AuthNavInner({ className }: { className: string }) {
  const { ready, authenticated, login, logout, user } = usePrivy();
  const [open, setOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const menuId = useId();

  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: MouseEvent) {
      if (!rootRef.current?.contains(event.target as Node)) {
        setOpen(false);
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setOpen(false);
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, [open]);

  if (!ready) {
    return (
      <button type="button" className={className} disabled>
        …
      </button>
    );
  }

  if (!authenticated) {
    return (
      <button type="button" className={className} onClick={() => void login()}>
        Log in
      </button>
    );
  }

  const name = userDisplayName(user);

  return (
    <div className="account-menu" ref={rootRef}>
      <button
        type="button"
        className={`${className} account-menu-trigger`}
        aria-expanded={open}
        aria-haspopup="menu"
        aria-controls={menuId}
        onClick={() => setOpen((value) => !value)}
      >
        <span className="account-menu-name">{name}</span>
        <span className="account-menu-caret" aria-hidden="true" />
      </button>
      {open ? (
        <div className="account-menu-dropdown" id={menuId} role="menu">
          <Link
            role="menuitem"
            href="/dashboard"
            className="account-menu-item"
            onClick={() => setOpen(false)}
          >
            Dashboard
          </Link>
          <button
            type="button"
            role="menuitem"
            className="account-menu-item account-menu-item-button"
            onClick={() => {
              setOpen(false);
              void logout();
            }}
          >
            Log out
          </button>
        </div>
      ) : null}
    </div>
  );
}

export function AuthNavButton({
  className = "button button-small button-dark",
}: {
  className?: string;
}) {
  const mounted = usePrivyMounted();
  if (!mounted) {
    return (
      <button type="button" className={className} disabled title="Privy not configured">
        Log in
      </button>
    );
  }

  return <AuthNavInner className={className} />;
}
