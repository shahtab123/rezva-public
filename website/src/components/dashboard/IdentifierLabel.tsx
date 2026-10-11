"use client";

import { formatIdentifierRowLabel, formatIdentifierSummary } from "@/lib/dashboard/identifier-display";
import type { DashboardIdentifier } from "@/lib/dashboard/registry-hooks";

export function IdentifierLabel({
  identifier,
  compact = false,
}: {
  identifier: Pick<DashboardIdentifier, "business_name" | "type" | "value">;
  compact?: boolean;
}) {
  const { primary, secondary } = formatIdentifierRowLabel({
    businessName: identifier.business_name,
    type: identifier.type,
    value: identifier.value,
  });

  if (compact) {
    return (
      <span>
        {formatIdentifierSummary({
          businessName: identifier.business_name,
          type: identifier.type,
          value: identifier.value,
        })}
      </span>
    );
  }

  return (
    <>
      <strong>{primary}</strong>
      <br />
      <span className="dash-meta">{secondary}</span>
    </>
  );
}
