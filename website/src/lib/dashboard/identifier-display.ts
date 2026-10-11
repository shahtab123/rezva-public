const TYPE_LABELS: Record<string, string> = {
  email: "Email",
  phone: "Phone",
  bangla_qr: "Bangla QR",
  paypal: "PayPal",
  bkash: "bKash",
  merchant_id: "Merchant ID",
  custom: "Custom",
  provider_name: "Provider name",
};

export function identifierTypeLabel(type: string): string {
  return TYPE_LABELS[type] ?? type.replaceAll("_", " ");
}

/** Human-readable row label: business name first, identifier value second. */
export function formatIdentifierRowLabel(input: {
  businessName?: string | null;
  type: string;
  value: string;
}): { primary: string; secondary: string } {
  const typeLabel = identifierTypeLabel(input.type);
  if (input.businessName?.trim()) {
    return {
      primary: input.businessName.trim(),
      secondary: `${typeLabel} · ${input.value}`,
    };
  }
  return {
    primary: input.value,
    secondary: typeLabel,
  };
}

/** Compact label for selects and tables. */
export function formatIdentifierSummary(input: {
  businessName?: string | null;
  type: string;
  value: string;
}): string {
  const { primary, secondary } = formatIdentifierRowLabel(input);
  if (input.businessName?.trim()) {
    return `${primary} - ${input.value}`;
  }
  return `${primary} (${secondary})`;
}
