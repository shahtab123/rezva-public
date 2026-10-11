import type { PaymentDestinationInput } from "@universal-payment/protocol";

const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;

export function validatePaymentDestination(
  destination: PaymentDestinationInput,
): string | null {
  if (!destination.chain?.trim()) {
    return "chain is required";
  }
  if (!destination.asset?.trim()) {
    return "asset is required";
  }
  if (!destination.address?.trim()) {
    return "address is required";
  }
  const chain = destination.chain.trim().toLowerCase();
  const address = destination.address.trim();
  if (
    chain === "base" ||
    chain === "base-sepolia" ||
    chain === "ethereum" ||
    chain === "polygon" ||
    chain === "arbitrum" ||
    chain === "optimism"
  ) {
    if (!ETH_ADDRESS.test(address)) {
      return "invalid EVM address for chain";
    }
  }
  return null;
}

export function validatePaymentOptions(
  options: PaymentDestinationInput[] | undefined,
): string | null {
  if (!options?.length) {
    return "at least one payment option is required";
  }
  for (const [index, option] of options.entries()) {
    const error = validatePaymentDestination(option);
    if (error) {
      return error;
    }
    if (options.slice(0, index).some((previous) => destinationsEqual(previous, option))) {
      return "duplicate payment option";
    }
  }
  return null;
}

export function normalizeNativeName(name: string): string {
  return name.trim().toLowerCase();
}

export function validateNativeName(name: string): boolean {
  const normalized = normalizeNativeName(name);
  return /^[a-z0-9][a-z0-9-]{1,62}[a-z0-9]$/.test(normalized);
}

export function destinationsEqual(
  a: PaymentDestinationInput,
  b: PaymentDestinationInput,
): boolean {
  return (
    a.chain.toLowerCase() === b.chain.toLowerCase() &&
    a.asset.toUpperCase() === b.asset.toUpperCase() &&
    a.address.toLowerCase() === b.address.toLowerCase() &&
    (a.token_contract ?? "") === (b.token_contract ?? "") &&
    (a.network_identifier ?? "") === (b.network_identifier ?? "")
  );
}

export function destinationsFingerprint(
  options: PaymentDestinationInput[],
): string {
  return JSON.stringify(
    options.map((option) => ({
      chain: option.chain.toLowerCase(),
      asset: option.asset.toUpperCase(),
      address: option.address.toLowerCase(),
      token_contract: option.token_contract ?? null,
      network_identifier: option.network_identifier ?? null,
      memo: option.memo ?? null,
      payment_reference: option.payment_reference ?? null,
      minimum_amount: option.minimum_amount ?? null,
      maximum_amount: option.maximum_amount ?? null,
      fixed_amount: option.fixed_amount ?? null,
      expiration: option.expiration ?? null,
    })),
  );
}
