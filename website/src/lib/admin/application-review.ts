import type { AdminApplication } from "@/lib/admin/types";

export function isUserSubmittedApplication(id: string): boolean {
  return id.startsWith("uapp_");
}

export function applicationListHref(kind: AdminApplication["kind"]): string {
  if (kind === "business") return "/admin/applications/businesses";
  if (kind === "provider") return "/admin/applications/providers";
  return "/admin/applications";
}

export function applicationReviewActions(app: AdminApplication) {
  const pending = ["submitted", "under_review", "additional_info_requested"].includes(
    app.status,
  );
  const seedOnly = !isUserSubmittedApplication(app.id);

  return {
    approve: pending,
    reject: pending || app.status === "approved",
    requestDocuments: ["submitted", "under_review"].includes(app.status),
    suspend: seedOnly && (app.status === "approved" || pending),
    reactivate: seedOnly && app.status === "suspended",
    providerProduction: app.kind === "provider" && app.status === "approved",
  };
}
