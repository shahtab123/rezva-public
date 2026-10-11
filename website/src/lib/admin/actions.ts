"use server";

import { auth } from "@/lib/admin/auth";
import { revalidateApplicationPaths } from "@/lib/admin/revalidate-paths";
import {
  getApplication,
  getDictionaryRequest,
  updateApplication,
  updateDictionaryRequest,
  updateSettings,
  getSettings,
  appendAudit,
  addDictionaryEntry,
  removeDictionaryEntry,
  setRegistryDemoStatus,
} from "@/lib/admin/store";
import {
  hasPermission,
  type AdminAuditAction,
  type AdminPermission,
} from "@/lib/admin/types";
import { revalidatePath } from "next/cache";
import { invokeOperatorMutation, getOperatorClientConfig, syncProtectedDictionaryAdd, syncProtectedDictionaryRemove, activateRegistryNameByLabel, updateOperatorNamespace } from "@/lib/admin/operator-client";
import { isDemoRegistryResourceId } from "@/lib/admin/demo-registry";

function revalidateNameReviewPaths(id?: string) {
  revalidatePath("/admin");
  revalidatePath("/admin/registry/name-reviews");
  revalidatePath("/admin/registry/name-reviews/pending");
  revalidatePath("/admin/registry/name-reviews/verified");
  revalidatePath("/admin/registry/name-reviews/rejected");
  if (id) {
    revalidatePath(`/admin/registry/name-reviews/${id}`);
  }
}

async function requireAdmin(permission?: AdminPermission) {
  const session = await auth();
  if (!session?.user?.id) {
    throw new Error("Unauthorized");
  }
  if (
    permission &&
    !hasPermission(
      {
        accountType: session.user.accountType,
        permissions: session.user.permissions,
        status: "active",
      },
      permission,
    )
  ) {
    throw new Error("Forbidden");
  }
  return session.user;
}

export async function approveApplicationAction(formData: FormData) {
  const user = await requireAdmin("applications:review");
  const id = String(formData.get("id") ?? "");
  const existing = await getApplication(id);
  if (!existing) throw new Error("Application not found");
  await updateApplication(
    id,
    { status: "approved", rejectionReason: undefined },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "application.approve",
      reason: String(formData.get("reason") ?? "Approved"),
    },
  );
  revalidateApplicationPaths(id, existing.kind);
}

export async function rejectApplicationAction(formData: FormData) {
  const user = await requireAdmin("applications:review");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Rejected");
  const existing = await getApplication(id);
  if (!existing) throw new Error("Application not found");
  await updateApplication(
    id,
    { status: "rejected", rejectionReason: reason },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "application.reject",
      reason,
    },
  );
  revalidateApplicationPaths(id, existing.kind);
}

export async function requestApplicationDocumentsAction(formData: FormData) {
  const user = await requireAdmin("applications:review");
  const id = String(formData.get("id") ?? "");
  const required = String(formData.get("required") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  if (!required) throw new Error("Required documents must be specified");
  const existing = await getApplication(id);
  if (!existing) throw new Error("Application not found");

  await updateApplication(
    id,
    {
      status: "additional_info_requested",
      documentRequest: {
        required,
        reason,
        message,
        requestedAt: new Date().toISOString(),
        requestedBy: user.username,
      },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "application.request_documents",
      reason,
      message: `${required} - ${message}`,
    },
  );
  revalidateApplicationPaths(id, existing.kind);
}

export async function suspendApplicationAction(formData: FormData) {
  const user = await requireAdmin("applications:review");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Suspended");
  const existing = await getApplication(id);
  if (!existing) throw new Error("Application not found");
  await updateApplication(
    id,
    { status: "suspended", rejectionReason: reason },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "application.suspend",
      reason,
    },
  );
  revalidateApplicationPaths(id, existing.kind);
}

export async function reactivateApplicationAction(formData: FormData) {
  const user = await requireAdmin("applications:review");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Reactivated after review");
  const existing = await getApplication(id);
  if (!existing) throw new Error("Application not found");
  await updateApplication(
    id,
    { status: "approved", rejectionReason: undefined },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "application.reactivate",
      reason,
    },
  );
  revalidateApplicationPaths(id, existing.kind);
}

export async function approveDictionaryAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "Approved after review");
  const existing = getDictionaryRequest(id);
  if (!existing) throw new Error("Not found");
  if (getOperatorClientConfig()) {
    await activateRegistryNameByLabel(existing.name, note);
  }
  updateDictionaryRequest(
    id,
    {
      status: "verified",
      decision: { by: user.username, at: new Date().toISOString(), note },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "dictionary.approve",
      reason: note,
      historyAction: "approved",
    },
  );
  revalidateNameReviewPaths(id);
}

export async function rejectDictionaryAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const id = String(formData.get("id") ?? "");
  const note = String(formData.get("note") ?? "Rejected");
  updateDictionaryRequest(
    id,
    {
      status: "rejected",
      decision: { by: user.username, at: new Date().toISOString(), note },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "dictionary.reject",
      reason: note,
      historyAction: "rejected",
    },
  );
  revalidateNameReviewPaths(id);
}

export async function requestDictionaryDocumentsAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const id = String(formData.get("id") ?? "");
  const required = String(formData.get("required") ?? "").trim();
  const reason = String(formData.get("reason") ?? "").trim();
  const message = String(formData.get("message") ?? "").trim();
  updateDictionaryRequest(
    id,
    {
      status: "additional_info_requested",
      documentRequest: {
        required,
        reason,
        message,
        requestedAt: new Date().toISOString(),
        requestedBy: user.username,
      },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "dictionary.request_documents",
      reason,
      message,
      historyAction: "documents_requested",
    },
  );
  revalidateNameReviewPaths(id);
}

export async function markDictionaryProtectedAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const id = String(formData.get("id") ?? "");
  const existing = getDictionaryRequest(id);
  if (!existing) throw new Error("Not found");
  updateDictionaryRequest(
    id,
    {
      status: "rejected",
      decision: {
        by: user.username,
        at: new Date().toISOString(),
        note: "Kept protected / reserved - not released to applicant",
      },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "dictionary.mark_protected",
      reason: "Mark protected",
      historyAction: "marked_protected",
    },
  );
  revalidateNameReviewPaths(id);
}

export async function reserveDictionaryNameAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const id = String(formData.get("id") ?? "");
  const reason = String(formData.get("reason") ?? "Reserved by protocol admin");
  updateDictionaryRequest(
    id,
    {
      status: "rejected",
      decision: {
        by: user.username,
        at: new Date().toISOString(),
        note: reason,
      },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: "dictionary.reserve",
      reason,
      historyAction: "reserved",
    },
  );
  revalidateNameReviewPaths(id);
}

export async function addDictionaryEntryAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const name = String(formData.get("name") ?? "");
  const reason = String(formData.get("reason") ?? "Manual dictionary add").trim();
  const result = addDictionaryEntry(name, {
    adminId: user.id,
    adminUsername: user.username,
    reason,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
  if (getOperatorClientConfig()) {
    await syncProtectedDictionaryAdd(result.name, reason);
  }
  revalidatePath("/admin/dictionary");
}

export async function removeDictionaryEntryAction(formData: FormData) {
  const user = await requireAdmin("dictionary:review");
  const name = String(formData.get("name") ?? "");
  const reason = String(formData.get("reason") ?? "Manual dictionary remove").trim();
  if (!reason) throw new Error("Reason required");
  const result = removeDictionaryEntry(name, {
    adminId: user.id,
    adminUsername: user.username,
    reason,
  });
  if (!result.ok) {
    throw new Error(result.error);
  }
  if (getOperatorClientConfig()) {
    await syncProtectedDictionaryRemove(result.name);
  }
  revalidatePath("/admin/dictionary");
}

export async function setProviderProductionAccessAction(formData: FormData) {
  const user = await requireAdmin("providers:manage");
  const id = String(formData.get("id") ?? "");
  const grant = String(formData.get("grant") ?? "") === "true";
  const reason = String(formData.get("reason") ?? "").trim();
  if (!reason) throw new Error("Reason required");
  const existing = await getApplication(id);
  if (!existing || existing.kind !== "provider") {
    throw new Error("Provider application not found");
  }
  await updateApplication(
    id,
    {
      status: grant ? "approved" : existing.status === "approved" ? "suspended" : existing.status,
      payload: {
        ...existing.payload,
        "Production access": grant ? "granted" : "revoked",
      },
    },
    {
      adminId: user.id,
      adminUsername: user.username,
      action: grant ? "provider.approve" : "provider.revoke_access",
      reason,
    },
  );
  revalidateApplicationPaths(id, existing.kind);
  revalidatePath("/admin/providers");
}

export async function approveNamespaceAction(formData: FormData) {
  const user = await requireAdmin("namespaces:manage");
  const slug = String(formData.get("slug") ?? "").trim().replace(/^\./, "");
  const reason = String(formData.get("reason") ?? "Namespace approved").trim();
  if (!slug) throw new Error("Namespace slug required");
  const ok = await updateOperatorNamespace(slug, { status: "active" });
  if (!ok) {
    throw new Error("Could not approve namespace. Check OPERATOR_API_KEY and registry worker.");
  }
  appendAudit({
    adminId: user.id,
    adminUsername: user.username,
    action: "namespace.approve",
    resourceType: "namespace",
    resourceId: slug,
    previousState: "submitted",
    newState: "active",
    reason,
    authorizationReference: "operator-api",
  });
  revalidatePath("/admin/registry/namespaces");
  revalidatePath("/admin/activity/registry");
}

export async function rejectNamespaceAction(formData: FormData) {
  const user = await requireAdmin("namespaces:manage");
  const slug = String(formData.get("slug") ?? "").trim().replace(/^\./, "");
  const reason = String(formData.get("reason") ?? "Namespace rejected").trim();
  if (!slug || !reason) throw new Error("Namespace slug and reason required");
  const ok = await updateOperatorNamespace(slug, { status: "rejected" });
  if (!ok) {
    throw new Error("Could not reject namespace. Check OPERATOR_API_KEY and registry worker.");
  }
  appendAudit({
    adminId: user.id,
    adminUsername: user.username,
    action: "namespace.reject",
    resourceType: "namespace",
    resourceId: slug,
    previousState: "submitted",
    newState: "rejected",
    reason,
    authorizationReference: "operator-api",
  });
  revalidatePath("/admin/registry/namespaces");
  revalidatePath("/admin/activity/registry");
}

export async function suspendNamespaceAction(formData: FormData) {
  const user = await requireAdmin("namespaces:manage");
  const slug = String(formData.get("slug") ?? "").trim().replace(/^\./, "");
  const reason = String(formData.get("reason") ?? "Namespace suspended").trim();
  if (!slug || !reason) throw new Error("Namespace slug and reason required");
  const ok = await updateOperatorNamespace(slug, { status: "suspended" });
  if (!ok) {
    throw new Error("Could not suspend namespace. Check OPERATOR_API_KEY and registry worker.");
  }
  appendAudit({
    adminId: user.id,
    adminUsername: user.username,
    action: "namespace.suspend",
    resourceType: "namespace",
    resourceId: slug,
    previousState: "active",
    newState: "suspended",
    reason,
    authorizationReference: "operator-api",
  });
  revalidatePath("/admin/registry/namespaces");
  revalidatePath("/admin/activity/registry");
}

/**
 * Privileged registry/operator action - audit log plus optional live worker mutation.
 */
export async function privilegedRegistryAction(formData: FormData) {
  const action = String(formData.get("action") ?? "") as AdminAuditAction;
  const permission = String(formData.get("permission") ?? "registry:write") as AdminPermission;
  const user = await requireAdmin(permission);
  const resourceType = String(formData.get("resourceType") ?? "registry");
  const resourceId = String(formData.get("resourceId") ?? "");
  const previousState = String(formData.get("previousState") ?? "") || null;
  const newState = String(formData.get("newState") ?? "") || null;
  const reason = String(formData.get("reason") ?? "").trim();
  if (!resourceId || !action || !reason) {
    throw new Error("resourceId, action, and reason are required");
  }

  const operatorConfigured = Boolean(getOperatorClientConfig());
  const skipLive = isDemoRegistryResourceId(resourceId);
  const liveMutation =
    operatorConfigured && !skipLive
      ? await invokeOperatorMutation({
          auditAction: action,
          resourceType,
          resourceId,
          newState,
          reason,
          message: String(formData.get("message") ?? "") || null,
        })
      : false;

  if (operatorConfigured && !skipLive && !liveMutation) {
    const demoOnlyActions = new Set<AdminAuditAction>([
      "complaint.request_evidence",
      "name.suspend",
      "name.reactivate",
      "name.revoke",
      "name.reserve",
      "name.release",
      "provider.revoke_access",
    ]);
    if (!demoOnlyActions.has(action)) {
      throw new Error(
        "Operator API is configured but this action could not be applied live. Check resource id and required fields.",
      );
    }
  }

  appendAudit({
    adminId: user.id,
    adminUsername: user.username,
    action,
    resourceType,
    resourceId,
    previousState,
    newState,
    reason,
    message: String(formData.get("message") ?? "") || null,
    authorizationReference: liveMutation ? "operator-api" : null,
  });

  if (newState && resourceId) {
    setRegistryDemoStatus(resourceId, newState);
  }

  revalidatePath("/admin/activity/admin");
  revalidatePath("/admin/registry");
  revalidatePath("/admin/registry/identifiers");
  revalidatePath("/admin/registry/names");
  revalidatePath("/admin/registry/destinations");
  revalidatePath("/admin/registry/suspended");
  revalidatePath("/admin/complaints");
  revalidatePath("/admin/providers");
  revalidatePath("/admin/search");
}

export async function updateSafetySettingsAction(formData: FormData) {
  const user = await requireAdmin("system:write");
  updateSettings(
    {
      registrationSafetySeconds: Number(formData.get("registrationSafetySeconds") ?? 60),
      updateSafetySeconds: Number(formData.get("updateSafetySeconds") ?? 60),
      removalCooldownSeconds: Number(formData.get("removalCooldownSeconds") ?? 300),
    },
    { adminId: user.id, adminUsername: user.username, reason: "Updated safety periods" },
  );
  revalidatePath("/admin/system");
}

export async function updateRateLimitSettingsAction(formData: FormData) {
  const user = await requireAdmin("system:write");
  updateSettings(
    {
      resolveRateLimitPerMinute: Number(formData.get("resolveRateLimitPerMinute") ?? 120),
      registerRateLimitPerMinute: Number(formData.get("registerRateLimitPerMinute") ?? 30),
    },
    { adminId: user.id, adminUsername: user.username, reason: "Updated rate limits" },
  );
  revalidatePath("/admin/system");
}

export async function readSettingsAction() {
  await requireAdmin("system:read");
  return getSettings();
}
