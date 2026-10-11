import { createHash, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { join } from "node:path";
import {
  HARD_RESERVED_NAMES,
  PROTECTED_NAME_DICTIONARY_SEED,
  PROTECTED_NAME_SEED,
} from "@/lib/restricted-names-data";
import {
  getUserApplicationById,
  listAllUserApplications,
  updateUserApplication,
  userApplicationDisplayName,
  type StoredUserApplication,
} from "@/lib/applications/store";
import {
  ALL_ADMIN_PERMISSIONS,
  type AdminApplication,
  type AdminAuditAction,
  type AdminAuditEntry,
  type AdminStoreData,
  type AdminUser,
  type DictionaryRequest,
  type AdminSystemSettings,
} from "./types";

function userAppToAdmin(app: StoredUserApplication): AdminApplication {
  return {
    id: app.id,
    kind: app.track,
    status: app.status === "not_applied" ? "not_submitted" : app.status,
    displayName: userApplicationDisplayName(app),
    contactEmail: app.payload["Contact email"] ?? app.payload.contactEmail,
    website: app.payload["Website"] ?? app.payload.website,
    country: app.payload["Country / region"] ?? app.payload.country,
    summary: app.payload["Description"] ?? app.payload.description,
    payload: app.payload,
    submittedAt: app.submittedAt,
    reviewedAt: app.reviewedAt,
    rejectionReason: app.rejectionReason,
    documentRequest: app.documentRequest,
    documentResponse: app.documentResponse,
  };
}

async function mergeApplications(adminApps: AdminApplication[]): Promise<AdminApplication[]> {
  const userApps = (await listAllUserApplications())
    .filter((app) => app.status !== "not_applied")
    .map(userAppToAdmin);
  const byId = new Map<string, AdminApplication>();
  for (const app of adminApps) {
    byId.set(app.id, app);
  }
  for (const app of userApps) {
    byId.set(app.id, app);
  }
  return Array.from(byId.values()).sort((a, b) => {
    const aTime = a.submittedAt ? Date.parse(a.submittedAt) : 0;
    const bTime = b.submittedAt ? Date.parse(b.submittedAt) : 0;
    return bTime - aTime;
  });
}

function canonicalDictionaryEntries(): string[] {
  return Array.from(PROTECTED_NAME_SEED).sort();
}

function seedDictionaryEntries(): string[] {
  return canonicalDictionaryEntries();
}

function mergeDictionaryEntries(existing: string[] | undefined): string[] {
  const merged = new Set(existing ?? []);
  for (const name of canonicalDictionaryEntries()) {
    merged.add(name);
  }
  return [...merged].sort();
}

function normalizeDictionaryName(raw: string): string {
  return raw.trim().toLowerCase();
}

const DATA_DIR = join(process.cwd(), ".data");
const STORE_PATH = join(DATA_DIR, "admin-store.json");

/** In-memory fallback when the filesystem is read-only (e.g. Vercel). */
let memoryStore: AdminStoreData | null = null;

function nowIso(): string {
  return new Date().toISOString();
}

function newId(prefix: string): string {
  return `${prefix}_${randomBytes(8).toString("hex")}`;
}

/** scrypt password hash - portable, no native bcrypt binding required */
export function hashPassword(password: string): string {
  const salt = randomBytes(16).toString("hex");
  const hash = scryptSync(password, salt, 64).toString("hex");
  return `scrypt$${salt}$${hash}`;
}

export function verifyPassword(password: string, stored: string): boolean {
  const [algo, salt, hash] = stored.split("$");
  if (algo !== "scrypt" || !salt || !hash) return false;
  const next = scryptSync(password, salt, 64);
  const prev = Buffer.from(hash, "hex");
  if (prev.length !== next.length) return false;
  return timingSafeEqual(prev, next);
}

function defaultSettings(): AdminSystemSettings {
  return {
    registrationSafetySeconds: 60,
    updateSafetySeconds: 60,
    removalCooldownSeconds: 300,
    resolveRateLimitPerMinute: 120,
    registerRateLimitPerMinute: 30,
  };
}

function seedApplications(): AdminApplication[] {
  const submittedAt = nowIso();
  return [
    {
      id: "app_biz_demo_1",
      kind: "business",
      status: "submitted",
      displayName: "Northwind Market",
      contactEmail: "ops@northwind.example",
      website: "https://northwind.example",
      country: "Bangladesh",
      summary: "Retail merchant seeking native name + phone identifier.",
      submittedAt,
      payload: {
        "Display name": "Northwind Market",
        Country: "Bangladesh",
        "Contact email": "ops@northwind.example",
      },
    },
    {
      id: "app_prov_demo_1",
      kind: "provider",
      status: "under_review",
      displayName: "Atlas Wallet",
      contactEmail: "security@atlaswallet.example",
      website: "https://atlaswallet.example",
      summary: "Consumer wallet requesting resolver + merchant setup.",
      submittedAt,
      payload: {
        "Wallet / product name": "Atlas Wallet",
        Website: "https://atlaswallet.example",
        "Contact email": "security@atlaswallet.example",
      },
    },
    {
      id: "app_ns_demo_1",
      kind: "namespace",
      status: "submitted",
      displayName: "RedotPay namespace",
      namespaceSlug: "redotpay",
      contactEmail: "platform@redotpay.example",
      summary: "Request for .redotpay payment namespace.",
      submittedAt,
      payload: {
        Namespace: ".redotpay",
        Policy: "provider_managed_pricing",
      },
    },
  ];
}

function seedDictionary(): DictionaryRequest[] {
  return [
    {
      id: "dict_req_1",
      name: "facebook",
      applicantLabel: "Northwind Market",
      applicantKind: "business",
      purpose: "Business / Merchant native name",
      status: "pending_review",
      submittedAt: nowIso(),
      evidenceNotes: "Claims trademark license - documents not yet attached.",
      relatedIdentifiers: [],
      applicationId: "app_biz_demo_1",
      history: [
        {
          at: nowIso(),
          by: "system",
          action: "submitted",
          note: "Protected dictionary match on create.",
        },
      ],
    },
    {
      id: "dict_req_2",
      name: "bank",
      applicantLabel: "Coastal Payments Ltd",
      applicantKind: "business",
      purpose: "Institutional brand name",
      status: "pending_review",
      submittedAt: nowIso(),
      history: [
        {
          at: nowIso(),
          by: "system",
          action: "submitted",
          note: "Protected dictionary match.",
        },
      ],
    },
  ];
}

function emptyStore(): AdminStoreData {
  return {
    users: [],
    audit: [],
    applications: seedApplications(),
    dictionaryRequests: seedDictionary(),
    dictionaryEntries: seedDictionaryEntries(),
    registryDemoOverrides: {},
    settings: defaultSettings(),
  };
}

function ensureSeeded(data: AdminStoreData): AdminStoreData {
  if (data.users.length === 0) {
    const timestamp = nowIso();
    data.users.push({
      id: "admin_root",
      username: "admin",
      passwordHash: hashPassword("admin"),
      accountType: "super_admin",
      permissions: [...ALL_ADMIN_PERMISSIONS],
      displayName: "Protocol Admin",
      status: "active",
      createdAt: timestamp,
      updatedAt: timestamp,
    });
  }
  if (!data.applications?.length) {
    data.applications = seedApplications();
  }
  if (!data.dictionaryRequests?.length) {
    data.dictionaryRequests = seedDictionary();
  }
  if (!data.dictionaryEntries?.length) {
    data.dictionaryEntries = seedDictionaryEntries();
  } else {
    const merged = mergeDictionaryEntries(data.dictionaryEntries);
    if (merged.length !== data.dictionaryEntries.length) {
      data.dictionaryEntries = merged;
    }
  }
  if (!data.settings) {
    data.settings = defaultSettings();
  }
  if (!data.registryDemoOverrides) {
    data.registryDemoOverrides = {};
  }
  if (!data.audit) {
    data.audit = [];
  }
  return data;
}

function readStore(): AdminStoreData {
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    if (!existsSync(STORE_PATH)) {
      const seeded = ensureSeeded(emptyStore());
      writeStore(seeded);
      return seeded;
    }
    const raw = readFileSync(STORE_PATH, "utf8");
    const parsed = JSON.parse(raw) as AdminStoreData;
    const ensured = ensureSeeded(parsed);
    writeStore(ensured);
    return ensured;
  } catch {
    if (!memoryStore) {
      memoryStore = ensureSeeded(emptyStore());
    } else {
      memoryStore = ensureSeeded(memoryStore);
    }
    return memoryStore;
  }
}

function writeStore(data: AdminStoreData): void {
  memoryStore = data;
  try {
    if (!existsSync(DATA_DIR)) {
      mkdirSync(DATA_DIR, { recursive: true });
    }
    writeFileSync(STORE_PATH, JSON.stringify(data, null, 2), "utf8");
  } catch {
    // Serverless / read-only FS - keep memoryStore only.
  }
}

export function getAdminStore(): AdminStoreData {
  return readStore();
}

export function findAdminByUsername(username: string): AdminUser | null {
  const store = readStore();
  return (
    store.users.find(
      (user) => user.username.toLowerCase() === username.trim().toLowerCase(),
    ) ?? null
  );
}

export function findAdminById(id: string): AdminUser | null {
  return readStore().users.find((user) => user.id === id) ?? null;
}

export function markAdminLogin(userId: string): void {
  const store = readStore();
  store.users = store.users.map((user) =>
    user.id === userId ? { ...user, lastLoginAt: nowIso(), updatedAt: nowIso() } : user,
  );
  writeStore(store);
}

export function appendAudit(entry: Omit<AdminAuditEntry, "id" | "at"> & { at?: string }): AdminAuditEntry {
  const store = readStore();
  const full: AdminAuditEntry = {
    id: newId("audit"),
    at: entry.at ?? nowIso(),
    adminId: entry.adminId,
    adminUsername: entry.adminUsername,
    action: entry.action,
    resourceType: entry.resourceType,
    resourceId: entry.resourceId,
    previousState: entry.previousState ?? null,
    newState: entry.newState ?? null,
    reason: entry.reason ?? null,
    message: entry.message ?? null,
    authorizationReference:
      entry.authorizationReference ??
      createHash("sha256")
        .update(`${entry.adminId}:${entry.action}:${entry.resourceId}:${Date.now()}`)
        .digest("hex")
        .slice(0, 16),
  };
  store.audit = [full, ...store.audit].slice(0, 2000);
  writeStore(store);
  return full;
}

export function listAudit(limit = 100): AdminAuditEntry[] {
  return readStore().audit.slice(0, limit);
}

export async function listApplications(filter?: {
  kind?: AdminApplication["kind"];
  status?: AdminApplication["status"] | "pending";
}): Promise<AdminApplication[]> {
  let items = await mergeApplications(readStore().applications);
  if (filter?.kind) {
    items = items.filter((item) => item.kind === filter.kind);
  }
  if (filter?.status === "pending") {
    items = items.filter((item) =>
      ["submitted", "under_review", "additional_info_requested"].includes(item.status),
    );
  } else if (filter?.status) {
    items = items.filter((item) => item.status === filter.status);
  }
  return items;
}

export async function getApplication(id: string): Promise<AdminApplication | null> {
  const adminApp = readStore().applications.find((item) => item.id === id);
  if (adminApp) return adminApp;
  const userApp = await getUserApplicationById(id);
  return userApp ? userAppToAdmin(userApp) : null;
}

export async function updateApplication(
  id: string,
  patch: Partial<AdminApplication>,
  audit: {
    adminId: string;
    adminUsername: string;
    action: AdminAuditAction;
    reason?: string;
    message?: string;
  },
): Promise<AdminApplication | null> {
  const userApp = await getUserApplicationById(id);
  if (userApp) {
    const previous = userAppToAdmin(userApp);
    const userPatch: Parameters<typeof updateUserApplication>[1] = {};
    if (patch.status) {
      userPatch.status =
        patch.status === "not_submitted"
          ? "not_applied"
          : patch.status === "suspended"
            ? "rejected"
            : patch.status;
    }
    if (patch.rejectionReason !== undefined) {
      userPatch.rejectionReason = patch.rejectionReason;
    }
    if (patch.documentRequest !== undefined) {
      userPatch.documentRequest = patch.documentRequest;
    }
    if (patch.documentResponse !== undefined) {
      userPatch.documentResponse = patch.documentResponse;
    }
    if (patch.payload) {
      userPatch.payload = patch.payload;
    }
    const nextStored = await updateUserApplication(id, userPatch);
    if (!nextStored) return null;
    const next = userAppToAdmin(nextStored);
    appendAudit({
      adminId: audit.adminId,
      adminUsername: audit.adminUsername,
      action: audit.action,
      resourceType: "application",
      resourceId: id,
      previousState: previous.status,
      newState: next.status,
      reason: audit.reason,
      message: audit.message,
    });
    return next;
  }

  const store = readStore();
  const index = store.applications.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const previous = store.applications[index]!;
  const next: AdminApplication = {
    ...previous,
    ...patch,
    reviewedAt: nowIso(),
    reviewedBy: audit.adminUsername,
  };
  store.applications[index] = next;
  writeStore(store);
  appendAudit({
    adminId: audit.adminId,
    adminUsername: audit.adminUsername,
    action: audit.action,
    resourceType: "application",
    resourceId: id,
    previousState: previous.status,
    newState: next.status,
    reason: audit.reason,
    message: audit.message,
  });
  return next;
}

export function listDictionaryRequests(filter?: {
  status?: DictionaryRequest["status"] | "pending";
}): DictionaryRequest[] {
  let items = readStore().dictionaryRequests;
  if (filter?.status === "pending") {
    items = items.filter((item) =>
      ["pending_review", "additional_info_requested"].includes(item.status),
    );
  } else if (filter?.status) {
    items = items.filter((item) => item.status === filter.status);
  }
  return items;
}

export function getDictionaryRequest(id: string): DictionaryRequest | null {
  return readStore().dictionaryRequests.find((item) => item.id === id) ?? null;
}

export function updateDictionaryRequest(
  id: string,
  patch: Partial<DictionaryRequest>,
  audit: {
    adminId: string;
    adminUsername: string;
    action: AdminAuditAction;
    reason?: string;
    message?: string;
    historyAction: string;
  },
): DictionaryRequest | null {
  const store = readStore();
  const index = store.dictionaryRequests.findIndex((item) => item.id === id);
  if (index < 0) return null;
  const previous = store.dictionaryRequests[index]!;
  const next: DictionaryRequest = {
    ...previous,
    ...patch,
    history: [
      {
        at: nowIso(),
        by: audit.adminUsername,
        action: audit.historyAction,
        note: audit.message ?? audit.reason,
      },
      ...previous.history,
    ],
  };
  store.dictionaryRequests[index] = next;
  writeStore(store);
  appendAudit({
    adminId: audit.adminId,
    adminUsername: audit.adminUsername,
    action: audit.action,
    resourceType: "dictionary_request",
    resourceId: id,
    previousState: previous.status,
    newState: next.status,
    reason: audit.reason,
    message: audit.message,
  });
  return next;
}

export function listDictionaryEntries(): string[] {
  return mergeDictionaryEntries(readStore().dictionaryEntries);
}

export function listDictionaryEntryMeta(): Array<{
  name: string;
  category: string;
  source: "seed" | "manual";
}> {
  const entries = listDictionaryEntries();
  const seedByName = new Map(
    PROTECTED_NAME_DICTIONARY_SEED.map((entry) => [entry.name, entry.category]),
  );
  return entries.map((name) => ({
    name,
    category: seedByName.get(name) ?? "other",
    source: seedByName.has(name) ? "seed" : "manual",
  }));
}

export function addDictionaryEntry(
  rawName: string,
  audit: {
    adminId: string;
    adminUsername: string;
    reason?: string;
  },
): { ok: true; name: string } | { ok: false; error: string } {
  const name = normalizeDictionaryName(rawName);
  if (!/^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/.test(name)) {
    return { ok: false, error: "Invalid name format" };
  }
  if (HARD_RESERVED_NAMES.has(name)) {
    return {
      ok: false,
      error: "Hard-reserved names belong to reserved_names, not the soft dictionary",
    };
  }
  const store = readStore();
  if (store.dictionaryEntries.includes(name)) {
    return { ok: false, error: "Name already in dictionary" };
  }
  store.dictionaryEntries = [...store.dictionaryEntries, name].sort();
  writeStore(store);
  appendAudit({
    adminId: audit.adminId,
    adminUsername: audit.adminUsername,
    action: "dictionary.entry_add",
    resourceType: "dictionary_entry",
    resourceId: name,
    previousState: "absent",
    newState: "protected",
    reason: audit.reason ?? "Manual dictionary add",
  });
  return { ok: true, name };
}

export function removeDictionaryEntry(
  rawName: string,
  audit: {
    adminId: string;
    adminUsername: string;
    reason?: string;
  },
): { ok: true; name: string } | { ok: false; error: string } {
  const name = normalizeDictionaryName(rawName);
  if (HARD_RESERVED_NAMES.has(name)) {
    return { ok: false, error: "Cannot remove a hard-reserved name via dictionary" };
  }
  const store = readStore();
  if (!store.dictionaryEntries.includes(name)) {
    return { ok: false, error: "Name not in dictionary" };
  }
  store.dictionaryEntries = store.dictionaryEntries.filter((entry) => entry !== name);
  writeStore(store);
  appendAudit({
    adminId: audit.adminId,
    adminUsername: audit.adminUsername,
    action: "dictionary.entry_remove",
    resourceType: "dictionary_entry",
    resourceId: name,
    previousState: "protected",
    newState: "absent",
    reason: audit.reason ?? "Manual dictionary remove",
  });
  return { ok: true, name };
}

export function getRegistryDemoOverrides(): Record<
  string,
  { status: string; updatedAt: string }
> {
  return { ...(readStore().registryDemoOverrides ?? {}) };
}

export function setRegistryDemoStatus(resourceId: string, status: string): void {
  const store = readStore();
  store.registryDemoOverrides = {
    ...(store.registryDemoOverrides ?? {}),
    [resourceId]: { status, updatedAt: nowIso() },
  };
  writeStore(store);
}

export function getSettings(): AdminSystemSettings {
  return readStore().settings;
}

export function updateSettings(
  patch: Partial<AdminSystemSettings>,
  audit: { adminId: string; adminUsername: string; reason?: string },
): AdminSystemSettings {
  const store = readStore();
  const previous = { ...store.settings };
  store.settings = { ...store.settings, ...patch };
  writeStore(store);
  appendAudit({
    adminId: audit.adminId,
    adminUsername: audit.adminUsername,
    action: "system.update_settings",
    resourceType: "system_settings",
    resourceId: "protocol",
    previousState: JSON.stringify(previous),
    newState: JSON.stringify(store.settings),
    reason: audit.reason,
  });
  return store.settings;
}

const PENDING_APP_STATUSES = ["submitted", "under_review", "additional_info_requested"] as const;
const PENDING_DICT_STATUSES = ["pending_review", "additional_info_requested"] as const;

export async function overviewCounts() {
  const store = readStore();
  const applications = await mergeApplications(store.applications);
  const isPendingApp = (a: AdminApplication) =>
    (PENDING_APP_STATUSES as readonly string[]).includes(a.status);
  const pendingApplications = applications.filter(isPendingApp);
  return {
    pendingApplications: pendingApplications.length,
    pendingBusinessApplications: pendingApplications.filter((a) => a.kind === "business").length,
    pendingProviderApplications: pendingApplications.filter((a) => a.kind === "provider").length,
    pendingDictionary: store.dictionaryRequests.filter((d) =>
      (PENDING_DICT_STATUSES as readonly string[]).includes(d.status),
    ).length,
    dictionaryEntries: store.dictionaryEntries?.length ?? 0,
    auditEvents: store.audit.length,
    adminUsers: store.users.length,
  };
}
