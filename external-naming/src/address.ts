/** Lightweight address / destination validation for external resolve results. */

const ETH_ADDRESS = /^0x[a-fA-F0-9]{40}$/;
const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";

/** Base58 Solana address (32–44 chars, no 0/O/I/l). */
const SOLANA_ADDRESS = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

export function isValidEvmAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const trimmed = address.trim();
  if (!ETH_ADDRESS.test(trimmed)) return false;
  if (trimmed.toLowerCase() === ZERO_ADDRESS) return false;
  return true;
}

export function isValidSolanaAddress(address: string | null | undefined): boolean {
  if (!address) return false;
  const trimmed = address.trim();
  if (!SOLANA_ADDRESS.test(trimmed)) return false;
  // Reject obvious EVM lookalikes accidentally passed through.
  if (trimmed.startsWith("0x")) return false;
  return true;
}

export function normalizeEvmAddress(address: string): string {
  return address.trim().toLowerCase();
}
