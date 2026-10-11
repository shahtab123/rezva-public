export type ApplicationStatus =
  | "not_applied"
  | "submitted"
  | "under_review"
  | "additional_info_requested"
  | "approved"
  | "rejected";

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

export type TrackApplication = {
  status: ApplicationStatus;
  rejectionReason?: string;
  submittedAt?: string;
  reviewedAt?: string;
  payload?: Record<string, string>;
  documentRequest?: DocumentRequest;
  documentResponse?: DocumentResponse;
  /** Server-side application id when synced */
  applicationId?: string;
};

export type DashboardApplications = {
  business: TrackApplication;
  provider: TrackApplication;
};

export const emptyApplications: DashboardApplications = {
  business: { status: "not_applied" },
  provider: { status: "not_applied" },
};

export const applicationStatusLabels: Record<ApplicationStatus, string> = {
  not_applied: "Not applied",
  submitted: "Application submitted",
  under_review: "Under review",
  additional_info_requested: "Additional information requested",
  approved: "Approved",
  rejected: "Rejected",
};

export function isApproved(status: ApplicationStatus): boolean {
  return status === "approved";
}

export function canReapply(status: ApplicationStatus): boolean {
  return status === "rejected" || status === "not_applied";
}

export function isPendingReview(status: ApplicationStatus): boolean {
  return status === "submitted" || status === "under_review";
}

export function needsAdditionalInfo(status: ApplicationStatus): boolean {
  return status === "additional_info_requested";
}

export function hasSubmittedApplication(status: ApplicationStatus): boolean {
  return status !== "not_applied";
}

/** @deprecated Use DashboardStateProvider - kept for type imports during migration */
export const dashboardMockState = emptyApplications;
