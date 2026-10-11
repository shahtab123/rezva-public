"use client";

import Link from "next/link";
import { useEffect, useId, useState } from "react";
import { AuthNavButton } from "./auth/AuthNavButton";
import { BrandMark } from "./BrandMark";
import { siteNavLinks } from "./site-nav";

function NavLink({
  item,
  onNavigate,
}: {
  item: (typeof siteNavLinks)[number];
  onNavigate?: () => void;
}) {
  if (item.external) {
    return (
      <a href={item.href} target="_blank" rel="noreferrer" onClick={onNavigate}>
        {item.label}
      </a>
    );
  }

  return (
    <Link href={item.href} onClick={onNavigate}>
      {item.label}
    </Link>
  );
}

export function SiteHeader() {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuId = useId();

  useEffect(() => {
    if (!menuOpen) return;

    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") setMenuOpen(false);
    }

    const previousOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    document.addEventListener("keydown", onKey);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.removeEventListener("keydown", onKey);
    };
  }, [menuOpen]);

  useEffect(() => {
    function onResize() {
      if (window.matchMedia("(min-width: 861px)").matches) {
        setMenuOpen(false);
      }
    }

    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);

  function closeMenu() {
    setMenuOpen(false);
  }

  return (
    <header className={`site-header${menuOpen ? " is-open" : ""}`}>
      <Link className="brand" href="/" aria-label="Rezva home" onClick={closeMenu}>
        <BrandMark size={40} className="brand-mark site-header-brand-mark" />
      </Link>

      <div className="header-actions">
        <nav className="header-secondary-nav" aria-label="Site">
          {siteNavLinks.map((item) => (
            <NavLink key={item.href} item={item} />
          ))}
        </nav>
        <AuthNavButton />
        <button
          type="button"
          className="nav-toggle"
          aria-expanded={menuOpen}
          aria-controls={menuId}
          aria-label={menuOpen ? "Close menu" : "Open menu"}
          onClick={() => setMenuOpen((open) => !open)}
        >
          <span />
          <span />
          <span />
        </button>
      </div>

        <div className="mobile-nav-panel" id={menuId} hidden={!menuOpen} aria-hidden={!menuOpen}>
          <nav className="mobile-nav" aria-label="Mobile">
            {siteNavLinks.map((item) => (
              <NavLink key={item.href} item={item} onNavigate={closeMenu} />
            ))}
          </nav>
        </div>

      {menuOpen ? (
        <button
          type="button"
          className="mobile-nav-backdrop"
          aria-label="Close menu"
          onClick={closeMenu}
        />
      ) : null}
    </header>
  );
}
