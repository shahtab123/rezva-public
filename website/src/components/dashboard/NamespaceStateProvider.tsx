"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import { usePrivy } from "@privy-io/react-auth";
import {
  emptyNamespaceState,
  normalizeNamespaceSlug,
  type NamespaceNameRecord,
  type NamespaceNameStatus,
  type NamespaceRegistryEvent,
  type NamespaceRegistrationPolicy,
  type NamespaceStatus,
  type ProviderNamespace,
  type ProviderNamespaceState,
} from "./namespace-types";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";

type NamespaceStateValue = {
  ready: boolean;
  state: ProviderNamespaceState;
  submitNamespaceApplication: (payload: {
    slug: string;
    description: string;
    registrationPolicy: NamespaceRegistrationPolicy;
    reservedNames: string[];
  }) => Promise<{ ok: true } | { ok: false; error: string }>;
  reserveName: (
    namespace: string,
    label: string,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  registerWalletName: (
    namespace: string,
    input: {
      label: string;
      address: string;
      chain: string;
      asset: string;
    },
  ) => Promise<{ ok: true; fullName: string } | { ok: false; error: string }>;
  setNameStatus: (
    namespace: string,
    label: string,
    status: NamespaceNameStatus,
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  getNamespace: (slug: string) => ProviderNamespace | undefined;
  getNamesForNamespace: (slug: string) => NamespaceNameRecord[];
  getEventsForNamespace: (slug: string) => NamespaceRegistryEvent[];
};

const NamespaceStateContext = createContext<NamespaceStateValue | null>(null);

function asNumber(value: unknown): number {
  return typeof value === "number" ? value : Number(value ?? 0);
}

function mapRemoteState(payload: unknown): ProviderNamespaceState {
  const namespaces = Array.isArray((payload as { namespaces?: unknown[] })?.namespaces)
    ? (payload as { namespaces: Array<Record<string, unknown>> }).namespaces
    : [];
  const mappedNamespaces: ProviderNamespace[] = [];
  const mappedNames: NamespaceNameRecord[] = [];

  for (const item of namespaces) {
    const namespace = (item.namespace as Record<string, unknown> | undefined) ?? item;
    const slug = normalizeNamespaceSlug(String(namespace.slug ?? ""));
    if (!slug) continue;
    const usage = (item.usage as Record<string, unknown> | undefined) ?? {};
    const status = String(namespace.status ?? "submitted") as NamespaceStatus;
    mappedNamespaces.push({
      slug,
      status,
      description: typeof namespace.description === "string" ? namespace.description : undefined,
      registrationPolicy:
        (namespace.registration_policy as NamespaceRegistrationPolicy) ??
        "provider_managed_pricing",
      reservedNames: Array.isArray(namespace.reserved_names)
        ? namespace.reserved_names.map(String)
        : [],
      submittedAt: typeof namespace.created_at === "string" ? namespace.created_at : undefined,
      activatedAt: status === "active" && typeof namespace.updated_at === "string"
        ? namespace.updated_at
        : undefined,
      usage: {
        totalNames: asNumber(usage.total_names),
        activeNames: asNumber(usage.active_names),
        registrationsThisMonth: asNumber(usage.registrations_this_month),
        removalsThisMonth: asNumber(usage.removals_this_month),
        resolutionRequestsThisMonth: asNumber(usage.resolution_requests_this_month),
      },
    });

    const names = Array.isArray(item.names) ? item.names : [];
    for (const rawName of names) {
      const name = rawName as Record<string, unknown>;
      mappedNames.push({
        label: String(name.label ?? ""),
        fullName: String(name.full_name ?? ""),
        namespace: slug,
        status: String(name.status ?? "active") as NamespaceNameStatus,
        controllerRef: typeof name.controller_ref === "string" ? name.controller_ref : undefined,
        destinationPreview:
          typeof name.destination_preview === "string" ? name.destination_preview : undefined,
        registeredAt: typeof name.registered_at === "string" ? name.registered_at : undefined,
        activatedAt: typeof name.activated_at === "string" ? name.activated_at : undefined,
        lastUpdated: typeof name.last_updated === "string" ? name.last_updated : undefined,
        lastPaymentUpdate:
          typeof name.last_payment_update === "string" ? name.last_payment_update : undefined,
      });
    }
  }

  return { namespaces: mappedNamespaces, names: mappedNames, events: [] };
}

export function NamespaceStateProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const [state, setState] = useState<ProviderNamespaceState>(emptyNamespaceState);
  const [hydrated, setHydrated] = useState(false);
  const userId = authenticated ? (user?.id ?? null) : null;

  const refreshState = useCallback(async () => {
    if (!authenticated) {
      setState(emptyNamespaceState);
      setHydrated(true);
      return;
    }
    try {
      const response = await dashboardFetch("/api/dashboard/namespaces");
      const payload = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(
          typeof payload?.error === "string"
            ? payload.error
            : "Could not load provider namespaces.",
        );
      }
      setState(mapRemoteState(payload));
    } catch {
      setState(emptyNamespaceState);
    } finally {
      setHydrated(true);
    }
  }, [authenticated]);

  useEffect(() => {
    if (!ready) return;
    const timer = window.setTimeout(() => void refreshState(), 0);
    return () => window.clearTimeout(timer);
  }, [ready, refreshState, userId]);

  const submitNamespaceApplication = useCallback(
    (payload: {
      slug: string;
      description: string;
      registrationPolicy: NamespaceRegistrationPolicy;
      reservedNames: string[];
    }) => {
      const slug = normalizeNamespaceSlug(payload.slug);
      if (slug.length < 2 || slug.length > 32) {
        return Promise.resolve({
          ok: false as const,
          error: "Namespace must be 2-32 characters.",
        });
      }
      if (!/^[a-z][a-z0-9-]*[a-z0-9]$/.test(slug)) {
        return Promise.resolve({
          ok: false as const,
          error: "Use lowercase letters, numbers, and hyphens; start with a letter.",
        });
      }

      return dashboardFetch("/api/dashboard/namespaces", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          slug,
          description: payload.description.trim(),
          registration_policy: payload.registrationPolicy,
          reserved_names: payload.reservedNames,
        }),
      })
        .then(async (response) => {
          const body = await response.json().catch(() => ({}));
          if (!response.ok) {
            return {
              ok: false as const,
              error: typeof body?.error === "string" ? body.error : "Namespace application failed.",
            };
          }
          await refreshState();
          return { ok: true as const };
        })
        .catch(() => ({ ok: false as const, error: "Namespace application failed." }));
    },
    [refreshState],
  );

  const reserveName = useCallback(async (namespace: string, label: string) => {
    const ns = normalizeNamespaceSlug(namespace);
    const clean = label.trim().toLowerCase().replace(/[^a-z0-9-]/g, "");
    if (!clean) {
      return { ok: false as const, error: "Enter a name label." };
    }

    try {
      const response = await dashboardFetch(
        `/api/dashboard/namespaces/${encodeURIComponent(ns)}/names`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: clean, status: "reserved" }),
        },
      );
      const body = await response.json().catch(() => ({}));
      if (!response.ok) {
        return {
          ok: false as const,
          error: typeof body?.error === "string" ? body.error : "Name reservation failed.",
        };
      }
      await refreshState();
      return { ok: true as const };
    } catch {
      return { ok: false as const, error: "Name reservation failed." };
    }
  }, [refreshState]);

  const registerWalletName = useCallback(
    async (
      namespace: string,
      input: {
        label: string;
        address: string;
        chain: string;
        asset: string;
      },
    ) => {
      const ns = normalizeNamespaceSlug(namespace);
      const clean = input.label
        .trim()
        .toLowerCase()
        .replace(new RegExp(`\\.${ns}$`), "")
        .replace(/[^a-z0-9-]/g, "");
      const address = input.address.trim();
      if (!clean) {
        return { ok: false as const, error: "Enter a name like example." };
      }
      if (!/^0x[a-fA-F0-9]{40}$/.test(address)) {
        return { ok: false as const, error: "Enter a valid wallet address." };
      }

      try {
        const response = await dashboardFetch(
          `/api/dashboard/namespaces/${encodeURIComponent(ns)}/names`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              label: clean,
              address,
              chain: input.chain,
              asset: input.asset,
            }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          return {
            ok: false as const,
            error:
              typeof body?.error === "string" ? body.error : "Could not add wallet name.",
          };
        }
        await refreshState();
        return { ok: true as const, fullName: `${clean}.${ns}` };
      } catch {
        return { ok: false as const, error: "Could not add wallet name." };
      }
    },
    [refreshState],
  );

  const setNameStatus = useCallback(
    async (namespace: string, label: string, status: NamespaceNameStatus) => {
      const ns = normalizeNamespaceSlug(namespace);
      const clean = label.trim().toLowerCase();
      try {
        const response = await dashboardFetch(
          `/api/dashboard/namespaces/${encodeURIComponent(ns)}/names/${encodeURIComponent(clean)}`,
          {
            method: status === "removed" ? "DELETE" : "PATCH",
            headers: { "Content-Type": "application/json" },
            body: status === "removed" ? undefined : JSON.stringify({ status }),
          },
        );
        const body = await response.json().catch(() => ({}));
        if (!response.ok) {
          return {
            ok: false as const,
            error: typeof body?.error === "string" ? body.error : "Name update failed.",
          };
        }
        await refreshState();
        return { ok: true as const };
      } catch {
        return { ok: false as const, error: "Name update failed." };
      }
    },
    [refreshState],
  );

  const getNamespace = useCallback(
    (slug: string) =>
      state.namespaces.find(
        (ns) => ns.slug === normalizeNamespaceSlug(slug),
      ),
    [state.namespaces],
  );

  const getNamesForNamespace = useCallback(
    (slug: string) => {
      const key = normalizeNamespaceSlug(slug);
      return state.names.filter((n) => n.namespace === key && n.status !== "removed");
    },
    [state.names],
  );

  const getEventsForNamespace = useCallback(
    (slug: string) => {
      const key = normalizeNamespaceSlug(slug);
      return state.events.filter((e) => e.namespace === key);
    },
    [state.events],
  );

  const value = useMemo<NamespaceStateValue>(
    () => ({
      ready: ready && hydrated,
      state,
      submitNamespaceApplication,
      reserveName,
      registerWalletName,
      setNameStatus,
      getNamespace,
      getNamesForNamespace,
      getEventsForNamespace,
    }),
    [
      ready,
      hydrated,
      state,
      submitNamespaceApplication,
      reserveName,
      registerWalletName,
      setNameStatus,
      getNamespace,
      getNamesForNamespace,
      getEventsForNamespace,
    ],
  );

  return (
    <NamespaceStateContext.Provider value={value}>
      {children}
    </NamespaceStateContext.Provider>
  );
}

export function useNamespaceState(): NamespaceStateValue {
  const ctx = useContext(NamespaceStateContext);
  if (!ctx) {
    throw new Error("useNamespaceState must be used within NamespaceStateProvider");
  }
  return ctx;
}
