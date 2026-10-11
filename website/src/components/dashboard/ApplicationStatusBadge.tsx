import type { ApplicationStatus } from "./application-types";
import { applicationStatusLabels } from "./application-types";

const toneByStatus: Record<ApplicationStatus, string> = {
  not_applied: "neutral",
  submitted: "info",
  under_review: "info",
  additional_info_requested: "warn",
  approved: "success",
  rejected: "danger",
};

export function ApplicationStatusBadge({
  status,
  compact = false,
}: {
  status: ApplicationStatus;
  compact?: boolean;
}) {
  return (
    <span
      className={`dash-status dash-status-${toneByStatus[status]}`}
      data-compact={compact || undefined}
    >
      <span className="dash-status-dot" aria-hidden="true" />
      {applicationStatusLabels[status]}
    </span>
  );
}
