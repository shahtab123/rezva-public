/**
 * Local demo registry rows for admin UI until OPERATOR_API_KEY panels are wired live.
 * Aggregate / protocol-level only - no provider customer PII.
 */

export type DemoIdentifier = {
  id: string;
  display: string;
  type: string;
  normalized: string;
  status: string;
  controller: string;
  destinations: number;
  updatedAt: string;
};

export type DemoNativeName = {
  id: string;
  name: string;
  status: string;
  controller: string;
  reviewTier?: string;
  updatedAt: string;
};

export type DemoDestination = {
  id: string;
  identifierId: string;
  chain: string;
  asset: string;
  address: string;
  status: string;
  createdAt: string;
  updatedAt: string;
  lastPaymentUpdate?: string;
};

export type DemoComplaint = {
  id: string;
  subject: string;
  target: string;
  status: "submitted" | "under_review" | "resolved" | "rejected";
  submittedAt: string;
  summary: string;
};

export type DemoProvider = {
  id: string;
  name: string;
  status: "pending" | "approved" | "suspended" | "revoked";
  productionAccess: boolean;
  apiCalls30d: string;
  website: string;
  updatedAt: string;
};

export const DEMO_IDENTIFIERS: DemoIdentifier[] = [
  {
    id: "id_phone_1",
    display: "phone:01840797300",
    type: "phone",
    normalized: "8801840797300",
    status: "active",
    controller: "0xabc…f01",
    destinations: 2,
    updatedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "id_email_1",
    display: "email:ops@northwind.example",
    type: "email",
    normalized: "ops@northwind.example",
    status: "active",
    controller: "0xabc…f01",
    destinations: 1,
    updatedAt: "2026-08-22T08:12:00.000Z",
  },
  {
    id: "id_paypal_1",
    display: "paypal:merchant.northwind",
    type: "paypal",
    normalized: "merchant.northwind",
    status: "suspended",
    controller: "0xdef…991",
    destinations: 0,
    updatedAt: "2026-08-25T14:00:00.000Z",
  },
];

export const DEMO_NAMES: DemoNativeName[] = [
  {
    id: "name_northwind",
    name: "northwind",
    status: "active",
    controller: "0xabc…f01",
    updatedAt: "2026-08-18T09:00:00.000Z",
  },
  {
    id: "name_facebook",
    name: "facebook",
    status: "pending_review",
    controller: "0xabc…f01",
    reviewTier: "protected_dictionary",
    updatedAt: "2026-08-27T08:00:00.000Z",
  },
  {
    id: "name_support",
    name: "support",
    status: "reserved",
    controller: "protocol",
    updatedAt: "2026-01-01T00:00:00.000Z",
  },
];

export const DEMO_DESTINATIONS: DemoDestination[] = [
  {
    id: "dest_1",
    identifierId: "id_phone_1",
    chain: "ethereum",
    asset: "USDC",
    address: "0x1111…aaaa",
    status: "active",
    createdAt: "2026-08-10T12:00:00.000Z",
    updatedAt: "2026-08-20T10:00:00.000Z",
    lastPaymentUpdate: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "dest_2",
    identifierId: "id_phone_1",
    chain: "solana",
    asset: "USDC",
    address: "So1111…bbbb",
    status: "active",
    createdAt: "2026-08-12T12:00:00.000Z",
    updatedAt: "2026-08-19T16:20:00.000Z",
    lastPaymentUpdate: "2026-08-19T16:20:00.000Z",
  },
];

export const DEMO_COMPLAINTS: DemoComplaint[] = [
  {
    id: "cmp_1",
    subject: "Impersonation",
    target: "phone:01840797300",
    status: "submitted",
    submittedAt: "2026-08-26T11:00:00.000Z",
    summary: "Claimant asserts unauthorized mapping of phone identifier.",
  },
  {
    id: "cmp_2",
    subject: "Namespace abuse",
    target: ".redotpay / disputed-name",
    status: "under_review",
    submittedAt: "2026-08-24T09:30:00.000Z",
    summary: "Dispute over provider-managed name policy (aggregate review only).",
  },
  {
    id: "cmp_3",
    subject: "Trademark",
    target: "name:facebook",
    status: "resolved",
    submittedAt: "2026-08-10T07:00:00.000Z",
    summary: "Held pending dictionary verification - no public activation.",
  },
];

export const DEMO_PROVIDERS: DemoProvider[] = [
  {
    id: "prov_atlas",
    name: "Atlas Wallet",
    status: "approved",
    productionAccess: true,
    apiCalls30d: "1.2M",
    website: "https://atlaswallet.example",
    updatedAt: "2026-08-20T10:00:00.000Z",
  },
  {
    id: "prov_redot",
    name: "RedotPay",
    status: "approved",
    productionAccess: true,
    apiCalls30d: "8.2M",
    website: "https://redotpay.example",
    updatedAt: "2026-08-22T08:00:00.000Z",
  },
  {
    id: "prov_nova",
    name: "Nova Pay",
    status: "suspended",
    productionAccess: false,
    apiCalls30d: "42k",
    website: "https://novapay.example",
    updatedAt: "2026-08-25T14:00:00.000Z",
  },
];

/** Demo registry row ids - skip live operator API until panels fetch real worker data. */
export function isDemoRegistryResourceId(id: string): boolean {
  return /^(id_|name_|dest_|cmp_|prov_)/.test(id);
}

export function filterByQuery<T extends { id: string }>(
  items: T[],
  query: string | undefined,
  pick: (item: T) => string,
): T[] {
  const q = (query ?? "").trim().toLowerCase();
  if (!q) return items;
  return items.filter((item) => pick(item).toLowerCase().includes(q));
}

/** Apply admin-side status overrides (suspend / reactivate) on demo registry rows. */
export function withDemoRegistryStatus<
  T extends { id: string; status: string; updatedAt: string },
>(items: T[], overrides: Record<string, { status: string; updatedAt: string }>): T[] {
  return items.map((item) => {
    const override = overrides[item.id];
    if (!override) return item;
    return { ...item, status: override.status, updatedAt: override.updatedAt };
  });
}
