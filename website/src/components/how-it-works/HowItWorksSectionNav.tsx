"use client";

import { useEffect, useState } from "react";

export const howItWorksSectionNav = [
  ["Overview", "overview"],
  ["For users", "for-users"],
  ["For merchants", "for-merchants"],
  ["For wallets", "for-wallets"],
  ["Identifiers", "identifiers"],
] as const;

export function HowItWorksSectionNav() {
  const [activeId, setActiveId] = useState<string>(howItWorksSectionNav[0][1]);

  useEffect(() => {
    const sections = howItWorksSectionNav
      .map(([, id]) => document.getElementById(id))
      .filter(Boolean) as HTMLElement[];

    const syncFromHash = () => {
      const hash = window.location.hash.replace("#", "");
      if (hash && sections.some((section) => section.id === hash)) {
        setActiveId(hash);
      }
    };

    syncFromHash();
    window.addEventListener("hashchange", syncFromHash);

    const observer = new IntersectionObserver(
      (entries) => {
        const visible = entries
          .filter((entry) => entry.isIntersecting)
          .sort((a, b) => b.intersectionRatio - a.intersectionRatio);

        if (visible[0]?.target.id) {
          setActiveId(visible[0].target.id);
        }
      },
      {
        rootMargin: "-20% 0px -60% 0px",
        threshold: [0.1, 0.25, 0.5],
      },
    );

    sections.forEach((section) => observer.observe(section));

    return () => {
      window.removeEventListener("hashchange", syncFromHash);
      observer.disconnect();
    };
  }, []);

  return (
    <aside className="hiw-sidebar" aria-label="How it works">
      <div className="hiw-sidebar-header">
        <p className="hiw-sidebar-kicker">How it works</p>
        <p className="hiw-sidebar-title">On this page</p>
      </div>
      <nav className="hiw-section-nav" aria-label="How it works sections">
        {howItWorksSectionNav.map(([label, id]) => (
          <a
            key={id}
            className={activeId === id ? "active" : undefined}
            href={`#${id}`}
            onClick={() => setActiveId(id)}
          >
            {label}
          </a>
        ))}
      </nav>
    </aside>
  );
}
