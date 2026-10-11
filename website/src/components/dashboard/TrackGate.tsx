"use client";

import { isApproved, type ApplicationStatus } from "./application-types";
import { useDashboardState } from "./DashboardStateProvider";
import { LockedSection } from "./LockedSection";

export function useTrackAccess(track: "business" | "provider") {
  const { applications, ready, controllerWallet } = useDashboardState();
  const application = applications[track];
  return {
    ready,
    application,
    status: application.status,
    approved: isApproved(application.status),
    controllerWallet,
  };
}

export function TrackGate({
  track,
  title,
  description,
  children,
}: {
  track: "business" | "provider";
  title: string;
  description: string;
  children: React.ReactNode;
}) {
  const { ready, status, approved } = useTrackAccess(track);

  if (!ready) {
    return (
      <div className="dash-panel">
        <p>Loading application status…</p>
      </div>
    );
  }

  if (!approved) {
    return (
      <LockedSection
        track={track}
        status={status as ApplicationStatus}
        title={title}
        description={description}
      />
    );
  }

  return <>{children}</>;
}
