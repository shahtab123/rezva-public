import {
  apiError,
  type CreateProviderRequest,
  type RegistryAction,
  type ResolveComplaintRequest,
  type UpdateProviderRequest,
} from "@universal-payment/protocol";
import {
  authenticateDashboardService,
  authenticateOperator,
  type RegistryEnv,
} from "./auth.js";
import { invalidateResolveCache } from "./cache.js";
import { configFromEnv, sha256Hex } from "./config.js";
import { pendingActivationAt } from "./state.js";
import { errorResponse, jsonResponse, readJson } from "./http.js";
import { reclaimDualControlAccepted } from "./security.js";
import type { RegistryStore } from "./store.js";
import { newId, nowIso } from "./config.js";
import {
  scheduleProviderWebhook,
  type RegistryHooks,
} from "./webhook-dispatch.js";

async function invalidateIdentifier(
  store: RegistryStore,
  env: RegistryEnv,
  identifierId: string,
): Promise<void> {
  const row = await store.getIdentifierById(identifierId);
  if (!row) {
    return;
  }
  await invalidateResolveCache(env, row.type, row.normalized_value);
}

function operatorUnauthorized(): Response {
  return errorResponse(apiError("FORBIDDEN", "Operator authorization failed."), 403);
}

async function applyRegistryAction(
  store: RegistryStore,
  env: RegistryEnv,
  identifierId: string,
  action: RegistryAction,
  input: {
    notes?: string;
    newControllerWallet?: string;
    dualControlToken?: string;
  },
): Promise<Response | null> {
  const identifier = await store.getIdentifierById(identifierId);
  if (!identifier) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }

  const authRef = "operator";
  const config = configFromEnv(env);

  switch (action) {
    case "NO_ACTION":
      return null;
    case "WARNING":
      await store.recordEvent({
        eventType: "metadata_updated",
        identifierId,
        authorizationReference: authRef,
        metadata: { kind: "warning", notes: input.notes ?? null },
      });
      break;
    case "SUSPEND":
      await store.suspendIdentifier(identifierId, authRef);
      break;
    case "REVOKE":
      await store.revokeIdentifier(identifierId, authRef);
      break;
    case "RECLAIM": {
      if (!input.newControllerWallet) {
        return errorResponse(
          apiError("VALIDATION_ERROR", "new_controller_wallet is required for RECLAIM."),
          400,
        );
      }
      // Dual-control token required. Production needs OPERATOR_RECLAIM_DUAL_TOKEN.
      // Local/dev may pass X-Reclaim-Dual-Control: bypass when insecure auth is allowed.
      const dual =
        input.dualControlToken ??
        undefined;
      if (!reclaimDualControlAccepted(env, dual)) {
        return errorResponse(
          apiError(
            "FORBIDDEN",
            "RECLAIM requires a valid dual-control token (X-Reclaim-Dual-Control).",
          ),
          403,
        );
      }
      const controllerId = await store.ensureController(input.newControllerWallet);
      const pendingAt = pendingActivationAt(nowIso(), config, "registration");
      await store.reclaimIdentifier(
        identifierId,
        controllerId,
        `${authRef}:dual`,
        pendingAt,
      );
      break;
    }
    default:
      return errorResponse(apiError("VALIDATION_ERROR", "Unknown registry action."), 400);
  }

  await invalidateIdentifier(store, env, identifierId);
  return null;
}

export async function handleOperatorRequest(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  hooks?: RegistryHooks,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith("/v1/operator/") && !path.startsWith("/v1/providers")) {
    const complaintResolve = path.match(/^\/v1\/complaints\/([^/]+)\/resolve$/);
    if (request.method === "POST" && complaintResolve) {
      return resolveComplaint(store, request, env, complaintResolve[1]!, hooks);
    }
    return null;
  }

  // Dashboard application sync is used by the user-facing BFF. Accept the
  // dashboard service key there so a stale OPERATOR_API_KEY on Vercel cannot
  // break /dashboard after operator-key rotation. Admin-only routes stay operator-only.
  const isDashboardApplications = path.startsWith(
    "/v1/operator/dashboard-applications",
  );
  const authorized = isDashboardApplications
    ? authenticateOperator(request, env) ||
      authenticateDashboardService(request, env)
    : authenticateOperator(request, env);
  if (!authorized) {
    return operatorUnauthorized();
  }

  if (request.method === "GET" && path === "/v1/operator/namespaces") {
    const rows = await store.listAllProviderNamespaces();
    const namespaces = await Promise.all(
      rows.map(async (row) => {
        const usage = await store.getNamespaceUsage(String(row.slug ?? ""));
        return {
          slug: row.slug,
          provider_id: row.provider_id,
          status: row.status,
          description: row.description,
          registration_policy: row.registration_policy,
          reserved_names: row.reserved_names_json
            ? (JSON.parse(row.reserved_names_json) as string[])
            : [],
          created_at: row.created_at,
          updated_at: row.updated_at,
          usage,
        };
      }),
    );
    return jsonResponse({ namespaces });
  }

  const operatorNsPatch = path.match(/^\/v1\/operator\/namespaces\/([^/]+)$/);
  if (request.method === "PATCH" && operatorNsPatch) {
    const body = await readJson<{ status?: string; description?: string }>(request);
    const slug = decodeURIComponent(operatorNsPatch[1]!)
      .trim()
      .replace(/^\./, "")
      .toLowerCase();
    const updated = await store.updateProviderNamespace(slug, {
      status: body.status,
      description: body.description ?? null,
    });
    if (!updated) {
      return errorResponse(apiError("NOT_FOUND", "Namespace not found."), 404);
    }
    return jsonResponse({
      slug: updated.slug,
      provider_id: updated.provider_id,
      status: updated.status,
      description: updated.description,
      registration_policy: updated.registration_policy,
      updated_at: updated.updated_at,
    });
  }

  if (request.method === "GET" && path === "/v1/providers") {
    const providers = await store.listProviders();
    return jsonResponse({ providers });
  }

  if (request.method === "GET" && path === "/v1/operator/identifiers") {
    const identifiers = await store.listIdentifiersForOperator(200);
    return jsonResponse({ identifiers });
  }

  if (request.method === "GET" && path === "/v1/operator/dashboard-applications") {
    const userId = new URL(request.url).searchParams.get("privy_user_id") ?? undefined;
    const applications = await store.listDashboardApplications(userId);
    return jsonResponse({ applications });
  }

  if (request.method === "POST" && path === "/v1/operator/dashboard-applications") {
    const body = await readJson<{
      id?: string;
      privy_user_id?: string;
      track?: "business" | "provider";
      status?: string;
      payload?: Record<string, string>;
      submitted_at?: string;
      controller_wallet?: string | null;
      document_request?: Record<string, unknown> | null;
      document_response?: Record<string, unknown> | null;
    }>(request);
    if (!body.privy_user_id || !body.track || !body.payload) {
      return errorResponse(
        apiError("VALIDATION_ERROR", "privy_user_id, track, and payload are required."),
        400,
      );
    }
    const application = await store.saveDashboardApplication({
      id: body.id ?? newId("uapp"),
      privyUserId: body.privy_user_id,
      track: body.track,
      status: body.status ?? "submitted",
      payload: body.payload,
      submittedAt: body.submitted_at ?? nowIso(),
      controllerWallet: body.controller_wallet,
      documentRequest: body.document_request,
      documentResponse: body.document_response,
    });
    return jsonResponse({ application }, 201);
  }

  const dashboardApplication = path.match(
    /^\/v1\/operator\/dashboard-applications\/([^/]+)$/,
  );
  if (request.method === "GET" && dashboardApplication) {
    const application = await store.getDashboardApplication(
      decodeURIComponent(dashboardApplication[1]!),
    );
    return application
      ? jsonResponse({ application })
      : errorResponse(apiError("NOT_FOUND", "Dashboard application not found."), 404);
  }
  if (request.method === "PATCH" && dashboardApplication) {
    const body = await readJson<{
      status?: string;
      payload?: Record<string, string>;
      rejection_reason?: string | null;
      document_request?: Record<string, unknown> | null;
      document_response?: Record<string, unknown> | null;
    }>(request);
    const application = await store.updateDashboardApplication(
      decodeURIComponent(dashboardApplication[1]!),
      {
        status: body.status,
        payload: body.payload,
        rejectionReason: body.rejection_reason,
        documentRequest: body.document_request,
        documentResponse: body.document_response,
      },
    );
    return application
      ? jsonResponse({ application })
      : errorResponse(apiError("NOT_FOUND", "Dashboard application not found."), 404);
  }

  if (request.method === "GET" && path === "/v1/operator/names") {
    const url = new URL(request.url);
    const status = url.searchParams.get("status") as
      | "active"
      | "pending_review"
      | "removed"
      | null;
    const names = await store.listNamesForOperator(
      status ? { status, limit: 200 } : { limit: 200 },
    );
    return jsonResponse({ names });
  }

  if (request.method === "GET" && path === "/v1/operator/complaints") {
    const complaints = await store.listComplaintsForOperator(200);
    return jsonResponse({ complaints });
  }

  if (request.method === "GET" && path === "/v1/operator/protected-dictionary") {
    const entries = await store.listProtectedDictionaryEntries(1000);
    return jsonResponse({ entries });
  }

  if (request.method === "POST" && path === "/v1/operator/protected-dictionary") {
    const body = await readJson<{ name?: string; category?: string; note?: string }>(request);
    const name = body.name?.trim().toLowerCase();
    if (!name) {
      return errorResponse(apiError("VALIDATION_ERROR", "name is required."), 400);
    }
    await store.addProtectedDictionaryEntry(name, body.category ?? "manual", body.note ?? null);
    return jsonResponse({ name, category: body.category ?? "manual", note: body.note ?? null }, 201);
  }

  const protectedDictionaryDelete = path.match(
    /^\/v1\/operator\/protected-dictionary\/([^/]+)$/,
  );
  if (request.method === "DELETE" && protectedDictionaryDelete) {
    const name = decodeURIComponent(protectedDictionaryDelete[1]!).toLowerCase();
    const removed = await store.removeProtectedDictionaryEntry(name);
    if (!removed) {
      return errorResponse(apiError("NOT_FOUND", "Dictionary entry not found."), 404);
    }
    return jsonResponse({ name, removed: true });
  }

  const activateName = path.match(/^\/v1\/operator\/names\/([^/]+)\/activate$/);
  if (request.method === "POST" && activateName) {
    const body = await readJson<{ notes?: string }>(request);
    const updated = await store.activateNativeNameByOperator(
      decodeURIComponent(activateName[1]!),
      body.notes ?? null,
    );
    if (!updated) {
      return errorResponse(apiError("NAME_NOT_FOUND", "Native name was not found."), 404);
    }
    return jsonResponse(updated);
  }

  if (request.method === "POST" && path === "/v1/providers") {
    return createProvider(store, request);
  }

  const providerById = path.match(/^\/v1\/providers\/([^/]+)$/);
  if (providerById && request.method === "PATCH") {
    return patchProvider(store, request, providerById[1]!);
  }

  const suspendMatch = path.match(/^\/v1\/operator\/identifiers\/([^/]+)\/suspend$/);
  if (request.method === "POST" && suspendMatch) {
    return operatorIdentifierAction(store, env, suspendMatch[1]!, "SUSPEND", request);
  }

  const reinstateMatch = path.match(/^\/v1\/operator\/identifiers\/([^/]+)\/reinstate$/);
  if (request.method === "POST" && reinstateMatch) {
    return operatorIdentifierAction(store, env, reinstateMatch[1]!, "REINSTATE", request);
  }

  const revokeMatch = path.match(/^\/v1\/operator\/identifiers\/([^/]+)\/revoke$/);
  if (request.method === "POST" && revokeMatch) {
    return operatorIdentifierAction(store, env, revokeMatch[1]!, "REVOKE", request);
  }

  const reclaimMatch = path.match(/^\/v1\/operator\/identifiers\/([^/]+)\/reclaim$/);
  if (request.method === "POST" && reclaimMatch) {
    return operatorIdentifierAction(store, env, reclaimMatch[1]!, "RECLAIM", request);
  }

  return null;
}

async function operatorIdentifierAction(
  store: RegistryStore,
  env: RegistryEnv,
  identifierId: string,
  kind: "SUSPEND" | "REINSTATE" | "REVOKE" | "RECLAIM",
  request: Request,
): Promise<Response> {
  const body = await readJson<{ notes?: string; new_controller_wallet?: string }>(request);

  if (kind === "REINSTATE") {
    const identifier = await store.getIdentifierById(identifierId);
    if (!identifier) {
      return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
    }
    await store.reinstateIdentifier(identifierId, "operator");
    await invalidateIdentifier(store, env, identifierId);
    const updated = await store.getIdentifierById(identifierId);
    return jsonResponse({ id: updated!.id, status: updated!.status });
  }

  const action: RegistryAction = kind;
  const error = await applyRegistryAction(store, env, identifierId, action, {
    notes: body.notes,
    newControllerWallet: body.new_controller_wallet,
    dualControlToken: request.headers.get("x-reclaim-dual-control")?.trim() || undefined,
  });
  if (error) {
    return error;
  }
  const updated = await store.getIdentifierById(identifierId);
  return jsonResponse({ id: updated!.id, status: updated!.status });
}

async function resolveComplaint(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  complaintId: string,
  hooks?: RegistryHooks,
): Promise<Response> {
  if (!authenticateOperator(request, env)) {
    return operatorUnauthorized();
  }

  const complaint = await store.getComplaint(complaintId);
  if (!complaint) {
    return errorResponse(apiError("NOT_FOUND", "Complaint was not found."), 404);
  }
  if (complaint.status === "RESOLVED" || complaint.status === "REJECTED") {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Complaint is already closed."),
      400,
    );
  }

  const body = await readJson<ResolveComplaintRequest>(request);
  const error = await applyRegistryAction(store, env, complaint.identifier_id, body.action, {
    notes: body.notes,
    newControllerWallet: body.new_controller_wallet,
    dualControlToken: request.headers.get("x-reclaim-dual-control")?.trim() || undefined,
  });
  if (error) {
    return error;
  }

  const status = body.action === "NO_ACTION" ? "REJECTED" : "RESOLVED";
  const updated = await store.resolveComplaint(complaintId, {
    status,
    action: body.action,
    notes: body.notes,
  });
  if (updated?.filing_provider_id) {
    scheduleProviderWebhook(store, hooks, {
      providerId: updated.filing_provider_id,
      event: "complaint.resolved",
      data: {
        complaint: {
          id: updated.id,
          identifier_id: updated.identifier_id,
          status: updated.status,
          resolution_action: updated.resolution_action ?? null,
          resolution_notes: updated.resolution_notes ?? null,
          updated_at: updated.updated_at,
        },
      },
    });
  }
  return jsonResponse(updated!);
}

async function createProvider(
  store: RegistryStore,
  request: Request,
): Promise<Response> {
  const body = await readJson<CreateProviderRequest>(request);
  if (!body.provider_id?.trim() || !body.name?.trim() || !body.api_key?.trim()) {
    return errorResponse(
      apiError("VALIDATION_ERROR", "provider_id, name, and api_key are required."),
      400,
    );
  }

  const existing = await store.getProviderById(body.provider_id);
  if (existing) {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Provider ID already exists."),
      409,
    );
  }

  const hash = await sha256Hex(body.api_key);
  const provider = await store.createProvider({
    providerId: body.provider_id,
    name: body.name,
    website: body.website,
    integrationLevel: body.integration_level,
    allowedIdentifierTypes: body.allowed_identifier_types ?? [],
    resolvePolicy: body.resolve_policy,
    apiKeyHash: hash,
  });
  return jsonResponse(provider, 201);
}

async function patchProvider(
  store: RegistryStore,
  request: Request,
  providerId: string,
): Promise<Response> {
  const body = await readJson<UpdateProviderRequest>(request);
  const patch: Parameters<RegistryStore["updateProvider"]>[1] = {
    name: body.name,
    website: body.website,
    status: body.status,
    integrationLevel: body.integration_level,
    allowedIdentifierTypes: body.allowed_identifier_types,
    resolvePolicy: body.resolve_policy,
  };
  if (body.api_key) {
    patch.apiKeyHash = await sha256Hex(body.api_key);
  }

  const updated = await store.updateProvider(providerId, patch);
  if (!updated) {
    return errorResponse(apiError("NOT_FOUND", "Provider was not found."), 404);
  }
  return jsonResponse(updated);
}
