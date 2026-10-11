/**
 * Protected native-name dictionary + hard-reserved slug lists.
 *
 * Hard-reserved names (admin, login, www, …) stay in `reserved_names` and are
 * never registerable.
 *
 * Protected dictionary names ARE registerable, but create as `pending_review`
 * with longer operator review. Operators may request ownership proof by email.
 *
 * Lists are generated from GitHub example wordlists - see `registry/data/` and
 * `scripts/generate-restricted-names.mjs`.
 */
export {
  HARD_RESERVED_NAMES,
  PROTECTED_NAME_DICTIONARY_SEED,
  PROTECTED_NAME_SEED,
  RESTRICTED_NAME_COUNTS,
  RESTRICTED_NAME_SOURCES,
  type ProtectedDictionaryCategory,
  type ProtectedDictionaryEntry,
} from "./restricted-names-data.js";

export {
  EXTERNAL_NAMESPACE_RULES,
  UNSTOPPABLE_NAMESPACES,
  isExternalNamespaceName,
  listExternalNamespaces,
  matchExternalNamespace,
  type ExternalNamespaceMatch,
  type ExternalNamespaceRule,
} from "./external-namespace-rules.js";

import {
  HARD_RESERVED_NAMES,
  PROTECTED_NAME_DICTIONARY_SEED,
} from "./restricted-names-data.js";

export const PROTECTED_REVIEW_HINT =
  "This name matches the protected dictionary. You can still apply, but activation takes longer and operators may request ownership proof by email.";

export function buildHardReservedSeedSql(dialect: "sqlite" | "postgres"): string {
  return [...HARD_RESERVED_NAMES]
    .sort()
    .map((name) => {
      const escaped = name.replace(/'/g, "''");
      if (dialect === "postgres") {
        return `INSERT INTO reserved_names (name) VALUES ('${escaped}') ON CONFLICT DO NOTHING`;
      }
      return `INSERT OR IGNORE INTO reserved_names (name) VALUES ('${escaped}')`;
    })
    .join(";\n");
}

export function buildProtectedDictionarySeedSql(
  dialect: "sqlite" | "postgres",
): string {
  return PROTECTED_NAME_DICTIONARY_SEED.map((entry) => {
    const note = entry.note ? `'${entry.note.replace(/'/g, "''")}'` : "NULL";
    const escaped = entry.name.replace(/'/g, "''");
    if (dialect === "postgres") {
      return `INSERT INTO protected_name_dictionary (name, category, note) VALUES ('${escaped}', '${entry.category}', ${note}) ON CONFLICT DO NOTHING`;
    }
    return `INSERT OR IGNORE INTO protected_name_dictionary (name, category, note) VALUES ('${escaped}', '${entry.category}', ${note})`;
  }).join(";\n");
}
