"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { isApproved } from "@/components/dashboard/application-types";
import { useDashboardState } from "@/components/dashboard/DashboardStateProvider";

export default function BusinessIndexPage() {
  const router = useRouter();
  const { applications, ready } = useDashboardState();

  useEffect(() => {
    if (!ready) return;
    router.replace(
      isApproved(applications.business.status)
        ? "/dashboard/business/profile"
        : "/dashboard/business/apply",
    );
  }, [applications.business.status, ready, router]);

  return (
    <div className="dash-panel">
      <p>Opening business track…</p>
    </div>
  );
}
