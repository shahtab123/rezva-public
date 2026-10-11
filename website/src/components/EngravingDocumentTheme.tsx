"use client";

import { useEffect } from "react";

/** Pins engraving tokens on <html> so shared globals (var(--orange), body bg) remaps. */
export function EngravingDocumentTheme({
  fontClassNames = "",
}: {
  fontClassNames?: string;
}) {
  useEffect(() => {
    const root = document.documentElement;
    const classes = ["theme-engraving", ...fontClassNames.split(/\s+/).filter(Boolean)];
    root.setAttribute("data-theme", "engraving");
    root.classList.add(...classes);
    return () => {
      root.removeAttribute("data-theme");
      root.classList.remove(...classes);
    };
  }, [fontClassNames]);

  return null;
}
