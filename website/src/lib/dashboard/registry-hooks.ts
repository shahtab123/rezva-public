"use client";

import { useCallback, useEffect, useState } from "react";
import { dashboardFetch } from "@/lib/dashboard/fetch-with-auth";
import type { DashboardPaymentOption } from "./payment-options";

export type { DashboardPaymentOption } from "./payment-options";

export type DashboardName = {
  id: string;
  name: string;
  status: string;
  review_tier?: string;
  proof_status?: string;
  review_notes?: string | null;
  created_at: string;
  updated_at: string;
};

export type DashboardIdentifier = {
  id: string;
  type: string;
  value: string;
  status: string;
  name_id?: string | null;
  business_name?: string | null;
  pending_activation_at?: string | null;
  activated_at?: string | null;
  payment_options?: DashboardPaymentOption[];
  last_updated?: string;
};

export function useRegistryNames(controllerWallet: string | null) {
  const [names, setNames] = useState<DashboardName[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!controllerWallet) {
      setNames([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardFetch("/api/dashboard/registry/names", {
        controllerWallet,
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load names");
      }
      const data = (await response.json()) as { names: DashboardName[] };
      setNames(data.names ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load names");
      setNames([]);
    } finally {
      setLoading(false);
    }
  }, [controllerWallet]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { names, loading, error, refresh };
}

export function useRegistryIdentifiers(controllerWallet: string | null) {
  const [identifiers, setIdentifiers] = useState<DashboardIdentifier[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    if (!controllerWallet) {
      setIdentifiers([]);
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      const response = await dashboardFetch("/api/dashboard/registry/identifiers", {
        controllerWallet,
      });
      if (!response.ok) {
        const body = (await response.json()) as { error?: string };
        throw new Error(body.error ?? "Failed to load identifiers");
      }
      const data = (await response.json()) as { identifiers: DashboardIdentifier[] };
      setIdentifiers(data.identifiers ?? []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load identifiers");
      setIdentifiers([]);
    } finally {
      setLoading(false);
    }
  }, [controllerWallet]);

  useEffect(() => {
    const timer = window.setTimeout(() => void refresh(), 0);
    return () => window.clearTimeout(timer);
  }, [refresh]);

  return { identifiers, loading, error, refresh };
}

export async function claimRegistryName(
  controllerWallet: string,
  name: string,
): Promise<DashboardName> {
  const response = await dashboardFetch("/api/dashboard/registry/names", {
    method: "POST",
    controllerWallet,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  });
  const body = (await response.json()) as { name?: DashboardName; error?: string };
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to claim name");
  }
  return body.name!;
}

export async function registerRegistryIdentifier(
  controllerWallet: string,
  input: {
    type: string;
    value: string;
    payment_options?: DashboardPaymentOption[];
  },
): Promise<DashboardIdentifier> {
  const response = await dashboardFetch("/api/dashboard/registry/identifiers", {
    method: "POST",
    controllerWallet,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      ...input,
      controller_wallet: controllerWallet,
    }),
  });
  const body = (await response.json()) as {
    identifier?: DashboardIdentifier;
    error?: string;
    code?: string;
  };
  if (!response.ok) {
    const detail = [body.code, body.error].filter(Boolean).join(": ");
    throw new Error(detail || "Failed to register identifier");
  }
  return body.identifier!;
}

export async function updateIdentifierDestinations(
  controllerWallet: string,
  id: string,
  payment_options: DashboardPaymentOption[],
): Promise<DashboardIdentifier> {
  const response = await dashboardFetch(`/api/dashboard/registry/identifiers/${id}`, {
    method: "PATCH",
    controllerWallet,
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ payment_options }),
  });
  const body = (await response.json()) as {
    identifier?: DashboardIdentifier;
    error?: string;
  };
  if (!response.ok) {
    throw new Error(body.error ?? "Failed to update destinations");
  }
  return body.identifier!;
}
