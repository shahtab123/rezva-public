import {
  createPublicClient,
  http,
  parseAbi,
  type PublicClient,
} from "viem";
import { polygon } from "viem/chains";
import { namehash, normalize } from "viem/ens";
import { isValidEvmAddress, isValidSolanaAddress, normalizeEvmAddress } from "../address.js";
import { matchExternalNamespace } from "../namespaces.js";
import type {
  ExternalNamingEnv,
  ExternalResolveResult,
  NameResolver,
  ResolveOptions,
} from "../types.js";
import type { PaymentOption } from "@universal-payment/protocol";

export type UnstoppableRecords = Record<string, string | undefined | null>;

export type UnstoppableClient = {
  getRecords(domain: string): Promise<UnstoppableRecords | null>;
};

/** Polygon UNS ProxyReader (mainnet). */
const POLYGON_PROXY_READER =
  "0x91EDd8708062bd4233f4Dd0FCE15A7cb4d500091" as const;

const PROXY_ABI = parseAbi([
  "function exists(uint256 tokenId) view returns (bool)",
  "function getMany(string[] keys, uint256 tokenId) view returns (string[] values)",
]);

const RECORD_KEYS = [
  "crypto.ETH.address",
  "crypto.MATIC.address",
  "crypto.POL.address",
  "crypto.SOL.address",
  "crypto.BTC.address",
] as const;

function polygonRpcCandidates(env: ExternalNamingEnv): string[] {
  const primary = env.POLYGON_RPC_URL?.trim();
  const fallbacks = [
    "https://polygon-bor-rpc.publicnode.com",
    "https://1rpc.io/matic",
    "https://polygon.llamarpc.com",
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
 * Worker-safe on-chain UNS resolve via Polygon ProxyReader + viem.
 * Avoids @unstoppabledomains/resolution (eval / Buffer — blocked on CF Workers).
 */
function defaultUnstoppableClient(env: ExternalNamingEnv): UnstoppableClient {
  const rpcs = polygonRpcCandidates(env);
  const apiKey = env.UNSTOPPABLE_API_KEY?.trim();
  const apiBase =
    env.UNSTOPPABLE_API_BASE?.trim().replace(/\/$/, "") ||
    "https://api.unstoppabledomains.com/resolve";

  return {
    async getRecords(domain: string) {
      const tokenId = BigInt(namehash(normalize(domain)));
      let lastError: unknown;

      for (const rpc of rpcs) {
        const client: PublicClient = createPublicClient({
          chain: polygon,
          transport: http(rpc),
        });
        try {
          const exists = await client.readContract({
            address: POLYGON_PROXY_READER,
            abi: PROXY_ABI,
            functionName: "exists",
            args: [tokenId],
          });
          if (!exists) return null;

          const values = await client.readContract({
            address: POLYGON_PROXY_READER,
            abi: PROXY_ABI,
            functionName: "getMany",
            args: [[...RECORD_KEYS], tokenId],
          });

          const records: UnstoppableRecords = {};
          for (let i = 0; i < RECORD_KEYS.length; i++) {
            const key = RECORD_KEYS[i];
            const value = values[i];
            if (key && typeof value === "string" && value.trim()) {
              records[key] = value.trim();
            }
          }
          return records;
        } catch (error) {
          lastError = error;
        }
      }

      if (apiKey && !apiKey.startsWith("ud_mcp_")) {
        const response = await fetch(
          `${apiBase}/domains/${encodeURIComponent(domain)}`,
          {
            headers: {
              Accept: "application/json",
              Authorization: `Bearer ${apiKey}`,
            },
          },
        );
        if (response.status === 404) return null;
        if (!response.ok) {
          throw new Error(`Unstoppable Domains API error (${response.status})`);
        }
        const body = (await response.json()) as {
          records?: UnstoppableRecords;
        };
        return body.records ?? {};
      }

      if (lastError) throw lastError;
      return null;
    },
  };
}

function pickPaymentOptions(
  records: UnstoppableRecords,
  options?: ResolveOptions,
): { options: PaymentOption[]; hadInvalid: boolean } {
  const preferredChain = options?.preferredChain?.toLowerCase();
  const preferredAsset = options?.preferredAsset?.toUpperCase();
  let hadInvalid = false;

  const candidates: Array<{
    chain: string;
    asset: string;
    address: string;
    network_identifier?: string;
    score: number;
  }> = [];

  const eth =
    records["crypto.ETH.address"] ||
    records["crypto.ETHADDR.address"] ||
    records["token.ETH.address"];
  if (typeof eth === "string" && eth.trim()) {
    if (isValidEvmAddress(eth)) {
      candidates.push({
        chain: "ethereum",
        asset: "ETH",
        address: normalizeEvmAddress(eth),
        network_identifier: "eip155:1",
        score: preferredChain === "ethereum" || preferredAsset === "ETH" ? 100 : 50,
      });
    } else {
      hadInvalid = true;
    }
  }

  const matic = records["crypto.MATIC.address"] || records["crypto.POL.address"];
  if (typeof matic === "string" && matic.trim()) {
    if (isValidEvmAddress(matic)) {
      candidates.push({
        chain: "polygon",
        asset: "MATIC",
        address: normalizeEvmAddress(matic),
        network_identifier: "eip155:137",
        score: preferredChain === "polygon" ? 100 : 40,
      });
    } else {
      hadInvalid = true;
    }
  }

  const sol = records["crypto.SOL.address"];
  if (typeof sol === "string" && sol.trim()) {
    if (isValidSolanaAddress(sol)) {
      candidates.push({
        chain: "solana",
        asset: "SOL",
        address: sol.trim(),
        network_identifier: "solana:mainnet",
        score: preferredChain === "solana" || preferredAsset === "SOL" ? 100 : 45,
      });
    } else {
      hadInvalid = true;
    }
  }

  const btc = records["crypto.BTC.address"];
  if (btc && typeof btc === "string" && btc.trim().length >= 26) {
    candidates.push({
      chain: "bitcoin",
      asset: "BTC",
      address: btc.trim(),
      score: preferredChain === "bitcoin" || preferredAsset === "BTC" ? 100 : 20,
    });
  }

  candidates.sort((a, b) => b.score - a.score);

  return {
    hadInvalid,
    options: candidates.map((c) => ({
      chain: c.chain,
      asset: c.asset,
      address: c.address,
      network_identifier: c.network_identifier,
      payment_ready: true,
    })),
  };
}

/**
 * Unstoppable Domains resolver (on-chain UNS via Polygon ProxyReader).
 * Authoritative source: UD registry — not Rezva storage.
 */
export function createUnstoppableResolver(
  env: ExternalNamingEnv = {},
  client: UnstoppableClient = defaultUnstoppableClient(env),
): NameResolver {
  return {
    provider: "unstoppable",
    canResolve(identifier: string) {
      const match = matchExternalNamespace(identifier);
      return match?.provider === "unstoppable";
    },
    async resolve(
      identifier: string,
      options?: ResolveOptions,
    ): Promise<ExternalResolveResult> {
      const match = matchExternalNamespace(identifier);
      if (!match || match.provider !== "unstoppable") {
        return {
          ok: false,
          code: "UNSUPPORTED_NAMESPACE",
          message: "Not an Unstoppable Domains name.",
        };
      }

      const normalizedName = match.name;

      let records: UnstoppableRecords | null;
      try {
        records = await client.getRecords(normalizedName);
      } catch (error) {
        return {
          ok: false,
          code: "RESOLVER_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "Unstoppable Domains resolution failed.",
          match,
        };
      }

      if (records === null) {
        return {
          ok: false,
          code: "NAME_NOT_FOUND",
          message:
            "This Unstoppable Domains name is not registered or not minted.",
          match,
        };
      }

      const picked = pickPaymentOptions(records, options);
      if (picked.options.length === 0) {
        if (picked.hadInvalid) {
          return {
            ok: false,
            code: "INVALID_DESTINATION",
            message: "Unstoppable Domains returned an invalid destination.",
            match,
          };
        }
        return {
          ok: false,
          code: "NO_PAYMENT_ADDRESS",
          message:
            "This Unstoppable Domains name has no wallet address linked for payments.",
          match,
        };
      }

      return {
        ok: true,
        match,
        normalizedName,
        profileName: normalizedName,
        paymentOptions: picked.options,
      };
    },
  };
}
