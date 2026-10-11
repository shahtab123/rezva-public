import {
  apiError,
  type CreateNameRequest,
  type RegisterIdentifierRequest,
  type SubmitComplaintRequest,
  type UpdateIdentifierRequest,
} from "@universal-payment/protocol";
import {
  getIdentifierType,
  isNonRegisterableValue,
  listActiveIdentifierTypes,
  normalizeIdentifier,
  validateIdentifier,
} from "@universal-payment/identifier-types";
import {
  buildAuthContext,
  providerAllowsType,
  requireController,
  requireMerchantSetup,
  type RegistryEnv,
} from "./auth.js";
import type { RegistryConfig } from "./config.js";
import { nowIso } from "./config.js";
import { verifyControllerAuthorization, claimIdempotencyKey, storeIdempotencyResult } from "./controller-auth.js";
import { errorResponse, jsonResponse, readJson } from "./http.js";
import { enforceRateLimit } from "./rate-limit.js";
import {
  destinationsFingerprint,
  normalizeNativeName,
  validateNativeName,
  validatePaymentOptions,
} from "./validation.js";
import { invalidateResolveCache } from "./cache.js";
import {
  pendingActivationAt,
  removalAvailableAt,
  isPermanentlyUnavailable,
  advanceIdentifierState,
} from "./state.js";
import type { RegistryStore } from "./store.js";
import { handleOperatorRequest } from "./operator-routes.js";
import { handleNamespaceRequest } from "./namespace-routes.js";
import {
  identifierWebhookPayload,
  scheduleProviderWebhook,
  type RegistryHooks,
} from "./webhook-dispatch.js";

async function invalidateIdentifierCache(
  store: RegistryStore,
  env: RegistryEnv,
  identifierId: string,
): Promise<void> {
  const row = await store.getIdentifierById(identifierId);
  if (row) {
    await invalidateResolveCache(env, row.type, row.normalized_value);
  }
}

function mapIdentifierResponse(
  row: NonNullable<Awaited<ReturnType<RegistryStore["getIdentifierById"]>>>,
  paymentOptions?: Awaited<ReturnType<RegistryStore["listDestinationsAsInput"]>>,
) {
  return {
    id: row.id,
    type: row.type,
    value: row.display_value,
    status: row.status,
    controller: row.controller_id,
    name_id: row.name_id,
    registered_at: row.registered_at,
    activated_at: row.activated_at,
    last_updated: row.last_updated,
    last_payment_update: row.last_payment_update,
    available_at: row.available_at,
    pending_activation_at: row.pending_activation_at,
    ...(paymentOptions ? { payment_options: paymentOptions } : {}),
  };
}

export async function handleRegistryRequest(
  store: RegistryStore,
  config: RegistryConfig,
  request: Request,
  env: RegistryEnv,
  hooks?: RegistryHooks,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (request.method === "GET" && path === "/v1/identifier-types") {
    return jsonResponse({
      types: listActiveIdentifierTypes().map((type) => ({
        name: type.name,
        version: type.version,
        status: type.status,
        privacy: type.privacy,
        registration_eligible: type.registration_eligible,
        resolution_eligible: type.resolution_eligible,
      })),
    });
  }

  if (request.method === "POST" && path === "/v1/names") {
    return createName(store, request, env);
  }

  const nameAvailability = path.match(/^\/v1\/names\/([^/]+)\/availability$/);
  if (request.method === "GET" && nameAvailability) {
    const name = normalizeNativeName(decodeURIComponent(nameAvailability[1]!));
    if (!validateNativeName(name)) {
      return errorResponse(
        apiError("VALIDATION_ERROR", "Native name format is invalid."),
        400,
      );
    }
    const availability = await store.getNameAvailability(name);
    return jsonResponse(availability);
  }

  const nameById = path.match(/^\/v1\/names\/([^/]+)$/);
  if (nameById) {
    const id = decodeURIComponent(nameById[1]!);
    if (request.method === "GET") {
      return getName(store, request, env, id);
    }
    if (request.method === "PATCH") {
      return patchName(store, request, env, id);
    }
    if (request.method === "DELETE") {
      return deleteName(store, request, env, id);
    }
  }

  const controllerNames = path.match(/^\/v1\/controllers\/([^/]+)\/names$/);
  if (request.method === "GET" && controllerNames) {
    return listControllerNames(
      store,
      request,
      env,
      decodeURIComponent(controllerNames[1]!),
    );
  }

  const controllerIdentifiers = path.match(/^\/v1\/controllers\/([^/]+)\/identifiers$/);
  if (request.method === "GET" && controllerIdentifiers) {
    return listControllerIdentifiers(
      store,
      config,
      request,
      env,
      decodeURIComponent(controllerIdentifiers[1]!),
    );
  }

  if (request.method === "POST" && path === "/v1/identifiers") {
    return registerIdentifier(store, config, request, env, hooks);
  }

  const identifierAvailability = path.match(
    /^\/v1\/identifiers\/([^/]+)\/([^/]+)\/availability$/,
  );
  if (request.method === "GET" && identifierAvailability) {
    return identifierAvailabilityCheck(
      store,
      request,
      env,
      decodeURIComponent(identifierAvailability[1]!),
      decodeURIComponent(identifierAvailability[2]!),
    );
  }

  const emergencySuspend = path.match(
    /^\/v1\/identifiers\/([^/]+)\/emergency-suspend$/,
  );
  if (request.method === "POST" && emergencySuspend) {
    return emergencySuspendIdentifier(
      store,
      request,
      env,
      decodeURIComponent(emergencySuspend[1]!),
    );
  }

  const identifierHistory = path.match(/^\/v1\/identifiers\/([^/]+)\/history$/);
  if (request.method === "GET" && identifierHistory) {
    return getIdentifierHistory(store, request, env, identifierHistory[1]!);
  }

  const identifierById = path.match(/^\/v1\/identifiers\/([^/]+)$/);
  if (identifierById) {
    const id = decodeURIComponent(identifierById[1]!);
    if (request.method === "GET") {
      return getIdentifier(store, request, env, id);
    }
    if (request.method === "PATCH") {
      return patchIdentifier(store, config, request, env, id, hooks);
    }
    if (request.method === "DELETE") {
      return deleteIdentifier(store, config, request, env, id, hooks);
    }
  }

  if (request.method === "POST" && path === "/v1/complaints") {
    return submitComplaint(store, request, env, hooks);
  }

  if (request.method === "GET" && path === "/v1/complaints") {
    return listReporterComplaints(store, request, env);
  }

  const complaintById = path.match(/^\/v1\/complaints\/([^/]+)$/);
  if (request.method === "GET" && complaintById) {
    return getComplaint(store, request, env, complaintById[1]!);
  }

  const namespaceResponse = await handleNamespaceRequest(store, request, env, hooks);
  if (namespaceResponse) {
    return namespaceResponse;
  }

  const operatorResponse = await handleOperatorRequest(store, request, env, hooks);
  if (operatorResponse) {
    return operatorResponse;
  }

  return null;
}

async function createName(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth) {
    return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  if (!requireController(auth)) {
    return errorResponse(
      apiError("UNAUTHORIZED", "Controller authorization is required."),
      401,
    );
  }
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "CREATE_NAME",
    resource: "name:new",
  });
  if (authz) {
    return authz;
  }

  const limited = await enforceRateLimit(
    env,
    `register-name:${auth.provider.provider_id}`,
    30,
    60,
  );
  if (limited) {
    return limited;
  }

  const body = await readJson<CreateNameRequest>(request);
  const name = normalizeNativeName(body.name);
  if (!validateNativeName(name)) {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Native name format is invalid."),
      400,
    );
  }
  const availability = await store.getNameAvailability(name);
  if (!availability.available) {
    return errorResponse(
      apiError(
        "NAME_UNAVAILABLE",
        availability.reserved
          ? "This native name is reserved."
          : "This native name is not available.",
      ),
      409,
    );
  }

  const record = await store.createNativeName(name, auth.controllerId!);
  return jsonResponse(record, 201);
}

async function listControllerNames(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  wallet: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  if (auth.controllerWallet?.toLowerCase() !== wallet.toLowerCase()) {
    return errorResponse(apiError("FORBIDDEN", "Controller wallet mismatch."), 403);
  }
  const names = await store.listNamesByControllerWallet(wallet);
  return jsonResponse({ names });
}

async function listControllerIdentifiers(
  store: RegistryStore,
  config: RegistryConfig,
  request: Request,
  env: RegistryEnv,
  wallet: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  if (auth.controllerWallet?.toLowerCase() !== wallet.toLowerCase()) {
    return errorResponse(apiError("FORBIDDEN", "Controller wallet mismatch."), 403);
  }
  const rows = await store.listIdentifiersByControllerWallet(wallet);
  const identifiers = await Promise.all(
    rows.map(async (row) => {
      const current = await advanceIdentifierState(store, row, config);
      return {
        ...mapIdentifierResponse(
          current,
          await store.listDestinationsAsInput(current.id),
        ),
      };
    }),
  );
  return jsonResponse({ identifiers });
}

async function getName(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth) {
    return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
  }
  const record = await store.getNativeNameById(id);
  if (!record) {
    return errorResponse(apiError("NAME_NOT_FOUND", "Native name was not found."), 404);
  }
  return jsonResponse(record);
}

async function patchName(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "UPDATE_NAME",
    resource: `name:${id}`,
  });
  if (authz) {
    return authz;
  }
  const body = await readJson<{
    status?: "active" | "pending_review" | "removed";
    proof_status?: "not_required" | "requested" | "received" | "accepted" | "rejected";
    review_notes?: string | null;
  }>(request);

  const existing = await store.getNativeNameById(id);
  if (!existing || existing.controller_id !== auth.controllerId) {
    return errorResponse(apiError("NAME_NOT_FOUND", "Native name was not found."), 404);
  }

  if (
    existing.status === "pending_review" &&
    body.status === "active" &&
    existing.review_tier === "protected"
  ) {
    return errorResponse(
      apiError(
        "FORBIDDEN",
        "Protected dictionary names require operator activation after review (and any email proof).",
      ),
      403,
    );
  }

  const updated = await store.updateNativeName(id, auth.controllerId!, body);
  if (!updated) {
    return errorResponse(apiError("FORBIDDEN", "Not authorized to update this name."), 403);
  }
  return jsonResponse(updated);
}

async function deleteName(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "DELETE_NAME",
    resource: `name:${id}`,
  });
  if (authz) {
    return authz;
  }
  const updated = await store.updateNativeName(id, auth.controllerId!, {
    status: "removed",
  });
  if (!updated) {
    return errorResponse(apiError("FORBIDDEN", "Not authorized to remove this name."), 403);
  }
  return jsonResponse(updated);
}

async function registerIdentifier(
  store: RegistryStore,
  config: RegistryConfig,
  request: Request,
  env: RegistryEnv,
  hooks?: RegistryHooks,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth) {
    return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  if (!requireController(auth)) {
    return errorResponse(
      apiError("UNAUTHORIZED", "Controller authorization is required."),
      401,
    );
  }

  const limited = await enforceRateLimit(
    env,
    `register-id:${auth.provider.provider_id}`,
    30,
    60,
  );
  if (limited) {
    return limited;
  }

  const body = await readJson<RegisterIdentifierRequest>(request);
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "REGISTER_IDENTIFIER",
    resource: `identifier:${body.type}:${body.value}`,
  });
  if (authz) {
    return authz;
  }

  const idempotencyKey = request.headers.get("idempotency-key")?.trim() ?? null;
  const idem = await claimIdempotencyKey(
    env,
    `register:${auth.controllerId}`,
    idempotencyKey,
  );
  if (idem?.conflict) {
    return idem.conflict;
  }
  if (idem?.replay) {
    return jsonResponse(idem.replay, 200);
  }

  const typeDef = getIdentifierType(body.type);
  if (!typeDef || !typeDef.registration_eligible || typeDef.status !== "active") {
    return errorResponse(
      apiError("TYPE_NOT_SUPPORTED", "Identifier type is not supported."),
      400,
    );
  }
  if (!providerAllowsType(auth.provider, body.type)) {
    return errorResponse(
      apiError("FORBIDDEN", "Provider may not register this identifier type."),
      403,
    );
  }
  if (isNonRegisterableValue(body.value)) {
    return errorResponse(
      apiError("IDENTIFIER_INVALID", "This value cannot be registered."),
      400,
    );
  }
  const normalized = normalizeIdentifier(body.type, body.value);
  if (!normalized || !validateIdentifier(body.type, body.value)) {
    return errorResponse(
      apiError("IDENTIFIER_INVALID", "Identifier value is invalid."),
      400,
    );
  }
  const paymentError = validatePaymentOptions(body.payment_options);
  if (paymentError) {
    return errorResponse(
      apiError("DESTINATION_INVALID", paymentError),
      400,
    );
  }

  if (body.name_id) {
    const name = await store.getNativeNameById(body.name_id);
    if (!name || name.controller_id !== auth.controllerId) {
      return errorResponse(
        apiError("FORBIDDEN", "Name does not belong to this controller."),
        403,
      );
    }
  }

  const existing = await store.getIdentifierByTypeValue(body.type, normalized);
  if (existing && existing.status !== "removed" && existing.status !== "revoked") {
    return errorResponse(
      apiError("IDENTIFIER_ALREADY_REGISTERED", "This identifier is already registered."),
      409,
    );
  }
  if (existing && (existing.status === "removed" || existing.status === "revoked")) {
    if (isPermanentlyUnavailable(existing)) {
      return errorResponse(
        apiError("IDENTIFIER_ALREADY_REGISTERED", "This identifier was permanently revoked."),
        409,
      );
    }
    if (existing.available_at && Date.parse(existing.available_at) > Date.now()) {
      return errorResponse(
        apiError("IDENTIFIER_ALREADY_REGISTERED", "This identifier is in cooldown."),
        409,
      );
    }
    await store.purgeRemovedIdentifier(existing.id);
  }

  const timestamp = nowIso();
  const created = await store.createIdentifier({
    type: body.type,
    normalizedValue: normalized,
    displayValue: body.value,
    controllerId: auth.controllerId!,
    nameId: body.name_id ?? null,
    pendingActivationAt: pendingActivationAt(timestamp, config, "registration"),
    paymentOptions: body.payment_options,
  });

  await invalidateResolveCache(env, body.type, normalized);
  const payload = mapIdentifierResponse(created, body.payment_options);
  scheduleProviderWebhook(store, hooks, {
    providerId: auth.provider.provider_id,
    event: "identifier.registered",
    data: identifierWebhookPayload(created, body.payment_options),
  });
  await storeIdempotencyResult(
    env,
    `register:${auth.controllerId}`,
    idempotencyKey,
    payload,
  );
  return jsonResponse(payload, 201);
}

async function identifierAvailabilityCheck(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  type: string,
  value: string,
): Promise<Response> {
  const typeDef = getIdentifierType(type);
  if (!typeDef) {
    return errorResponse(
      apiError("TYPE_NOT_SUPPORTED", "Identifier type is not supported."),
      400,
    );
  }

  const sensitive =
    typeDef.privacy === "HIGH_SENSITIVITY" || typeDef.privacy === "SENSITIVE";
  if (sensitive) {
    const auth = await buildAuthContext(store, request, env);
    if (!auth) {
      return errorResponse(
        apiError("UNAUTHORIZED", "Authentication required for sensitive identifier availability."),
        401,
      );
    }
    const limited = await enforceRateLimit(
      env,
      `avail-sensitive:${auth.provider.provider_id}`,
      20,
      60,
    );
    if (limited) {
      return limited;
    }
  } else {
    const limited = await enforceRateLimit(env, `avail-public:${type}`, 120, 60);
    if (limited) {
      return limited;
    }
  }

  const normalized = normalizeIdentifier(type, value);
  if (!normalized) {
    return errorResponse(
      apiError("IDENTIFIER_INVALID", "Identifier value is invalid."),
      400,
    );
  }
  const existing = await store.getIdentifierByTypeValue(type, normalized);
  const free =
    !existing ||
    ((existing.status === "removed" || existing.status === "revoked") &&
      existing.available_at &&
      Date.parse(existing.available_at) <= Date.now() &&
      !isPermanentlyUnavailable(existing));

  if (free) {
    return jsonResponse({ available: true, type });
  }

  if (sensitive) {
    return jsonResponse({
      available: false,
      type,
      reason: "unavailable",
    });
  }

  return jsonResponse({
    available: false,
    type,
    status: existing!.status,
    removal_kind:
      existing!.status === "revoked"
        ? "permanent"
        : existing!.status === "removed"
          ? "cooldown"
          : undefined,
  });
}

async function getIdentifier(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(
      apiError("UNAUTHORIZED", "Controller wallet authorization is required."),
      401,
    );
  }
  const row = await store.getIdentifierById(id);
  if (!row) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }
  if (row.controller_id !== auth.controllerId) {
    return errorResponse(apiError("FORBIDDEN", "Not authorized to view this identifier."), 403);
  }
  const paymentOptions = await store.listDestinationsAsInput(id);
  return jsonResponse(mapIdentifierResponse(row, paymentOptions));
}

async function patchIdentifier(
  store: RegistryStore,
  config: RegistryConfig,
  request: Request,
  env: RegistryEnv,
  id: string,
  hooks?: RegistryHooks,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "UPDATE_IDENTIFIER",
    resource: `identifier:${id}`,
  });
  if (authz) {
    return authz;
  }

  const row = await store.getIdentifierById(id);
  if (!row) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }
  if (row.controller_id !== auth.controllerId) {
    return errorResponse(apiError("FORBIDDEN", "Not authorized to update this identifier."), 403);
  }
  if (
    row.status === "removed" ||
    row.status === "revoked" ||
    row.status === "suspended"
  ) {
    return errorResponse(
      apiError("FORBIDDEN", "Identifier cannot be updated in its current state."),
      403,
    );
  }

  const body = await readJson<UpdateIdentifierRequest>(request);

  if (body.name_id !== undefined) {
    if (body.name_id) {
      const name = await store.getNativeNameById(body.name_id);
      if (!name || name.controller_id !== auth.controllerId) {
        return errorResponse(
          apiError("FORBIDDEN", "Name does not belong to this controller."),
          403,
        );
      }
    }
    await store.updateIdentifierMetadata(id, { nameId: body.name_id ?? null });
  }

  if (body.payment_options) {
    const paymentError = validatePaymentOptions(body.payment_options);
    if (paymentError) {
      return errorResponse(apiError("DESTINATION_INVALID", paymentError), 400);
    }
    const current = await store.listDestinationsAsInput(id);
    if (
      destinationsFingerprint(current) !== destinationsFingerprint(body.payment_options)
    ) {
      const timestamp = nowIso();
      await store.setUpdatePending(
        id,
        pendingActivationAt(timestamp, config, "update"),
        body.payment_options,
        timestamp,
      );
    }
  }

  const updated = await store.getIdentifierById(id);
  const paymentOptions = await store.listDestinationsAsInput(id);
  await invalidateIdentifierCache(store, env, id);
  if (updated) {
    scheduleProviderWebhook(store, hooks, {
      providerId: auth.provider.provider_id,
      event: "identifier.updated",
      data: identifierWebhookPayload(updated, paymentOptions),
    });
  }
  return jsonResponse(mapIdentifierResponse(updated!, paymentOptions));
}

async function deleteIdentifier(
  store: RegistryStore,
  config: RegistryConfig,
  request: Request,
  env: RegistryEnv,
  id: string,
  hooks?: RegistryHooks,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "DELETE_IDENTIFIER",
    resource: `identifier:${id}`,
  });
  if (authz) {
    return authz;
  }

  const row = await store.getIdentifierById(id);
  if (!row) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }
  if (row.controller_id !== auth.controllerId) {
    return errorResponse(apiError("FORBIDDEN", "Not authorized to remove this identifier."), 403);
  }
  if (row.status === "revoked") {
    return errorResponse(
      apiError("FORBIDDEN", "Revoked identifiers cannot be removed again."),
      403,
    );
  }

  const removedAt = nowIso();
  const availableAt = removalAvailableAt(removedAt, config);
  await store.removeIdentifier(id, removedAt, availableAt);
  await invalidateIdentifierCache(store, env, id);
  const removed = await store.getIdentifierById(id);
  if (removed) {
    scheduleProviderWebhook(store, hooks, {
      providerId: auth.provider.provider_id,
      event: "identifier.removed",
      data: identifierWebhookPayload(removed),
    });
  }
  return jsonResponse({ id, status: "removed", available_at: availableAt });
}

async function emergencySuspendIdentifier(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(apiError("UNAUTHORIZED", "Authorization failed."), 401);
  }
  const merchantBlocked = requireMerchantSetup(auth);
  if (merchantBlocked) {
    return merchantBlocked;
  }
  const authz = await verifyControllerAuthorization(request, env, {
    controllerWallet: auth.controllerWallet!,
    operation: "EMERGENCY_SUSPEND",
    resource: `identifier:${id}`,
  });
  if (authz) {
    return authz;
  }

  const row = await store.getIdentifierById(id);
  if (!row) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }
  if (row.controller_id !== auth.controllerId) {
    return errorResponse(
      apiError("FORBIDDEN", "Not authorized to suspend this identifier."),
      403,
    );
  }
  if (row.status === "removed" || row.status === "revoked") {
    return errorResponse(
      apiError("FORBIDDEN", "Identifier cannot be suspended in its current state."),
      403,
    );
  }

  const body = await readJson<{ reason?: string }>(request).catch(() => ({
    reason: undefined as string | undefined,
  }));
  await store.suspendIdentifier(
    id,
    body.reason ?? "controller_emergency_suspend",
  );
  await invalidateIdentifierCache(store, env, id);
  return jsonResponse({
    id,
    status: "suspended",
    reason: body.reason ?? "controller_emergency_suspend",
  });
}

async function getIdentifierHistory(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth || !requireController(auth)) {
    return errorResponse(
      apiError("UNAUTHORIZED", "Controller wallet authorization is required."),
      401,
    );
  }
  const row = await store.getIdentifierById(id);
  if (!row) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }
  if (row.controller_id !== auth.controllerId) {
    return errorResponse(apiError("FORBIDDEN", "Not authorized to view this identifier."), 403);
  }
  const events = await store.listEvents(id);
  return jsonResponse({ identifier_id: id, events });
}

async function submitComplaint(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  hooks?: RegistryHooks,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth) {
    return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
  }

  const contentLength = Number(request.headers.get("content-length") ?? 0);
  if (contentLength > 128 * 1024) {
    return errorResponse(apiError("VALIDATION_ERROR", "Complaint payload is too large."), 413);
  }
  const limited = await enforceRateLimit(
    env,
    `complaint:${auth.provider.provider_id}`,
    20,
    60,
  );
  if (limited) {
    return limited;
  }

  let body: SubmitComplaintRequest;
  try {
    body = await readJson<SubmitComplaintRequest>(request);
  } catch {
    return errorResponse(apiError("VALIDATION_ERROR", "Invalid complaint JSON."), 400);
  }
  const reason = body.reason?.trim();
  const description = body.description?.trim();
  const reporterUserId = body.reporter_user_id?.trim() || null;
  if (
    !reason ||
    reason.length > 120 ||
    !description ||
    description.length > 10_000 ||
    (body.evidence?.some((item) => typeof item !== "string" || item.length > 20_000) ?? false) ||
    (body.evidence?.length ?? 0) > 20
  ) {
    return errorResponse(
      apiError("VALIDATION_ERROR", "Complaint fields or evidence exceed allowed limits."),
      400,
    );
  }

  let identifierId = body.identifier_id?.trim();
  if (!identifierId && body.target_type?.trim() && body.target_value?.trim()) {
    const normalized = normalizeIdentifier(
      body.target_type.trim(),
      body.target_value.trim(),
    );
    if (!normalized) {
      return errorResponse(apiError("IDENTIFIER_INVALID", "Complaint target is invalid."), 400);
    }
    const target = await store.getIdentifierByTypeValue(
      body.target_type.trim(),
      normalized,
    );
    identifierId = target?.id;
  }
  if (!identifierId) {
    return errorResponse(
      apiError("IDENTIFIER_NOT_FOUND", "Complaint target was not found."),
      404,
    );
  }
  const identifier = await store.getIdentifierById(identifierId);
  if (!identifier) {
    return errorResponse(apiError("IDENTIFIER_NOT_FOUND", "Identifier was not found."), 404);
  }

  const complaint = await store.createComplaint({
    identifierId,
    reporterUserId,
    filingProviderId: auth.provider.provider_id,
    reason,
    description,
    evidence: body.evidence ?? [],
  });
  scheduleProviderWebhook(store, hooks, {
    providerId: auth.provider.provider_id,
    event: "complaint.filed",
    data: {
      complaint: {
        id: complaint.id,
        identifier_id: complaint.identifier_id,
        reason: complaint.reason,
        status: complaint.status,
        created_at: complaint.created_at,
      },
      identifier: {
        id: identifier.id,
        type: identifier.type,
        value: identifier.display_value,
        status: identifier.status,
      },
    },
  });
  return jsonResponse(complaint, 201);
}

async function listReporterComplaints(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth) {
    return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
  }
  const reporterUserId = new URL(request.url).searchParams.get("reporter_user_id")?.trim();
  const claimedOwner = request.headers.get("x-dashboard-owner-user-id")?.trim();
  if (!reporterUserId || reporterUserId.length > 200) {
    return errorResponse(apiError("VALIDATION_ERROR", "reporter_user_id is required."), 400);
  }
  // Dashboard BFF must attest the owner; bare provider keys cannot list arbitrary reporters.
  if (!claimedOwner || claimedOwner !== reporterUserId) {
    return errorResponse(
      apiError("FORBIDDEN", "reporter_user_id must match the authenticated dashboard owner."),
      403,
    );
  }
  const complaints = await store.listComplaintsForReporter(reporterUserId, 100);
  return jsonResponse({ complaints });
}

async function getComplaint(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  id: string,
): Promise<Response> {
  const auth = await buildAuthContext(store, request, env);
  if (!auth) {
    return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
  }
  const complaint = await store.getComplaint(id);
  if (!complaint) {
    return errorResponse(apiError("NOT_FOUND", "Complaint was not found."), 404);
  }
  const reporterUserId = new URL(request.url).searchParams.get("reporter_user_id")?.trim();
  const claimedOwner = request.headers.get("x-dashboard-owner-user-id")?.trim();
  if (
    !reporterUserId ||
    !claimedOwner ||
    claimedOwner !== reporterUserId ||
    complaint.reporter_user_id !== reporterUserId
  ) {
    return errorResponse(apiError("NOT_FOUND", "Complaint was not found."), 404);
  }
  return jsonResponse(complaint);
}
