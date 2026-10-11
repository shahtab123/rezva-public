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
  emptyApplications,
  type DashboardApplications,
} from "./application-types";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";

type Track = "business" | "provider";

type DashboardStateValue = {
  ready: boolean;
  applications: DashboardApplications;
  submitApplication: (track: Track, payload: Record<string, string>) => Promise<void>;
  respondToDocumentRequest: (
    track: Track,
    input: { message: string; note?: string },
  ) => Promise<void>;
  refreshApplications: () => Promise<void>;
  controllerWallet: string | null;
};

const DashboardStateContext = createContext<DashboardStateValue | null>(null);

function storageKey(userId: string): string {
  return `rezva:dashboard:applications:v2:${userId}`;
}

function loadCachedApplications(userId: string): DashboardApplications {
  if (typeof window === "undefined") {
    return emptyApplications;
  }
  try {
    const raw = window.localStorage.getItem(storageKey(userId));
    if (!raw) {
      return emptyApplications;
    }
    const parsed = JSON.parse(raw) as DashboardApplications;
    return {
      business: { ...emptyApplications.business, ...parsed.business },
      provider: { ...emptyApplications.provider, ...parsed.provider },
    };
  } catch {
    return emptyApplications;
  }
}

async function fetchApplications(
  userId: string,
  controllerWallet: string | null,
): Promise<DashboardApplications> {
  const response = await dashboardFetch("/api/dashboard/applications", {
    controllerWallet,
    headers: { "X-Dashboard-User-Id": userId },
    cache: "no-store",
  });
  if (!response.ok) {
    throw new Error("Failed to load applications");
  }
  return (await response.json()) as DashboardApplications;
}

export function DashboardStateProvider({ children }: { children: ReactNode }) {
  const { ready, authenticated, user } = usePrivy();
  const [applications, setApplications] =
    useState<DashboardApplications>(emptyApplications);
  const [hydrated, setHydrated] = useState(false);

  const userId = authenticated ? user?.id ?? null : null;

  const controllerWallet = useMemo(() => {
    const wallet = user?.wallet?.address;
    return wallet ? wallet.toLowerCase() : null;
  }, [user?.wallet?.address]);

  const persistCache = useCallback(
    (next: DashboardApplications) => {
      if (!userId || typeof window === "undefined") return;
      window.localStorage.setItem(storageKey(userId), JSON.stringify(next));
    },
    [userId],
  );

  const refreshApplications = useCallback(async () => {
    if (!userId) {
      setApplications(emptyApplications);
      return;
    }
    try {
      const remote = await fetchApplications(userId, controllerWallet);
      setApplications(remote);
      persistCache(remote);
    } catch {
      setApplications(loadCachedApplications(userId));
    }
  }, [controllerWallet, persistCache, userId]);

  useEffect(() => {
    if (!ready) {
      return;
    }
    if (!userId) {
      const timer = window.setTimeout(() => {
        setApplications(emptyApplications);
        setHydrated(true);
      }, 0);
      return () => window.clearTimeout(timer);
    }
    const timer = window.setTimeout(() => {
      setApplications(loadCachedApplications(userId));
      void refreshApplications().finally(() => setHydrated(true));
    }, 0);
    return () => window.clearTimeout(timer);
  }, [ready, userId, refreshApplications]);

  useEffect(() => {
    if (!userId || !hydrated) {
      return;
    }
    persistCache(applications);
  }, [applications, hydrated, persistCache, userId]);

  useEffect(() => {
    if (!userId || !hydrated) {
      return;
    }
    const onFocus = () => {
      void refreshApplications();
    };
    window.addEventListener("focus", onFocus);
    return () => window.removeEventListener("focus", onFocus);
  }, [hydrated, refreshApplications, userId]);

  const submitApplication = useCallback(
    async (track: Track, payload: Record<string, string>) => {
      if (!userId) return;
      const optimistic: DashboardApplications = {
        ...applications,
        [track]: {
          status: "submitted",
          submittedAt: new Date().toISOString(),
          payload,
          rejectionReason: undefined,
          reviewedAt: undefined,
          documentRequest: undefined,
          documentResponse: undefined,
        },
      };
      setApplications(optimistic);
      persistCache(optimistic);

      const response = await dashboardFetch("/api/dashboard/applications", {
        method: "POST",
        controllerWallet,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          payload,
          controllerWallet: user?.wallet?.address?.toLowerCase() ?? null,
        }),
      });
      if (!response.ok) {
        let message = "Failed to submit application";
        try {
          const body = (await response.json()) as { error?: string };
          if (body.error) message = body.error;
        } catch {
          // ignore parse errors
        }
        throw new Error(message);
      }
      await refreshApplications();
    },
    [applications, controllerWallet, persistCache, refreshApplications, user?.wallet?.address, userId],
  );

  const respondToDocumentRequest = useCallback(
    async (track: Track, input: { message: string; note?: string }) => {
      if (!userId) return;
      const response = await dashboardFetch("/api/dashboard/applications", {
        method: "PATCH",
        controllerWallet,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          track,
          message: input.message,
          note: input.note,
        }),
      });
      if (!response.ok) {
        throw new Error("Failed to submit additional information");
      }
      await refreshApplications();
    },
    [controllerWallet, refreshApplications, userId],
  );

  const value = useMemo<DashboardStateValue>(
    () => ({
      ready: ready && hydrated,
      applications,
      submitApplication,
      respondToDocumentRequest,
      refreshApplications,
      controllerWallet,
    }),
    [
      ready,
      hydrated,
      applications,
      submitApplication,
      respondToDocumentRequest,
      refreshApplications,
      controllerWallet,
    ],
  );

  return (
    <DashboardStateContext.Provider value={value}>
      {children}
    </DashboardStateContext.Provider>
  );
}

export function useDashboardState(): DashboardStateValue {
  const ctx = useContext(DashboardStateContext);
  if (!ctx) {
    throw new Error("useDashboardState must be used within DashboardStateProvider");
  }
  return ctx;
}
