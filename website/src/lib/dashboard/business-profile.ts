import type { IdentifierResponse, NativeNameRecord } from "@universal-payment/protocol";
import type { RegistryClient } from "@universal-payment/sdk";

export type PrimaryBusinessName = {
  id: string;
  name: string;
};

export function pickPrimaryBusinessName(
  names: NativeNameRecord[],
): PrimaryBusinessName | null {
  const sorted = [...names].sort(
    (a, b) => Date.parse(a.created_at) - Date.parse(b.created_at),
  );
  const active = sorted.find((row) => row.status === "active");
  if (active) {
    return { id: active.id, name: active.name };
  }
  const pending = sorted.find((row) => row.status === "pending_review");
  if (pending) {
    return { id: pending.id, name: pending.name };
  }
  return null;
}

export async function getPrimaryBusinessName(
  client: RegistryClient,
  controllerWallet: string,
): Promise<PrimaryBusinessName | null> {
  const { names } = await client.listControllerNames(controllerWallet);
  return pickPrimaryBusinessName(names);
}

/** Attach the controller's primary business name to identifiers that lack name_id. */
export async function linkIdentifiersToPrimaryBusinessName(
  client: RegistryClient,
  primary: PrimaryBusinessName,
  identifiers: IdentifierResponse[],
): Promise<IdentifierResponse[]> {
  return Promise.all(
    identifiers.map(async (identifier) => {
      if (identifier.name_id) {
        return identifier;
      }
      return client.updateIdentifier(identifier.id, { name_id: primary.id });
    }),
  );
}

export function businessNameForIdentifier(
  identifier: Pick<IdentifierResponse, "name_id">,
  names: NativeNameRecord[],
  primary: PrimaryBusinessName | null,
): string | null {
  if (identifier.name_id) {
    return names.find((row) => row.id === identifier.name_id)?.name ?? null;
  }
  return primary?.name ?? null;
}

export function enrichIdentifierWithBusinessName<
  T extends IdentifierResponse,
>(
  identifier: T,
  names: NativeNameRecord[],
  primary: PrimaryBusinessName | null,
): T & { business_name: string | null } {
  return {
    ...identifier,
    business_name: businessNameForIdentifier(identifier, names, primary),
  };
}
