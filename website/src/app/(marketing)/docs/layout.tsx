"use client";

import Link from "next/link";
import { AuthNavButton } from "@/components/auth/AuthNavButton";
import { BrandMark } from "@/components/BrandMark";
import { DocsSidebar } from "@/components/docs/DocsSidebar";
import "./docs.css";

export default function DocsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="docs-shell">
      <header className="docs-topbar">
        <Link className="docs-topbar-brand" href="/">
          <BrandMark />
          <span>Rezva</span>
        </Link>
        <div className="docs-topbar-actions">
          <Link href="/integrate">Integrate</Link>
          <AuthNavButton />
        </div>
      </header>

      <div className="docs-layout">
        <DocsSidebar />
        <main className="docs-main">{children}</main>
      </div>
    </div>
  );
}
