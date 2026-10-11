/**
 * Client mirror of protected-name dictionary for dashboard UX.
 * Source of truth at registration time is the registry DB / availability API.
 */
export {
  HARD_RESERVED_NAMES,
  PROTECTED_NAME_DICTIONARY_SEED,
  PROTECTED_NAME_SEED,
  RESTRICTED_NAME_COUNTS,
  RESTRICTED_NAME_SOURCES,
  type ProtectedDictionaryCategory,
  type ProtectedDictionaryEntry,
} from "@/lib/restricted-names-data";

import { HARD_RESERVED_NAMES, PROTECTED_NAME_SEED } from "@/lib/restricted-names-data";

export const PROTECTED_REVIEW_HINT =
  "This name matches the protected dictionary. You can still apply, but activation takes longer and operators may request ownership proof by email.";

export function classifyNativeName(raw: string): {
  normalized: string;
  valid: boolean;
  reserved: boolean;
  protected: boolean;
} {
  const normalized = raw.trim().toLowerCase();
  const valid = /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(normalized);
  return {
    normalized,
    valid,
    reserved: HARD_RESERVED_NAMES.has(normalized),
    protected: PROTECTED_NAME_SEED.has(normalized),
  };
}
