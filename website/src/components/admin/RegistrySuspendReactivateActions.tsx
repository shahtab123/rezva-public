import { AdminRowAction } from "@/components/admin/AdminRowAction";
import { privilegedRegistryAction } from "@/lib/admin/actions";

type RegistryResourceType =
  | "identifier"
  | "native_name"
  | "payment_destination"
  | "provider";

const SUSPEND_ACTION: Record<RegistryResourceType, string> = {
  identifier: "identifier.suspend",
  native_name: "name.suspend",
  payment_destination: "identifier.suspend",
  provider: "provider.suspend",
};

const REACTIVATE_ACTION: Record<RegistryResourceType, string> = {
  identifier: "identifier.reactivate",
  native_name: "name.reactivate",
  payment_destination: "identifier.reactivate",
  provider: "provider.reactivate",
};

const REACTIVATE_STATE: Record<RegistryResourceType, string> = {
  identifier: "active",
  native_name: "active",
  payment_destination: "active",
  provider: "approved",
};

const PERMISSION: Record<RegistryResourceType, "registry:write" | "providers:manage"> = {
  identifier: "registry:write",
  native_name: "registry:write",
  payment_destination: "registry:write",
  provider: "providers:manage",
};

export function RegistrySuspendReactivateAction({
  resourceType,
  resourceId,
  status,
  label,
}: {
  resourceType: RegistryResourceType;
  resourceId: string;
  status: string;
  label: string;
}) {
  const suspended = status === "suspended";

  if (suspended) {
    return (
      <AdminRowAction
        action={privilegedRegistryAction}
        label="Reactivate"
        icon="checkCircle2"
        danger={false}
        confirmMessage={`Reactivate ${label}? Returns to active status.`}
        reasonDefault="Suspension lifted after review"
        hiddenFields={{
          action: REACTIVATE_ACTION[resourceType],
          permission: PERMISSION[resourceType],
          resourceType,
          resourceId,
          previousState: status,
          newState: REACTIVATE_STATE[resourceType],
        }}
      />
    );
  }

  return (
    <AdminRowAction
      action={privilegedRegistryAction}
      label="Suspend"
      icon="pauseCircle"
      confirmMessage={`Suspend ${label}?`}
      hiddenFields={{
        action: SUSPEND_ACTION[resourceType],
        permission: PERMISSION[resourceType],
        resourceType,
        resourceId,
        previousState: status,
        newState: "suspended",
      }}
      reasonPlaceholder="Abuse / complaint ref"
    />
  );
}
