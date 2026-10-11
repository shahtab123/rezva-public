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

export type BasenamesClient = {
  getAddress(basename: string): Promise<string | null>;
};

/**
 * Map user-facing `alice.base` to the on-chain ENS-compatible name `alice.base.eth`
 * for resolution only. The public identifier remains `alice.base`.
 */
export function basenamesToEnsName(basename: string): string {
  const name = basename.trim().toLowerCase();
  if (name.endsWith(".base.eth")) return name;
  if (name.endsWith(".base")) return `${name}.eth`;
  throw new Error("Not a .base name");
}

function ensRpcCandidates(env: ExternalNamingEnv): string[] {
  const primary = env.ETHEREUM_RPC_URL?.trim();
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

function defaultBasenamesClient(env: ExternalNamingEnv): BasenamesClient {
  // Resolve through Ethereum Universal Resolver (CCIP-read to Base), which is
  // the official ENS-compatible path for Base Names — without treating the
  // user input itself as ".base.eth".
  const rpcs = ensRpcCandidates(env);
  return {
    async getAddress(basename: string) {
      const ensName = normalize(basenamesToEnsName(basename));
      let lastError: unknown;
      for (const rpc of rpcs) {
        const client: PublicClient = createPublicClient({
          chain: mainnet,
          transport: http(rpc),
        });
        try {
          const address = await getEnsAddress(client, { name: ensName });
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
 * Dedicated Base Names provider for `.base`.
 * Does not reuse the ENS provider registration or treat input as `.base.eth`.
 */
export function createBasenamesResolver(
  env: ExternalNamingEnv = {},
  client: BasenamesClient = defaultBasenamesClient(env),
): NameResolver {
  return {
    provider: "basenames",
    canResolve(identifier: string) {
      const match = matchExternalNamespace(identifier);
      return match?.provider === "basenames";
    },
    async resolve(
      identifier: string,
      _options?: ResolveOptions,
    ): Promise<ExternalResolveResult> {
      const match = matchExternalNamespace(identifier);
      if (!match || match.provider !== "basenames") {
        return {
          ok: false,
          code: "UNSUPPORTED_NAMESPACE",
          message: "Not a Base Names .base name.",
        };
      }

      const normalizedName = match.name;

      let address: string | null;
      try {
        address = await client.getAddress(normalizedName);
      } catch (error) {
        return {
          ok: false,
          code: "RESOLVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Base Names resolution failed.",
          match,
        };
      }

      if (!address) {
        return {
          ok: false,
          code: "NAME_NOT_FOUND",
          message: "This Base Name does not resolve to a wallet.",
          match,
        };
      }

      if (!isValidEvmAddress(address)) {
        return {
          ok: false,
          code: "INVALID_DESTINATION",
          message: "Base Names returned an invalid payment address.",
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
            chain: "base",
            asset: "ETH",
            address: normalizeEvmAddress(address),
            network_identifier: "eip155:8453",
            payment_ready: true,
          },
        ],
      };
    },
  };
}
