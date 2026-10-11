import type {
  ApiError,
  ApiErrorCode,
  ComplaintRecord,
  CreateNameRequest,
  CreateProviderRequest,
  IdentifierAvailabilityResponse,
  IdentifierResponse,
  NameAvailabilityResponse,
  NativeNameRecord,
  RegisterIdentifierRequest,
  RegistryEventRecord,
  RemoveIdentifierResponse,
  ResolveComplaintRequest,
  ResolveRequest,
  ResolveResponse,
  SubmitComplaintRequest,
  UpdateIdentifierRequest,
  UpdateProviderRequest,
  WalletProviderRecord,
} from "@universal-payment/protocol";
import { resolvePaste as resolvePasteValue } from "./paste.js";

export type ClientOptions = {
  baseUrl: string;
  apiKey?: string;
  controllerWallet?: string;
  /** JSON string or object for X-Controller-Authorization (hmac mode). */
  controllerAuthorization?: string | Record<string, unknown>;
  idempotencyKey?: string;
  fetch?: typeof fetch;
};

export class ProtocolApiError extends Error {
  readonly code: ApiErrorCode;
  readonly status: number;

  constructor(code: ApiErrorCode, message: string, status: number) {
    super(message);
    this.name = "ProtocolApiError";
    this.code = code;
    this.status = status;
  }
}

function buildHeaders(options: ClientOptions): HeadersInit {
  const authz =
    typeof options.controllerAuthorization === "string"
      ? options.controllerAuthorization
      : options.controllerAuthorization
        ? JSON.stringify(options.controllerAuthorization)
        : undefined;
  return {
    "content-type": "application/json",
    ...(options.apiKey ? { authorization: `Bearer ${options.apiKey}` } : {}),
    ...(options.controllerWallet
      ? { "x-controller-wallet": options.controllerWallet }
      : {}),
    ...(authz ? { "x-controller-authorization": authz } : {}),
    ...(options.idempotencyKey
      ? { "idempotency-key": options.idempotencyKey }
      : {}),
  };
}

async function requestJson<T>(
  options: ClientOptions,
  path: string,
  init?: RequestInit,
): Promise<T> {
  const fetchImpl = options.fetch ?? fetch;
  const response = await fetchImpl(`${options.baseUrl.replace(/\/$/, "")}${path}`, {
    ...init,
    headers: {
      ...buildHeaders(options),
      ...(init?.headers ?? {}),
    },
  });

  if (!response.ok) {
    const body = await response.text();
    try {
      const parsed = JSON.parse(body) as ApiError;
      if (parsed.error?.code) {
        throw new ProtocolApiError(
          parsed.error.code,
          parsed.error.message,
          response.status,
        );
      }
    } catch (error) {
      if (error instanceof ProtocolApiError) {
        throw error;
      }
    }
    throw new ProtocolApiError("INTERNAL_ERROR", body || response.statusText, response.status);
  }

  return (await response.json()) as T;
}

export class ResolverClient {
  private readonly options: ClientOptions;

  constructor(options: ClientOptions) {
    this.options = options;
  }

  async resolve(request: ResolveRequest): Promise<ResolveResponse> {
    return requestJson<ResolveResponse>(this.options, "/v1/resolve", {
      method: "POST",
      body: JSON.stringify(request),
    });
  }

  /**
   * Resolve a pasted Send string. Always sends `{ value }` (no `type`) so
   * Universal Name Resolution and type inference run on the Worker.
   * Prefer this over local ENS/SNS for payment destinations.
   */
  async resolvePaste(value: string): Promise<ResolveResponse> {
    return resolvePasteValue(value, this.options);
  }
}

export class RegistryClient {
  private readonly options: ClientOptions;

  constructor(options: ClientOptions) {
    this.options = options;
  }

  createName(body: CreateNameRequest): Promise<NativeNameRecord> {
    return requestJson<NativeNameRecord>(this.options, "/v1/names", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getNameAvailability(name: string): Promise<NameAvailabilityResponse> {
    return requestJson<NameAvailabilityResponse>(
      this.options,
      `/v1/names/${encodeURIComponent(name)}/availability`,
    );
  }

  getName(id: string): Promise<NativeNameRecord> {
    return requestJson<NativeNameRecord>(
      this.options,
      `/v1/names/${encodeURIComponent(id)}`,
    );
  }

  updateName(
    id: string,
    body: {
      status?: "active" | "pending_review" | "removed";
      proof_status?: "not_required" | "requested" | "received" | "accepted" | "rejected";
      review_notes?: string | null;
    },
  ): Promise<NativeNameRecord> {
    return requestJson<NativeNameRecord>(
      this.options,
      `/v1/names/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
  }

  deleteName(id: string): Promise<NativeNameRecord> {
    return requestJson<NativeNameRecord>(
      this.options,
      `/v1/names/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  }

  registerIdentifier(body: RegisterIdentifierRequest): Promise<IdentifierResponse> {
    return requestJson<IdentifierResponse>(this.options, "/v1/identifiers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getIdentifierAvailability(
    type: string,
    value: string,
  ): Promise<IdentifierAvailabilityResponse> {
    return requestJson<IdentifierAvailabilityResponse>(
      this.options,
      `/v1/identifiers/${encodeURIComponent(type)}/${encodeURIComponent(value)}/availability`,
    );
  }

  getIdentifier(id: string): Promise<IdentifierResponse> {
    return requestJson<IdentifierResponse>(
      this.options,
      `/v1/identifiers/${encodeURIComponent(id)}`,
    );
  }

  updateIdentifier(
    id: string,
    body: UpdateIdentifierRequest,
  ): Promise<IdentifierResponse> {
    return requestJson<IdentifierResponse>(
      this.options,
      `/v1/identifiers/${encodeURIComponent(id)}`,
      {
        method: "PATCH",
        body: JSON.stringify(body),
      },
    );
  }

  removeIdentifier(id: string): Promise<RemoveIdentifierResponse> {
    return requestJson<RemoveIdentifierResponse>(
      this.options,
      `/v1/identifiers/${encodeURIComponent(id)}`,
      { method: "DELETE" },
    );
  }

  emergencySuspend(
    id: string,
    body?: { reason?: string },
  ): Promise<{ id: string; status: string; reason: string }> {
    return requestJson(
      this.options,
      `/v1/identifiers/${encodeURIComponent(id)}/emergency-suspend`,
      {
        method: "POST",
        body: JSON.stringify(body ?? {}),
      },
    );
  }

  listIdentifierTypes(): Promise<{
    types: Array<{
      name: string;
      version: string;
      status: string;
      privacy: string;
      registration_eligible: boolean;
      resolution_eligible: boolean;
    }>;
  }> {
    return requestJson(this.options, "/v1/identifier-types");
  }

  getIdentifierHistory(id: string): Promise<{
    identifier_id: string;
    events: RegistryEventRecord[];
  }> {
    return requestJson(this.options, `/v1/identifiers/${encodeURIComponent(id)}/history`);
  }

  submitComplaint(body: SubmitComplaintRequest): Promise<ComplaintRecord> {
    return requestJson<ComplaintRecord>(this.options, "/v1/complaints", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getComplaint(id: string): Promise<ComplaintRecord> {
    return requestJson<ComplaintRecord>(
      this.options,
      `/v1/complaints/${encodeURIComponent(id)}`,
    );
  }

  listControllerNames(wallet: string): Promise<{ names: NativeNameRecord[] }> {
    return requestJson(
      this.options,
      `/v1/controllers/${encodeURIComponent(wallet)}/names`,
    );
  }

  listControllerIdentifiers(wallet: string): Promise<{ identifiers: IdentifierResponse[] }> {
    return requestJson(
      this.options,
      `/v1/controllers/${encodeURIComponent(wallet)}/identifiers`,
    );
  }

  listNamespaces(): Promise<{ namespaces: Array<Record<string, unknown>> }> {
    return requestJson(this.options, "/v1/namespaces");
  }

  applyNamespace(body: {
    slug: string;
    description?: string;
    registration_policy?: string;
    reserved_names?: string[];
  }): Promise<Record<string, unknown>> {
    return requestJson(this.options, "/v1/namespaces", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  getNamespaceDetail(slug: string): Promise<{
    namespace: Record<string, unknown>;
    names: Array<Record<string, unknown>>;
    usage: Record<string, number>;
  }> {
    return requestJson(this.options, `/v1/namespaces/${encodeURIComponent(slug)}`);
  }

  getNamespaceNameAvailability(
    namespace: string,
    label: string,
  ): Promise<{ available: boolean; reason?: string }> {
    return requestJson(
      this.options,
      `/v1/namespaces/${encodeURIComponent(namespace)}/names/${encodeURIComponent(label)}/availability`,
    );
  }

  registerNamespaceName(
    namespace: string,
    body: {
      label: string;
      controller_ref?: string;
      chain?: string;
      asset?: string;
      address?: string;
    },
  ): Promise<Record<string, unknown>> {
    return requestJson(this.options, `/v1/namespaces/${encodeURIComponent(namespace)}/names`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  updateNamespaceName(
    namespace: string,
    label: string,
    body: Record<string, unknown>,
  ): Promise<Record<string, unknown>> {
    return requestJson(
      this.options,
      `/v1/namespaces/${encodeURIComponent(namespace)}/names/${encodeURIComponent(label)}`,
      { method: "PATCH", body: JSON.stringify(body) },
    );
  }
}

export type OperatorClientOptions = {
  baseUrl: string;
  operatorKey: string;
  fetch?: typeof fetch;
};

export class OperatorClient {
  private readonly options: OperatorClientOptions;

  constructor(options: OperatorClientOptions) {
    this.options = options;
  }

  private headers(): HeadersInit {
    return {
      "content-type": "application/json",
      authorization: `Bearer ${this.options.operatorKey}`,
    };
  }

  private async request<T>(path: string, init?: RequestInit): Promise<T> {
    const fetchImpl = this.options.fetch ?? fetch;
    const response = await fetchImpl(`${this.options.baseUrl.replace(/\/$/, "")}${path}`, {
      ...init,
      headers: { ...this.headers(), ...(init?.headers ?? {}) },
    });
    const text = await response.text();
    if (!response.ok) {
      throw new ProtocolApiError("INTERNAL_ERROR", text || response.statusText, response.status);
    }
    return JSON.parse(text) as T;
  }

  resolveComplaint(id: string, body: ResolveComplaintRequest): Promise<ComplaintRecord> {
    return this.request(`/v1/complaints/${encodeURIComponent(id)}/resolve`, {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  suspendIdentifier(id: string, body?: { notes?: string }): Promise<{ id: string; status: string }> {
    return this.request(`/v1/operator/identifiers/${encodeURIComponent(id)}/suspend`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  }

  reinstateIdentifier(id: string): Promise<{ id: string; status: string }> {
    return this.request(`/v1/operator/identifiers/${encodeURIComponent(id)}/reinstate`, {
      method: "POST",
      body: JSON.stringify({}),
    });
  }

  revokeIdentifier(id: string, body?: { notes?: string }): Promise<{ id: string; status: string }> {
    return this.request(`/v1/operator/identifiers/${encodeURIComponent(id)}/revoke`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  }

  reclaimIdentifier(
    id: string,
    body: { new_controller_wallet: string; notes?: string },
    dualControlToken = "bypass",
  ): Promise<{ id: string; status: string }> {
    return this.request(`/v1/operator/identifiers/${encodeURIComponent(id)}/reclaim`, {
      method: "POST",
      body: JSON.stringify(body),
      headers: {
        "x-reclaim-dual-control": dualControlToken,
      },
    });
  }

  listProviders(): Promise<{ providers: WalletProviderRecord[] }> {
    return this.request("/v1/providers");
  }

  createProvider(body: CreateProviderRequest): Promise<WalletProviderRecord> {
    return this.request("/v1/providers", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  updateProvider(id: string, body: UpdateProviderRequest): Promise<WalletProviderRecord> {
    return this.request(`/v1/providers/${encodeURIComponent(id)}`, {
      method: "PATCH",
      body: JSON.stringify(body),
    });
  }

  listIdentifiers(): Promise<{ identifiers: Array<Record<string, unknown>> }> {
    return this.request("/v1/operator/identifiers");
  }

  listNames(status?: string): Promise<{ names: NativeNameRecord[] }> {
    const query = status ? `?status=${encodeURIComponent(status)}` : "";
    return this.request(`/v1/operator/names${query}`);
  }

  listComplaints(): Promise<{ complaints: ComplaintRecord[] }> {
    return this.request("/v1/operator/complaints");
  }

  listProtectedDictionary(): Promise<{
    entries: Array<{ name: string; category: string; note: string | null }>;
  }> {
    return this.request("/v1/operator/protected-dictionary");
  }

  addProtectedDictionaryEntry(body: {
    name: string;
    category?: string;
    note?: string;
  }): Promise<{ name: string; category: string; note: string | null }> {
    return this.request("/v1/operator/protected-dictionary", {
      method: "POST",
      body: JSON.stringify(body),
    });
  }

  removeProtectedDictionaryEntry(name: string): Promise<{ name: string; removed: boolean }> {
    return this.request(`/v1/operator/protected-dictionary/${encodeURIComponent(name)}`, {
      method: "DELETE",
    });
  }

  activateProtectedName(id: string, body?: { notes?: string }): Promise<NativeNameRecord> {
    return this.request(`/v1/operator/names/${encodeURIComponent(id)}/activate`, {
      method: "POST",
      body: JSON.stringify(body ?? {}),
    });
  }
}

export {
  getIdentifierType,
  inferIdentifierType,
  looksLikeEmvQrPayload,
  MAX_IDENTIFIER_VALUE_LENGTH,
  normalizeIdentifier,
  validateIdentifier,
  listActiveIdentifierTypes,
  INITIAL_TYPES,
} from "@universal-payment/identifier-types";

export {
  classifyPaste,
  shouldResolveWithRezva,
  resolvePaste,
  isExternalNamespaceName,
  matchExternalNamespace,
} from "./paste.js";
export type { PasteClassifyResult, PasteClientOptions } from "./paste.js";

export {
  evaluatePasteFilter,
  shouldAcceptPaste,
  resolveFilterFromPolicy,
} from "./resolve-filter.js";
export type {
  ResolveFilterOptions,
  PasteAcceptResult,
} from "./resolve-filter.js";

export { ResolverClient as default };
