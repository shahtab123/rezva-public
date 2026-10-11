import {
  Connection,
  PublicKey,
  type Commitment,
} from "@solana/web3.js";
import { resolve as snsResolve } from "@bonfida/spl-name-service";
import { isValidSolanaAddress } from "../address.js";
import { matchExternalNamespace } from "../namespaces.js";
import type {
  ExternalNamingEnv,
  ExternalResolveResult,
  NameResolver,
  ResolveOptions,
} from "../types.js";

export type SnsClient = {
  /** Resolve a .sol domain to a Solana wallet address (base58). */
  resolve(domain: string): Promise<string | null>;
};

function solanaRpcCandidates(env: ExternalNamingEnv): string[] {
  const primary = env.SOLANA_RPC_URL?.trim();
  const fallbacks = [
    "https://api.mainnet-beta.solana.com",
    "https://solana-rpc.publicnode.com",
    "https://1rpc.io/sol",
  ];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const url of [primary, ...fallbacks]) {
    if (!url || seen.has(url)) continue;
    seen.add(url);
    out.push(url);
  }
  return out;
}

/**
 * Default SNS client: on-chain resolve via @bonfida/spl-name-service.
 * Optional SNS_RESOLVE_URL overrides with an HTTP helper for tests.
 */
function defaultSnsClient(env: ExternalNamingEnv): SnsClient {
  const resolveUrl = env.SNS_RESOLVE_URL?.trim();
  const rpcs = solanaRpcCandidates(env);
  const commitment: Commitment = "confirmed";

  return {
    async resolve(domain: string) {
      const name = domain.replace(/\.sol$/i, "").trim().toLowerCase();
      if (!name) return null;
      const full = domain.toLowerCase().endsWith(".sol")
        ? domain.toLowerCase()
        : `${name}.sol`;

      if (resolveUrl) {
        const url = resolveUrl
          .replace("{domain}", encodeURIComponent(full))
          .replace("{name}", encodeURIComponent(name));
        const response = await fetch(url);
        if (!response.ok) return null;
        const body = (await response.json()) as {
          address?: string;
          result?: string;
          owner?: string;
        };
        return body.address || body.result || body.owner || null;
      }

      let lastError: unknown;
      for (const rpc of rpcs) {
        try {
          const connection = new Connection(rpc, {
            commitment,
            disableRetryOnRateLimit: true,
          });
          const pubkey = await snsResolve(connection, full);
          if (!pubkey) continue;
          if (pubkey instanceof PublicKey) return pubkey.toBase58();
          if (typeof pubkey === "string") return pubkey;
          if (
            typeof pubkey === "object" &&
            pubkey !== null &&
            "toBase58" in pubkey &&
            typeof (pubkey as { toBase58: () => string }).toBase58 === "function"
          ) {
            return (pubkey as { toBase58: () => string }).toBase58();
          }
        } catch (error) {
          lastError = error;
        }
      }
      if (lastError) throw lastError;
      return null;
    },
  };
}

/**
 * Solana Name Service (.sol) resolver.
 * Authoritative source: SNS — not Rezva storage.
 */
export function createSnsResolver(
  env: ExternalNamingEnv = {},
  client: SnsClient = defaultSnsClient(env),
): NameResolver {
  return {
    provider: "sns",
    canResolve(identifier: string) {
      const match = matchExternalNamespace(identifier);
      return match?.provider === "sns";
    },
    async resolve(
      identifier: string,
      _options?: ResolveOptions,
    ): Promise<ExternalResolveResult> {
      const match = matchExternalNamespace(identifier);
      if (!match || match.provider !== "sns") {
        return {
          ok: false,
          code: "UNSUPPORTED_NAMESPACE",
          message: "Not an SNS .sol name.",
        };
      }

      const normalizedName = match.name;

      let address: string | null;
      try {
        address = await client.resolve(normalizedName);
      } catch (error) {
        return {
          ok: false,
          code: "RESOLVER_ERROR",
          message:
            error instanceof Error ? error.message : "SNS resolution failed.",
          match,
        };
      }

      if (!address) {
        return {
          ok: false,
          code: "NAME_NOT_FOUND",
          message: "This Solana name does not resolve to a wallet.",
          match,
        };
      }

      if (!isValidSolanaAddress(address)) {
        return {
          ok: false,
          code: "INVALID_DESTINATION",
          message: "SNS returned an invalid Solana address.",
          match,
        };
      }

      if (address === "11111111111111111111111111111111") {
        return {
          ok: false,
          code: "NO_PAYMENT_ADDRESS",
          message:
            "This Solana name has no wallet address linked for payments.",
          match,
        };
      }

      return {
        ok: true,
        match,
        normalizedName,
        profileName: normalizedName,
        paymentOptions: [
          {
            chain: "solana",
            asset: "SOL",
            address: address.trim(),
            network_identifier: "solana:mainnet",
            payment_ready: true,
          },
        ],
      };
    },
  };
}
