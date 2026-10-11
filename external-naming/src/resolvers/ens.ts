import {
  createPublicClient,
  http,
  type PublicClient,
} from "viem";
import { mainnet } from "viem/chains";
import { getEnsAddress, normalize } from "viem/ens";
import { isValidEvmAddress, normalizeEvmAddress } from "../address.js";
import { matchExternalNamespace } from "../namespaces.js";
import type {
  ExternalNamingEnv,
  ExternalResolveResult,
  NameResolver,
  ResolveOptions,
} from "../types.js";

export type EnsClient = {
  getAddress(name: string): Promise<string | null>;
};

function ensRpcCandidates(env: ExternalNamingEnv): string[] {
  const primary = env.ETHEREUM_RPC_URL?.trim();
  // Prefer endpoints that still serve eth_call to the ENS Universal Resolver
  // (viem resolveWithGateways). Many public RPCs return 410 / drop these calls.
  const fallbacks = [
    "https://0xrpc.io/eth",
    "https://1rpc.io/eth",
    "https://eth.llamarpc.com",
    "https://cloudflare-eth.com",
    "https://ethereum.publicnode.com",
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

function defaultEnsClient(env: ExternalNamingEnv): EnsClient {
  const rpcs = ensRpcCandidates(env);
  return {
    async getAddress(name: string) {
      const normalized = normalize(name);
      let lastError: unknown;
      for (const rpc of rpcs) {
        const client: PublicClient = createPublicClient({
          chain: mainnet,
          transport: http(rpc),
        });
        try {
          const address = await getEnsAddress(client, { name: normalized });
          if (address) return address;
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
 * ENS resolver via Universal Resolver / viem getEnsAddress (ENSIP-10 aware).
 * Authoritative source: Ethereum ENS — not Rezva storage.
 */
export function createEnsResolver(
  env: ExternalNamingEnv = {},
  client: EnsClient = defaultEnsClient(env),
): NameResolver {
  return {
    provider: "ens",
    canResolve(identifier: string) {
      const match = matchExternalNamespace(identifier);
      return match?.provider === "ens";
    },
    async resolve(
      identifier: string,
      _options?: ResolveOptions,
    ): Promise<ExternalResolveResult> {
      const match = matchExternalNamespace(identifier);
      if (!match || match.provider !== "ens") {
        return {
          ok: false,
          code: "UNSUPPORTED_NAMESPACE",
          message: "Not an ENS .eth name.",
        };
      }

      let normalizedName: string;
      try {
        normalizedName = normalize(match.name);
      } catch {
        return {
          ok: false,
          code: "NAME_NOT_FOUND",
          message: "ENS name failed normalization.",
          match,
        };
      }

      let address: string | null;
      try {
        address = await client.getAddress(normalizedName);
      } catch (error) {
        return {
          ok: false,
          code: "RESOLVER_ERROR",
          message:
            error instanceof Error ? error.message : "ENS resolution failed.",
          match,
        };
      }

      if (!address) {
        return {
          ok: false,
          code: "NAME_NOT_FOUND",
          message: "This ENS name does not resolve to a wallet.",
          match,
        };
      }

      if (!isValidEvmAddress(address)) {
        return {
          ok: false,
          code: "INVALID_DESTINATION",
          message: "ENS returned an invalid payment address.",
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
            chain: "ethereum",
            asset: "ETH",
            address: normalizeEvmAddress(address),
            payment_ready: true,
          },
        ],
      };
    },
  };
}
