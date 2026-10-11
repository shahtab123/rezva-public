import { apiError } from "@universal-payment/protocol";
import {
  authenticateProvider,
  getControllerWallet,
  type RegistryEnv,
} from "./auth.js";
import { verifyControllerAuthorization } from "./controller-auth.js";
import { invalidateResolveCache } from "./cache.js";
import { isExternalNamespaceName } from "./external-namespace-rules.js";
import { errorResponse, jsonResponse, readJson } from "./http.js";
import type { RegistryStore } from "./store.js";
import {
  scheduleProviderWebhook,
  type RegistryHooks,
} from "./webhook-dispatch.js";

/** True when slug would collide with an external naming TLD (eth, sol, crypto, …). */
function isExternalNamingSlug(slug: string): boolean {
  const normalized = slug.trim().toLowerCase().replace(/^\./, "");
  if (!normalized) return false;
  // Probe with a dummy label so namespace rules match `label.<slug>`.
  return isExternalNamespaceName(`rezva-probe.${normalized}`);
}
async function authenticateApprovedProvider(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
) {
  const provider = await authenticateProvider(store, request, env);
  return provider?.status === "APPROVED" ? provider : null;
}

async function requireDestinationControllerAuth(
  request: Request,
  env: RegistryEnv,
  resource: string,
  operation: string,
): Promise<Response | null> {
  const controllerWallet = getControllerWallet(request);
  if (!controllerWallet) {
    return errorResponse(
      apiError(
        "CONTROLLER_UNAUTHORIZED",
        "X-Controller-Wallet is required when setting a payment destination.",
      ),
      401,
    );
  }
  return verifyControllerAuthorization(request, env, {
    controllerWallet,
    operation,
    resource,
  });
}

function normalizeSlug(input: string): string {
  return input.trim().replace(/^\./, "").toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function normalizeLabel(input: string): string {
  return input.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
}

function mapNamespace(row: Record<string, string | null>) {
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
  };
}

function mapNamespaceName(row: Record<string, string | null>) {
  return {
    id: row.id,
    namespace: row.namespace_slug,
    label: row.label,
    full_name: row.full_name,
    status: row.status,
    controller_ref: row.controller_ref,
    destination_preview: row.destination_preview,
    chain: row.chain,
    asset: row.asset,
    address: row.address,
    registered_at: row.registered_at,
    activated_at: row.activated_at,
    last_updated: row.last_updated,
    last_payment_update: row.last_payment_update,
  };
}

export async function handleNamespaceRequest(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  hooks?: RegistryHooks,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;

  if (!path.startsWith("/v1/namespaces")) {
    return null;
  }

  if (request.method === "GET" && path === "/v1/namespaces") {
    const provider = await authenticateApprovedProvider(store, request, env);
    if (!provider) {
      return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
    }
    const rows = await store.listProviderNamespaces(provider.provider_id);
    return jsonResponse({ namespaces: rows.map(mapNamespace) });
  }

  if (request.method === "POST" && path === "/v1/namespaces") {
    const provider = await authenticateApprovedProvider(store, request, env);
    if (!provider) {
      return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
    }
    const body = await readJson<{
      slug?: string;
      description?: string;
      registration_policy?: string;
      reserved_names?: string[];
    }>(request);
    const slug = normalizeSlug(body.slug ?? "");
    if (!slug || slug.length < 2) {
      return errorResponse(apiError("VALIDATION_ERROR", "Invalid namespace slug."), 400);
    }
    if (isExternalNamingSlug(slug)) {
      return errorResponse(
        apiError(
          "VALIDATION_ERROR",
          "This namespace slug is reserved for an external naming system and cannot be registered.",
        ),
        400,
      );
    }
    const existing = await store.getProviderNamespace(slug);
    if (existing) {
      return errorResponse(apiError("VALIDATION_ERROR", "Namespace already exists."), 409);
    }
    const row = await store.createProviderNamespace({
      slug,
      providerId: provider.provider_id,
      description: body.description,
      registrationPolicy: body.registration_policy,
      reservedNames: body.reserved_names?.map((n) => normalizeLabel(n)),
      status: "submitted",
    });
    return jsonResponse(mapNamespace(row), 201);
  }

  const usageMatch = path.match(/^\/v1\/namespaces\/([^/]+)\/usage$/);
  if (request.method === "GET" && usageMatch) {
    const slug = normalizeSlug(decodeURIComponent(usageMatch[1]!));
    const usage = await store.getNamespaceUsage(slug);
    return jsonResponse({ namespace: slug, usage });
  }

  const availabilityMatch = path.match(
    /^\/v1\/namespaces\/([^/]+)\/names\/([^/]+)\/availability$/,
  );
  if (request.method === "GET" && availabilityMatch) {
    const slug = normalizeSlug(decodeURIComponent(availabilityMatch[1]!));
    const label = normalizeLabel(decodeURIComponent(availabilityMatch[2]!));
    const availability = await store.getNamespaceNameAvailability(slug, label);
    return jsonResponse({ namespace: slug, label, ...availability });
  }

  const namesCollection = path.match(/^\/v1\/namespaces\/([^/]+)\/names$/);
  if (namesCollection && request.method === "POST") {
    const provider = await authenticateApprovedProvider(store, request, env);
    if (!provider) {
      return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
    }
    const slug = normalizeSlug(decodeURIComponent(namesCollection[1]!));
    const ns = await store.getProviderNamespace(slug);
    if (!ns || ns.provider_id !== provider.provider_id) {
      return errorResponse(apiError("FORBIDDEN", "Namespace not found for provider."), 403);
    }
    if (ns.status !== "active") {
      return errorResponse(apiError("FORBIDDEN", "Namespace is not active."), 403);
    }
    const body = await readJson<{
      label?: string;
      controller_ref?: string;
      chain?: string;
      asset?: string;
      address?: string;
    }>(request);
    const label = normalizeLabel(body.label ?? "");
    if (!label) {
      return errorResponse(apiError("VALIDATION_ERROR", "label is required."), 400);
    }
    const availability = await store.getNamespaceNameAvailability(slug, label);
    if (!availability.available) {
      return errorResponse(apiError("NAME_UNAVAILABLE", "Name is not available."), 409);
    }
    if (body.address || body.chain || body.asset) {
      if (!body.address || !body.chain || !body.asset) {
        return errorResponse(
          apiError("VALIDATION_ERROR", "chain, asset, and address are required together."),
          400,
        );
      }
      const authz = await requireDestinationControllerAuth(
        request,
        env,
        `namespace_name:${label}.${slug}`,
        "REGISTER_NAMESPACE_NAME",
      );
      if (authz) return authz;
    }
    const row = await store.createNamespaceName({
      namespaceSlug: slug,
      label,
      controllerRef: body.controller_ref ?? getControllerWallet(request) ?? undefined,
      chain: body.chain,
      asset: body.asset,
      address: body.address,
    });
    scheduleProviderWebhook(store, hooks, {
      providerId: provider.provider_id,
      event: "namespace.name_registered",
      data: { name: mapNamespaceName(row) },
    });
    return jsonResponse(mapNamespaceName(row), 201);
  }

  const nameByLabel = path.match(/^\/v1\/namespaces\/([^/]+)\/names\/([^/]+)$/);
  if (nameByLabel) {
    const slug = normalizeSlug(decodeURIComponent(nameByLabel[1]!));
    const label = normalizeLabel(decodeURIComponent(nameByLabel[2]!));
    const provider = await authenticateApprovedProvider(store, request, env);
    if (!provider) {
      return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
    }
    const ns = await store.getProviderNamespace(slug);
    if (!ns || ns.provider_id !== provider.provider_id) {
      return errorResponse(apiError("FORBIDDEN", "Namespace not found for provider."), 403);
    }

    if (request.method === "GET") {
      const row = await store.getNamespaceName(slug, label);
      if (!row) {
        return errorResponse(apiError("NOT_FOUND", "Name not found."), 404);
      }
      return jsonResponse(mapNamespaceName(row));
    }

    if (request.method === "PATCH") {
      const body = await readJson<{
        status?: string;
        controller_ref?: string;
        chain?: string;
        asset?: string;
        address?: string;
      }>(request);
      if (body.address !== undefined || body.chain !== undefined || body.asset !== undefined) {
        if (!body.address || !body.chain || !body.asset) {
          return errorResponse(
            apiError("VALIDATION_ERROR", "chain, asset, and address are required together."),
            400,
          );
        }
        const authz = await requireDestinationControllerAuth(
          request,
          env,
          `namespace_name:${label}.${slug}`,
          "UPDATE_NAMESPACE_NAME",
        );
        if (authz) return authz;
      }
      const updated = await store.updateNamespaceName(slug, label, {
        status: body.status,
        controllerRef: body.controller_ref,
        chain: body.chain,
        asset: body.asset,
        address: body.address,
      });
      if (!updated) {
        return errorResponse(apiError("NOT_FOUND", "Name not found."), 404);
      }
      await invalidateResolveCache(
        env,
        "provider_name",
        `${label.toLowerCase()}.${slug.toLowerCase()}`,
      );
      return jsonResponse(mapNamespaceName(updated));
    }

    if (request.method === "DELETE") {
      const updated = await store.updateNamespaceName(slug, label, { status: "removed" });
      if (!updated) {
        return errorResponse(apiError("NOT_FOUND", "Name not found."), 404);
      }
      await invalidateResolveCache(
        env,
        "provider_name",
        `${label.toLowerCase()}.${slug.toLowerCase()}`,
      );
      return jsonResponse(mapNamespaceName(updated));
    }
  }

  const namespaceGet = path.match(/^\/v1\/namespaces\/([^/]+)$/);
  if (request.method === "GET" && namespaceGet) {
    const provider = await authenticateApprovedProvider(store, request, env);
    if (!provider) {
      return errorResponse(apiError("UNAUTHORIZED", "Provider authentication failed."), 401);
    }
    const slug = normalizeSlug(decodeURIComponent(namespaceGet[1]!));
    const ns = await store.getProviderNamespace(slug);
    if (!ns || ns.provider_id !== provider.provider_id) {
      return errorResponse(apiError("NOT_FOUND", "Namespace not found."), 404);
    }
    const names = await store.listNamespaceNames(slug);
    const usage = await store.getNamespaceUsage(slug);
    return jsonResponse({
      namespace: mapNamespace(ns),
      names: names.map(mapNamespaceName),
      usage,
    });
  }

  return null;
}
