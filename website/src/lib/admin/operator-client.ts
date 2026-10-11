import type { AdminAuditAction } from "@/lib/admin/types";

export type OperatorClientConfig = {
  baseUrl: string;
  operatorKey: string;
};

export function getOperatorClientConfig(): OperatorClientConfig | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  const operatorKey = process.env.OPERATOR_API_KEY?.trim();
  if (!baseUrl || !operatorKey) return null;
  return { baseUrl, operatorKey };
}

type RegistryAction = "NO_ACTION" | "WARNING" | "SUSPEND" | "REVOKE" | "RECLAIM";

async function operatorFetch<T>(
  config: OperatorClientConfig,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const response = await fetch(`${config.baseUrl}${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${config.operatorKey}`,
      ...(init?.headers ?? {}),
    },
  });
  const text = await response.text();
  if (!response.ok) {
    throw new Error(text || response.statusText || `Operator API ${response.status}`);
  }
  return text ? (JSON.parse(text) as T) : ({} as T);
}

export type OperatorMutationInput = {
  auditAction: AdminAuditAction;
  resourceType: string;
  resourceId: string;
  newState: string | null;
  reason: string;
  message?: string | null;
};

/** Returns true when a live worker mutation ran successfully. */
export async function invokeOperatorMutation(input: OperatorMutationInput): Promise<boolean> {
  const config = getOperatorClientConfig();
  if (!config) return false;

  const notes = input.reason || input.message || undefined;

  switch (input.auditAction) {
    case "identifier.suspend":
      await operatorFetch(config, `/v1/operator/identifiers/${encodeURIComponent(input.resourceId)}/suspend`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      return true;

    case "identifier.reactivate":
      await operatorFetch(config, `/v1/operator/identifiers/${encodeURIComponent(input.resourceId)}/reinstate`, {
        method: "POST",
        body: JSON.stringify({}),
      });
      return true;

    case "identifier.revoke":
      await operatorFetch(config, `/v1/operator/identifiers/${encodeURIComponent(input.resourceId)}/revoke`, {
        method: "POST",
        body: JSON.stringify({ notes }),
      });
      return true;

    case "identifier.reclaim": {
      const wallet = input.message?.trim();
      if (!wallet) return false;
      const dual =
        process.env.OPERATOR_RECLAIM_DUAL_TOKEN?.trim() ||
        (process.env.NODE_ENV === "production" ? "" : "bypass");
      if (!dual) {
        throw new Error(
          "OPERATOR_RECLAIM_DUAL_TOKEN is required for reclaim in production.",
        );
      }
      await operatorFetch(config, `/v1/operator/identifiers/${encodeURIComponent(input.resourceId)}/reclaim`, {
        method: "POST",
        body: JSON.stringify({ new_controller_wallet: wallet, notes }),
        headers: { "x-reclaim-dual-control": dual },
      });
      return true;
    }

    case "complaint.resolve": {
      const action: RegistryAction =
        input.newState === "rejected" ? "NO_ACTION" : input.newState === "resolved" ? "SUSPEND" : "WARNING";
      await operatorFetch(config, `/v1/complaints/${encodeURIComponent(input.resourceId)}/resolve`, {
        method: "POST",
        body: JSON.stringify({ action, notes }),
      });
      return true;
    }

    case "provider.suspend":
      await operatorFetch(config, `/v1/providers/${encodeURIComponent(input.resourceId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "SUSPENDED" }),
      });
      return true;

    case "provider.reactivate":
      await operatorFetch(config, `/v1/providers/${encodeURIComponent(input.resourceId)}`, {
        method: "PATCH",
        body: JSON.stringify({ status: "APPROVED" }),
      });
      return true;

    default:
      return false;
  }
}

export async function syncProtectedDictionaryAdd(name: string, note?: string): Promise<boolean> {
  const config = getOperatorClientConfig();
  if (!config) return false;
  await operatorFetch(config, "/v1/operator/protected-dictionary", {
    method: "POST",
    body: JSON.stringify({ name, category: "manual", note }),
  });
  return true;
}

export async function syncProtectedDictionaryRemove(name: string): Promise<boolean> {
  const config = getOperatorClientConfig();
  if (!config) return false;
  await operatorFetch(config, `/v1/operator/protected-dictionary/${encodeURIComponent(name)}`, {
    method: "DELETE",
  });
  return true;
}

export async function activateRegistryNameByLabel(name: string, notes?: string): Promise<boolean> {
  const config = getOperatorClientConfig();
  if (!config) return false;
  const listed = await operatorFetch<{ names: Array<{ id: string; name: string }> }>(
    config,
    "/v1/operator/names?status=pending_review",
  );
  const match = listed.names.find((row) => row.name === name);
  if (!match) return false;
  await operatorFetch(config, `/v1/operator/names/${encodeURIComponent(match.id)}/activate`, {
    method: "POST",
    body: JSON.stringify({ notes }),
  });
  return true;
}

export async function fetchOperatorIdentifiers(): Promise<Array<Record<string, unknown>> | null> {
  const config = getOperatorClientConfig();
  if (!config) return null;
  const data = await operatorFetch<{ identifiers: Array<Record<string, unknown>> }>(
    config,
    "/v1/operator/identifiers",
  );
  return data.identifiers;
}

export async function fetchOperatorProviders(): Promise<Array<Record<string, unknown>> | null> {
  const config = getOperatorClientConfig();
  if (!config) return null;
  const data = await operatorFetch<{ providers: Array<Record<string, unknown>> }>(
    config,
    "/v1/providers",
  );
  return data.providers;
}

export async function fetchOperatorNames(
  status?: string,
): Promise<Array<Record<string, unknown>> | null> {
  const config = getOperatorClientConfig();
  if (!config) return null;
  const query = status ? `?status=${encodeURIComponent(status)}` : "";
  const data = await operatorFetch<{ names: Array<Record<string, unknown>> }>(
    config,
    `/v1/operator/names${query}`,
  );
  return data.names;
}

export async function fetchOperatorNamespaces(): Promise<Array<Record<string, unknown>> | null> {
  const config = getOperatorClientConfig();
  if (!config) return null;
  const data = await operatorFetch<{ namespaces: Array<Record<string, unknown>> }>(
    config,
    "/v1/operator/namespaces",
  );
  return data.namespaces;
}

export async function updateOperatorNamespace(
  slug: string,
  patch: { status?: string; description?: string },
): Promise<boolean> {
  const config = getOperatorClientConfig();
  if (!config) return false;
  await operatorFetch(config, `/v1/operator/namespaces/${encodeURIComponent(slug)}`, {
    method: "PATCH",
    body: JSON.stringify(patch),
  });
  return true;
}

export async function fetchOperatorComplaints(): Promise<Array<Record<string, unknown>> | null> {
  const config = getOperatorClientConfig();
  if (!config) return null;
  const data = await operatorFetch<{ complaints: Array<Record<string, unknown>> }>(
    config,
    "/v1/operator/complaints",
  );
  return data.complaints;
}
