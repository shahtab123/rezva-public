import type { ApplicationStatus, TrackApplication } from "@/components/dashboard/application-types";

export type ApplicationTrack = "business" | "provider";

export type DocumentRequest = {
  required: string;
  reason: string;
  message: string;
  requestedAt: string;
  requestedBy: string;
};

export type DocumentResponse = {
  message: string;
  note?: string;
  submittedAt: string;
};

export type StoredUserApplication = {
  id: string;
  privyUserId: string;
  track: ApplicationTrack;
  status: ApplicationStatus;
  payload: Record<string, string>;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documentRequest?: DocumentRequest;
  documentResponse?: DocumentResponse;
  controllerWallet?: string;
};

type RemoteApplication = {
  id: string;
  privyUserId: string;
  track: ApplicationTrack;
  status: string;
  payload: Record<string, string>;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documentRequest?: DocumentRequest;
  documentResponse?: DocumentResponse;
  controllerWallet?: string;
};

function config(): { baseUrl: string; apiKey: string } | null {
  const baseUrl = process.env.NEXT_PUBLIC_API_URL?.trim().replace(/\/$/, "");
  // Prefer dashboard service key for app sync; operator key is admin-facing.
  const apiKey =
    process.env.DASHBOARD_SERVICE_KEY?.trim() ||
    process.env.OPERATOR_API_KEY?.trim() ||
    "";
  if (!baseUrl || !apiKey) {
    return null;
  }
  return { baseUrl, apiKey };
}

function formatRemoteError(status: number, body: unknown): string {
  const err =
    typeof body === "object" && body && "error" in body
      ? (body as { error: unknown }).error
      : null;
  const message =
    typeof err === "object" && err && "message" in err
      ? String((err as { message: unknown }).message)
      : typeof err === "string"
        ? err
        : null;
  if (
    status === 403 &&
    message &&
    /operator authorization failed/i.test(message)
  ) {
    return "Registry auth key mismatch: set DASHBOARD_SERVICE_KEY (and OPERATOR_API_KEY) on Vercel to match the Cloudflare Worker, then redeploy.";
  }
  return message || `Application database request failed (${status})`;
}

async function remoteFetch<T>(path: string, init: RequestInit = {}): Promise<T> {
  const remote = config();
  if (!remote) {
    throw new Error("Dashboard application database is not configured");
  }
  const response = await fetch(`${remote.baseUrl}${path}`, {
    ...init,
    cache: "no-store",
    headers: {
      "content-type": "application/json",
      authorization: `Bearer ${remote.apiKey}`,
      ...(init.headers ?? {}),
    },
  });
  const text = await response.text();
  let body: unknown;
  try {
    body = text ? JSON.parse(text) : {};
  } catch {
    body = { error: text };
  }
  if (!response.ok) {
    throw new Error(formatRemoteError(response.status, body));
  }
  return body as T;
}

function fromRemote(app: RemoteApplication): StoredUserApplication {
  return {
    id: app.id,
    privyUserId: app.privyUserId,
    track: app.track,
    status: app.status as ApplicationStatus,
    payload: app.payload,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
    rejectionReason: app.rejectionReason,
    documentRequest: app.documentRequest,
    documentResponse: app.documentResponse,
    controllerWallet: app.controllerWallet,
  };
}

export async function getUserApplications(privyUserId: string): Promise<{
  business: TrackApplication;
  provider: TrackApplication;
}> {
  if (!config()) {
    throw new Error("Dashboard application database is not configured");
  }
  const applications = await listAllUserApplications(privyUserId);
  const business = applications.find((app) => app.track === "business");
  const provider = applications.find((app) => app.track === "provider");
  return {
    business: toTrackApplication(business),
    provider: toTrackApplication(provider),
  };
}

function toTrackApplication(app?: StoredUserApplication): TrackApplication {
  if (!app) return { status: "not_applied" };
  return {
    status: app.status,
    payload: app.payload,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
    rejectionReason: app.rejectionReason,
    documentRequest: app.documentRequest,
    documentResponse: app.documentResponse,
    applicationId: app.id,
  };
}

export async function listAllUserApplications(
  privyUserId?: string,
): Promise<StoredUserApplication[]> {
  if (!config()) {
    return [];
  }
  const query = privyUserId
    ? `?privy_user_id=${encodeURIComponent(privyUserId)}`
    : "";
  const response = await remoteFetch<{ applications: RemoteApplication[] }>(
    `/v1/operator/dashboard-applications${query}`,
  );
  return response.applications.map(fromRemote);
}

export async function getUserApplicationById(
  id: string,
): Promise<StoredUserApplication | null> {
  if (!config()) {
    return null;
  }
  try {
    const response = await remoteFetch<{ application: RemoteApplication }>(
      `/v1/operator/dashboard-applications/${encodeURIComponent(id)}`,
    );
    return fromRemote(response.application);
  } catch (error) {
    if (error instanceof Error && error.message.includes("NOT_FOUND")) return null;
    return null;
  }
}

export async function submitUserApplication(input: {
  privyUserId: string;
  track: ApplicationTrack;
  payload: Record<string, string>;
  controllerWallet?: string | null;
}): Promise<StoredUserApplication> {
  const response = await remoteFetch<{ application: RemoteApplication }>(
    "/v1/operator/dashboard-applications",
    {
      method: "POST",
      body: JSON.stringify({
        privy_user_id: input.privyUserId,
        track: input.track,
        payload: input.payload,
        controller_wallet: input.controllerWallet,
      }),
    },
  );
  return fromRemote(response.application);
}

export async function updateUserApplication(
  id: string,
  patch: Partial<
    Pick<
      StoredUserApplication,
      | "status"
      | "rejectionReason"
      | "documentRequest"
      | "documentResponse"
      | "payload"
    >
  >,
): Promise<StoredUserApplication | null> {
  const response = await remoteFetch<{ application: RemoteApplication }>(
    `/v1/operator/dashboard-applications/${encodeURIComponent(id)}`,
    {
      method: "PATCH",
      body: JSON.stringify({
        status: patch.status,
        rejection_reason: patch.rejectionReason,
        document_request: patch.documentRequest,
        document_response: patch.documentResponse,
        payload: patch.payload,
      }),
    },
  );
  return fromRemote(response.application);
}

export async function respondToDocumentRequest(input: {
  privyUserId: string;
  track: ApplicationTrack;
  message: string;
  note?: string;
}): Promise<StoredUserApplication | null> {
  const applications = await listAllUserApplications(input.privyUserId);
  const application = applications.find(
    (app) => app.track === input.track && app.status === "additional_info_requested",
  );
  if (!application) return null;
  return updateUserApplication(application.id, {
    status: "under_review",
    documentResponse: {
      message: input.message,
      note: input.note,
      submittedAt: new Date().toISOString(),
    },
  });
}

export function userApplicationDisplayName(app: StoredUserApplication): string {
  return (
    app.payload["Display name"] ??
    app.payload["Wallet / product name"] ??
    app.payload.businessName ??
    `${app.track} applicant`
  );
}
