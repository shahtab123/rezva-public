"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isApproved } from "@/components/dashboard/application-types";
import { useDashboardState } from "@/components/dashboard/DashboardStateProvider";

export default function ProviderIndexPage() {
  const router = useRouter();
  const { applications, ready } = useDashboardState();

  useEffect(() => {
    if (!ready) return;
    router.replace(
      isApproved(applications.provider.status)
        ? "/dashboard/provider/overview"
        : "/dashboard/provider/apply",
    );
  }, [applications.provider.status, ready, router]);

  return (
    <div className="dash-panel">
      <p>Opening provider track…</p>
    </div>
  );
}
