import { listAudit } from "@/lib/admin/store";
import type { AdminAuditEntry } from "@/lib/admin/types";

const REGISTRY_ACTION_PREFIXES = [
  "identifier.",
  "name.",
  "namespace.",
  "dictionary.",
  "complaint.",
] as const;

const PROVIDER_ACTION_PREFIXES = ["provider.", "application."] as const;

function matchesPrefix(action: string, prefixes: readonly string[]): boolean {
  return prefixes.some((prefix) => action.startsWith(prefix));
}

export function listRegistryActivity(limit = 200): AdminAuditEntry[] {
  return listAudit(limit).filter((entry) => matchesPrefix(entry.action, REGISTRY_ACTION_PREFIXES));
}

export function listProviderActivity(limit = 200): AdminAuditEntry[] {
  return listAudit(limit).filter((entry) => matchesPrefix(entry.action, PROVIDER_ACTION_PREFIXES));
}
