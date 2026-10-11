"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { CompatibleWalletsList } from "./CompatibleWalletsList";
import { docsNav } from "./docs-nav";

export function DocsSidebar() {
  const pathname = usePathname();

  return (
    <aside className="docs-sidebar" aria-label="Documentation navigation">
      <div className="docs-sidebar-header">
        <Link className="docs-sidebar-brand" href="/docs/introduction/overview">
          Docs
        </Link>
      </div>

      <nav className="docs-sidebar-nav">
        {docsNav.map((section) => (
          <div className="docs-sidebar-section" key={section.title}>
            <p className="docs-sidebar-section-title">{section.title}</p>
            <ul>
              {section.items.map((item) => {
                const active =
                  pathname === item.href ||
                  (item.href !== "/docs" && pathname.startsWith(item.href));

                return (
                  <li key={item.href}>
                    <Link
                      className={active ? "active" : undefined}
                      href={item.href}
                      {...(item.external
                        ? { target: "_blank", rel: "noreferrer" }
                        : {})}
                    >
                      {item.title}
                    </Link>
                  </li>
                );
              })}
            </ul>
          </div>
        ))}
      </nav>

      <CompatibleWalletsList compact />
    </aside>
  );
}
