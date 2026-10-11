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
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";
import {
  emptyProviderAccountState,
  type ProviderAccount,
  type ProviderAccountState,
  type ProviderProfile,
  type ProviderUsage,
  type ProviderWebhook,
} from "./provider-types";

type ProviderStateValue = {
  ready: boolean;
  state: ProviderAccountState;
  plainKey: string | null;
  error: string | null;
  busy: string | null;
  refresh: () => Promise<void>;
  provision: () => Promise<{ ok: true } | { ok: false; error: string }>;
  regenerateKey: () => Promise<{ ok: true } | { ok: false; error: string }>;
  createWebhook: (input: {
    url: string;
    events: string[];
  }) => Promise<
    | { ok: true; signingSecret: string }
    | { ok: false; error: string }
  >;
  updateWebhook: (
    id: string,
    patch: { url?: string; events?: string[]; status?: "ACTIVE" | "DISABLED" },
  ) => Promise<{ ok: true } | { ok: false; error: string }>;
  deleteWebhook: (id: string) => Promise<{ ok: true } | { ok: false; error: string }>;
  clearPlainKey: () => void;
};

const ProviderStateContext = createContext<ProviderStateValue | null>(null);

async function readJson<T>(response: Response): Promise<T> {
  return (await response.json()) as T;
}

function readApiError(data: { error?: unknown }): string {
  if (typeof data.error === "string") return data.error;
  if (
    data.error &&
    typeof data.error === "object" &&
    "message" in data.error &&
    typeof (data.error as { message: unknown }).message === "string"
  ) {
    return (data.error as { message: string }).message;
  }
  return "Request failed.";
}

export function ProviderStateProvider({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);
  const [state, setState] = useState<ProviderAccountState>(emptyProviderAccountState);
  const [plainKey, setPlainKey] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    const accountResponse = await dashboardFetch("/api/dashboard/provider/account");
    if (accountResponse.status === 403) {
      setState(emptyProviderAccountState);
      return;
    }
    if (!accountResponse.ok) {
      throw new Error("Could not load provider account.");
    }
    const accountData = await readJson<{
      account: ProviderAccount | null;
      provider: ProviderProfile | null;
      needs_provision: boolean;
    }>(accountResponse);
    let usage: ProviderUsage | null = null;
    let webhooks: ProviderWebhook[] = [];
    let availableWebhookEvents = emptyProviderAccountState.availableWebhookEvents;
    if (accountData.account) {
      const [usageResponse, webhooksResponse] = await Promise.all([
        dashboardFetch("/api/dashboard/provider/usage"),
        dashboardFetch("/api/dashboard/provider/webhooks"),
      ]);
      if (usageResponse.ok) {
        usage = (await readJson<{ usage: ProviderUsage }>(usageResponse)).usage;
      }
      if (webhooksResponse.ok) {
        const webhookData = await readJson<{
          webhooks: ProviderWebhook[];
          available_events?: string[];
        }>(webhooksResponse);
        webhooks = webhookData.webhooks;
        if (webhookData.available_events?.length) {
          availableWebhookEvents = webhookData.available_events;
        }
      }
    }
    setState({
      account: accountData.account,
      provider: accountData.provider,
      needsProvision: accountData.needs_provision,
      usage,
      webhooks,
      availableWebhookEvents,
    });
  }, []);

  useEffect(() => {
    const timer = window.setTimeout(() => {
      void refresh()
        .catch((cause) =>
          setError(cause instanceof Error ? cause.message : "Could not load provider data."),
        )
        .finally(() => setReady(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  const provision = useCallback(async () => {
    setBusy("provision");
    setError(null);
    setPlainKey(null);
    try {
      const response = await dashboardFetch("/api/dashboard/provider/account", {
        method: "POST",
      });
      const data = await readJson<{ error?: string; api_key?: string }>(response);
      if (!response.ok) {
        return { ok: false as const, error: readApiError(data) };
      }
      if (data.api_key) setPlainKey(data.api_key);
      await refresh();
      return { ok: true as const };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not provision provider account.";
      setError(message);
      return { ok: false as const, error: message };
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const regenerateKey = useCallback(async () => {
    setBusy("regenerate");
    setError(null);
    setPlainKey(null);
    try {
      const response = await dashboardFetch("/api/dashboard/provider/credentials", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ action: "regenerate" }),
      });
      const data = await readJson<{ error?: string; api_key?: string }>(response);
      if (!response.ok) {
        return { ok: false as const, error: readApiError(data) };
      }
      if (data.api_key) setPlainKey(data.api_key);
      await refresh();
      return { ok: true as const };
    } catch (cause) {
      const message = cause instanceof Error ? cause.message : "Could not regenerate provider key.";
      setError(message);
      return { ok: false as const, error: message };
    } finally {
      setBusy(null);
    }
  }, [refresh]);

  const createWebhook = useCallback(
    async (input: { url: string; events: string[] }) => {
      setBusy("webhook-create");
      setError(null);
      try {
        const response = await dashboardFetch("/api/dashboard/provider/webhooks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const data = await readJson<{ error?: string; signing_secret?: string }>(response);
        if (!response.ok || !data.signing_secret) {
          return {
            ok: false as const,
            error: readApiError(data),
          };
        }
        await refresh();
        return { ok: true as const, signingSecret: data.signing_secret };
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not create webhook.";
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const updateWebhook = useCallback(
    async (
      id: string,
      patch: { url?: string; events?: string[]; status?: "ACTIVE" | "DISABLED" },
    ) => {
      setBusy(`webhook-${id}`);
      setError(null);
      try {
        const response = await dashboardFetch(`/api/dashboard/provider/webhooks/${id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(patch),
        });
        const data = await readJson<{ error?: string }>(response);
        if (!response.ok) {
          return { ok: false as const, error: readApiError(data) };
        }
        await refresh();
        return { ok: true as const };
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not update webhook.";
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const deleteWebhook = useCallback(
    async (id: string) => {
      setBusy(`delete-${id}`);
      setError(null);
      try {
        const response = await dashboardFetch(`/api/dashboard/provider/webhooks/${id}`, {
          method: "DELETE",
        });
        const data = await readJson<{ error?: string }>(response);
        if (!response.ok) {
          return { ok: false as const, error: readApiError(data) };
        }
        await refresh();
        return { ok: true as const };
      } catch (cause) {
        const message = cause instanceof Error ? cause.message : "Could not delete webhook.";
        setError(message);
        return { ok: false as const, error: message };
      } finally {
        setBusy(null);
      }
    },
    [refresh],
  );

  const value = useMemo<ProviderStateValue>(
    () => ({
      ready,
      state,
      plainKey,
      error,
      busy,
      refresh,
      provision,
      regenerateKey,
      createWebhook,
      updateWebhook,
      deleteWebhook,
      clearPlainKey: () => setPlainKey(null),
    }),
    [
      ready,
      state,
      plainKey,
      error,
      busy,
      refresh,
      provision,
      regenerateKey,
      createWebhook,
      updateWebhook,
      deleteWebhook,
    ],
  );

  return (
    <ProviderStateContext.Provider value={value}>{children}</ProviderStateContext.Provider>
  );
}

export function useProviderState() {
  const context = useContext(ProviderStateContext);
  if (!context) {
    throw new Error("useProviderState must be used within ProviderStateProvider");
  }
  return context;
}
