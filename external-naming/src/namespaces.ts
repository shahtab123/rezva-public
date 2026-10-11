/**
 * Namespace / TLD routing rules for external naming systems.
 *
 * These are provider → namespace mappings, NOT per-name ownership records.
 * Rezva never stores alice.eth / bob.eth style rows for these systems.
 */

export type ExternalNamespaceRule = {
  /** Resolver provider id (stable key for the NameResolver registry). */
  provider: string;
  /** Leading-dot namespaces / TLDs owned by this provider (e.g. ".eth"). */
  namespaces: readonly string[];
};

/**
 * Unstoppable Domains UNS/ZIL TLDs (namingService UNS or ZIL from
 * https://api.unstoppabledomains.com/resolve/supported_tlds).
 * Excludes .eth (routed to the ENS provider) and DNS/ICANN TLDs.
 */
export const UNSTOPPABLE_NAMESPACES = [
  ".888",
  ".agent",
  ".ai4",
  ".altimist",
  ".amped",
  ".anime",
  ".anyone",
  ".arculus",
  ".ask",
  ".ath",
  ".aura",
  ".austin",
  ".awaken",
  ".bald",
  ".basenji",
  ".bay",
  ".bch",
  ".benji",
  ".binanceus",
  ".bitcoin",
  ".bitget",
  ".bitscrunch",
  ".blockchain",
  ".bobi",
  ".boomer",
  ".brave",
  ".bunni",
  ".calicoin",
  ".carbon",
  ".cashme",
  ".caw",
  ".cgai",
  ".chip",
  ".chipper",
  ".chomp",
  ".clay",
  ".coin",
  ".collect",
  ".crypto",
  ".dao",
  ".dejay",
  ".demos",
  ".depin",
  ".derad",
  ".dfz",
  ".digibyte",
  ".digitalfuture",
  ".doga",
  ".donut",
  ".dream",
  ".dsci",
  ".emir",
  ".enigma",
  ".ethermail",
  ".farms",
  ".go",
  ".goblin",
  ".gotchi",
  ".graphics",
  ".gripe",
  ".grow",
  ".guide",
  ".hegecoin",
  ".her",
  ".hi",
  ".horizen",
  ".housecoin",
  ".hub",
  ".imtoken",
  ".kingdom",
  ".klever",
  ".kresus",
  ".kryptic",
  ".learn",
  ".lfg",
  ".ltc",
  ".lunar",
  ".manga",
  ".marketer",
  ".mery",
  ".metropolis",
  ".miku",
  ".ministry",
  ".mobix",
  ".moon",
  ".mooncat",
  ".mumu",
  ".mycircle",
  ".nft",
  ".nibi",
  ".npc",
  ".og",
  ".ohm",
  ".onchain",
  ".openx",
  ".pack",
  ".pastor",
  ".pbdx",
  ".pendle",
  ".pengu",
  ".pilot",
  ".podcast",
  ".pog",
  ".pokt",
  ".polygon",
  ".presearch",
  ".privacy",
  ".propykeys",
  ".pudgy",
  ".pundi",
  ".quantum",
  ".rad",
  ".raiin",
  ".realm",
  ".retardio",
  ".secret",
  ".shiksha",
  ".smobler",
  ".sonic",
  ".south",
  ".spend",
  ".stepn",
  ".super",
  ".supernova",
  ".swamp",
  ".tball",
  ".tea",
  ".tigershark",
  ".travel",
  ".tribe",
  ".troll",
  ".twin",
  ".u",
  ".ubu",
  ".udtest",
  ".undeads",
  ".unstoppable",
  ".vanity",
  ".verge",
  ".wallet",
  ".web3",
  ".wif",
  ".wifi",
  ".witg",
  ".wrkx",
  ".x",
  ".xec",
  ".xmr",
  ".xyo",
  ".xz1",
  ".yellow",
  ".zano",
  ".zil",
] as const;

/**
 * Provider registry rules. Additional naming systems can be appended without
 * changing the core resolve flow — register a NameResolver with the same id.
 */
export const EXTERNAL_NAMESPACE_RULES: readonly ExternalNamespaceRule[] = [
  { provider: "ens", namespaces: [".eth"] },
  { provider: "sns", namespaces: [".sol"] },
  {
    provider: "basenames",
    // Dedicated .base provider — not treated as a Rezva provider_name slug.
    // On-chain Base Names are ENSIP-compatible (* .base.eth); the resolver maps
    // alice.base → that system without exposing .base.eth as the user input.
    namespaces: [".base"],
  },
  {
    provider: "unstoppable",
    namespaces: UNSTOPPABLE_NAMESPACES,
  },
] as const;

export type ExternalNamespaceMatch = {
  provider: string;
  namespace: string;
  /** Full normalized name (lowercase, trimmed). */
  name: string;
  /** Label without the matched namespace (e.g. "alice" for alice.eth). */
  label: string;
};

function normalizeNamespace(ns: string): string {
  const trimmed = ns.trim().toLowerCase();
  return trimmed.startsWith(".") ? trimmed : `.${trimmed}`;
}

/** Flat list of all external namespaces, longest first (for suffix matching). */
export function listExternalNamespaces(
  rules: readonly ExternalNamespaceRule[] = EXTERNAL_NAMESPACE_RULES,
): string[] {
  const all = rules.flatMap((rule) =>
    rule.namespaces.map((ns) => normalizeNamespace(ns)),
  );
  return [...new Set(all)].sort((a, b) => b.length - a.length);
}

/**
 * Returns the external namespace rule match for an identifier, or null.
 * Matches the longest namespace suffix (e.g. prefers more specific TLDs).
 */
export function matchExternalNamespace(
  value: string,
  rules: readonly ExternalNamespaceRule[] = EXTERNAL_NAMESPACE_RULES,
): ExternalNamespaceMatch | null {
  const name = value.trim().toLowerCase();
  if (!name || name.includes(" ") || name.startsWith(".")) {
    return null;
  }

  const namespaces = listExternalNamespaces(rules);
  for (const namespace of namespaces) {
    if (!name.endsWith(namespace)) continue;
    if (name.length <= namespace.length) continue;
    const label = name.slice(0, name.length - namespace.length);
    // Require a real label (no empty / trailing-dot garbage).
    if (!label || label.endsWith(".")) continue;
    // Avoid matching inside emails (already unlikely given TLD list).
    if (label.includes("@")) continue;

    const rule = rules.find((r) =>
      r.namespaces.some((ns) => normalizeNamespace(ns) === namespace),
    );
    if (!rule) continue;

    return {
      provider: rule.provider,
      namespace,
      name,
      label,
    };
  }
  return null;
}

/** True when the value belongs to an external naming namespace. */
export function isExternalNamespaceName(
  value: string,
  rules: readonly ExternalNamespaceRule[] = EXTERNAL_NAMESPACE_RULES,
): boolean {
  return matchExternalNamespace(value, rules) !== null;
}
