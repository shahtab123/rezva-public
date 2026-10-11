import type {
  MappingStatus,
  PaymentDestinationInput,
  PaymentOption,
  ResolveResponse,
} from "@universal-payment/protocol";
import type { RegistryConfig } from "./config.js";
import { addSeconds, isPast, nowIso } from "./config.js";
import type { IdentifierRow, PaymentDestinationRow, RegistryStore } from "./store.js";

export function isPermanentlyUnavailable(identifier: IdentifierRow): boolean {
  return (
    identifier.status === "revoked" ||
    (identifier.status === "removed" && !identifier.available_at)
  );
}

/** @deprecated Use isPermanentlyUnavailable */
export function isPermanentlyRemoved(identifier: IdentifierRow): boolean {
  return isPermanentlyUnavailable(identifier);
}

export async function advanceIdentifierState(
  store: RegistryStore,
  identifier: IdentifierRow,
  config: RegistryConfig,
): Promise<IdentifierRow> {
  let current = identifier;

  if (current.status === "pending" && current.pending_activation_at) {
    if (isPast(current.pending_activation_at)) {
      await store.activateIdentifier(current.id, nowIso());
      current = (await store.getIdentifierById(current.id)) ?? current;
    }
  }

  if (current.status === "update_pending" && current.pending_activation_at) {
    if (isPast(current.pending_activation_at)) {
      await store.commitPendingDestination(current.id, nowIso());
      current = (await store.getIdentifierById(current.id)) ?? current;
    }
  }

  if (
    current.status === "removed" &&
    current.available_at &&
    isPast(current.available_at)
  ) {
    await store.purgeRemovedIdentifier(current.id);
  }

  return current;
}

export function computePaymentReady(status: MappingStatus): boolean {
  return status === "active";
}

function mapDestinationRow(
  row: PaymentDestinationRow,
  paymentReady: boolean,
): PaymentOption {
  return {
    chain: row.chain,
    asset: row.asset,
    address: row.address,
    ...(row.token_contract ? { token_contract: row.token_contract } : {}),
    ...(row.network_identifier
      ? { network_identifier: row.network_identifier }
      : {}),
    ...(row.memo ? { memo: row.memo } : {}),
    ...(row.payment_reference
      ? { payment_reference: row.payment_reference }
      : {}),
    ...(row.minimum_amount ? { minimum_amount: row.minimum_amount } : {}),
    ...(row.maximum_amount ? { maximum_amount: row.maximum_amount } : {}),
    ...(row.fixed_amount ? { fixed_amount: row.fixed_amount } : {}),
    ...(row.expiration ? { expiration: row.expiration } : {}),
    payment_ready: paymentReady,
  };
}

function mapDestinationInput(
  destination: PaymentDestinationInput,
): Omit<PaymentOption, "payment_ready"> {
  const mapped: Omit<PaymentOption, "payment_ready"> = {
    chain: destination.chain,
    asset: destination.asset,
    address: destination.address,
  };
  if (destination.token_contract) {
    mapped.token_contract = destination.token_contract;
  }
  if (destination.network_identifier) {
    mapped.network_identifier = destination.network_identifier;
  }
  if (destination.memo) {
    mapped.memo = destination.memo;
  }
  if (destination.payment_reference) {
    mapped.payment_reference = destination.payment_reference;
  }
  if (destination.minimum_amount) {
    mapped.minimum_amount = destination.minimum_amount;
  }
  if (destination.maximum_amount) {
    mapped.maximum_amount = destination.maximum_amount;
  }
  if (destination.fixed_amount) {
    mapped.fixed_amount = destination.fixed_amount;
  }
  if (destination.expiration) {
    mapped.expiration = destination.expiration;
  }
  return mapped;
}

export async function buildResolveResponse(
  store: RegistryStore,
  identifier: IdentifierRow,
  config: RegistryConfig,
  displayValue: string,
): Promise<ResolveResponse> {
  const current = await advanceIdentifierState(store, identifier, config);
  const paymentReady = computePaymentReady(current.status as MappingStatus);
  const activeDestinations = await store.listActiveDestinations(current.id);
  const profileName = current.name_id
    ? await store.getNativeNameLabel(current.name_id)
    : undefined;

  const response: ResolveResponse = {
    protocol_version: "1",
    status: current.status as MappingStatus,
    payment_ready: paymentReady,
    identifier: {
      type: current.type,
      value: displayValue,
      normalized_value: current.normalized_value,
    },
    registration: {
      registered_at: current.registered_at,
      activated_at: current.activated_at,
      last_updated: current.last_updated,
      last_payment_update: current.last_payment_update,
    },
    payment_options: paymentReady
      ? activeDestinations.map((row) => mapDestinationRow(row, true))
      : [],
  };

  if (current.status === "removed") {
    response.available_at = current.available_at;
    response.removal_kind = current.available_at
      ? "controller_removed"
      : "revoked";
  }
  if (current.status === "revoked") {
    response.available_at = null;
    response.removal_kind = "revoked";
  }

  const warnings = await store.listActiveWarnings(current.id);
  if (warnings.length) {
    response.trust = { warnings };
  }

  if (profileName) {
    response.profile = { name: profileName };
  }

  if (current.status === "update_pending" && current.pending_destination_json) {
    const pending = JSON.parse(
      current.pending_destination_json,
    ) as PaymentDestinationInput[];
    if (pending[0]) {
      const mapped = mapDestinationInput(pending[0]);
      // Never expose the next payment address before activation - wallets must
      // only send to active payment_options. Chain/asset hint is enough for UI.
      response.pending_destination = {
        chain: mapped.chain,
        asset: mapped.asset,
        address: "",
        network_identifier: mapped.network_identifier,
        token_contract: undefined,
      };
    }
  }

  return response;
}

export function pendingActivationAt(
  fromIso: string,
  config: RegistryConfig,
  kind: "registration" | "update",
): string {
  const seconds =
    kind === "registration"
      ? config.registrationSafetySeconds
      : config.updateSafetySeconds;
  return addSeconds(fromIso, seconds);
}

export function removalAvailableAt(
  removedAt: string,
  config: RegistryConfig,
): string {
  return addSeconds(removedAt, config.removalCooldownSeconds);
}
