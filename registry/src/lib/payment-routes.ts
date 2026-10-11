import { apiError, type TestPaymentRecord } from "@universal-payment/protocol";
import { authenticateDashboardService, type RegistryEnv } from "./auth.js";
import { nowIso } from "./config.js";
import { errorResponse, jsonResponse, readJson } from "./http.js";
import { publicResolverUrl } from "./public-resolver-url.js";
import type { RegistryStore } from "./store.js";
import type { RegistryHooks } from "./webhook-dispatch.js";

const HASH = /^0x[a-f0-9]{64}$/i;
const TRANSFER_TOPIC =
  "0xddf252ad1be2c89b69c2b068fc378daa952ba7f163c4a11628f55a4df523b3ef";
const DEFAULT_USDC = "0x036CbD53842c5426634e7929541eC2318f3dCF7e";
const CHAIN_ID = "0x14a34";
/** Incremental scan window when we already have a cursor. */
const RECENT_SCAN_BLOCKS = 3_000;
/** When the ledger is empty, walk farther back to rediscover older demo payments. */
const EMPTY_BACKFILL_BLOCKS = 300_000;
const SCAN_CHUNK_BLOCKS = 200;
const MIN_SCAN_CHUNK_BLOCKS = 40;
/** Known shared Test Merchant demo transfers (kept for local DB resets). */
const BOOTSTRAP_TX_HASHES = [
  "0xf8da12d6bd6261033adfa8d29d82d1a0d48dc1d5d7a3a621bb38d4115caaef32",
] as const;
let lastScannedBlock: number | null = null;
let syncInFlight: Promise<void> | null = null;

type RpcLog = {
  address?: string;
  topics?: string[];
  data?: string;
  transactionHash?: string;
  blockNumber?: string;
};

type RpcReceipt = {
  status?: string;
  blockNumber?: string;
  logs?: RpcLog[];
};

type RpcTransaction = {
  from?: string;
  to?: string | null;
};

type RpcBlock = {
  timestamp?: string;
};

type ExplorerTokenTx = {
  hash?: string;
  to?: string;
  contractAddress?: string;
  value?: string;
  tokenDecimal?: string;
  from?: string;
  timeStamp?: string;
  blockNumber?: string;
};

async function rpc<T>(
  env: RegistryEnv,
  method: string,
  params: unknown[],
): Promise<T> {
  const response = await fetch(
    env.BASE_SEPOLIA_RPC_URL?.trim() || "https://sepolia.base.org",
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ jsonrpc: "2.0", id: 1, method, params }),
      signal: AbortSignal.timeout(12_000),
    },
  );
  if (!response.ok) throw new Error(`RPC returned ${response.status}`);
  const body = (await response.json()) as { result?: T; error?: { message?: string } };
  if (body.error || body.result === undefined) {
    throw new Error(body.error?.message || "RPC returned no result");
  }
  return body.result;
}

function addressFromTopic(topic: string | undefined): string | null {
  if (!topic || !/^0x[0-9a-f]{64}$/i.test(topic)) return null;
  return `0x${topic.slice(-40)}`;
}

function formatUsdc(raw: bigint): string {
  const whole = raw / 1_000_000n;
  const fraction = (raw % 1_000_000n).toString().padStart(6, "0").replace(/0+$/, "");
  return fraction ? `${whole}.${fraction}` : whole.toString();
}

function notConfigured(): Response {
  return errorResponse(
    apiError(
      "TEST_MERCHANT_NOT_CONFIGURED",
      "The shared protocol Test Merchant is not configured for this environment.",
    ),
    503,
  );
}

function merchantPayload(
  merchant: NonNullable<Awaited<ReturnType<RegistryStore["getSharedTestMerchant"]>>>,
  env: RegistryEnv,
) {
  return {
    identifier_id: merchant.identifier_id,
    identifier_value: merchant.identifier_value,
    qr_payload: {
      resolver_url: publicResolverUrl(env),
      type: "custom",
      value: merchant.identifier_value,
    },
    wallet_address: merchant.wallet_address,
    network: merchant.network,
    asset: merchant.asset,
    token_contract: merchant.token_contract,
  };
}

export async function handlePaymentRequest(
  store: RegistryStore,
  request: Request,
  env: RegistryEnv,
  hooks?: RegistryHooks,
): Promise<Response | null> {
  const url = new URL(request.url);
  const path = url.pathname;
  if (!path.startsWith("/v1/free-api/test-merchant/payments")) return null;
  if (!authenticateDashboardService(request, env)) {
    return errorResponse(apiError("UNAUTHORIZED", "Dashboard service authentication is required."), 401);
  }

  if (request.method === "GET" && path === "/v1/free-api/test-merchant/payments") {
    const merchant = await store.getSharedTestMerchant();
    if (!merchant) return notConfigured();
    let payments = await store.listTestPayments();
    // Local DB resets wipe the ledger — re-import known demo txs before responding.
    if (payments.length === 0) {
      await bootstrapKnownPayments(store, env);
      payments = await store.listTestPayments();
    }
    schedulePaymentSync(store, env, merchant, hooks);
    return jsonResponse({
      merchant: merchantPayload(merchant, env),
      payments,
      syncing: true,
    });
  }

  if (request.method === "POST" && path === "/v1/free-api/test-merchant/payments/detect") {
    const body = await readJson<{ transaction_hash?: string }>(request);
    const hash = body.transaction_hash?.trim().toLowerCase();
    if (!hash || !HASH.test(hash)) {
      return errorResponse(apiError("VALIDATION_ERROR", "transaction_hash must be a 32-byte hash."), 400);
    }
    try {
      const payment = await detectPayment(store, env, hash);
      return jsonResponse({ payment }, 201);
    } catch (error) {
      return errorResponse(
        apiError(
          "VALIDATION_ERROR",
          error instanceof Error ? error.message : "Transaction did not match the shared Test Merchant.",
        ),
        422,
      );
    }
  }
  return null;
}

function schedulePaymentSync(
  store: RegistryStore,
  env: RegistryEnv,
  merchant: NonNullable<Awaited<ReturnType<RegistryStore["getSharedTestMerchant"]>>>,
  hooks?: RegistryHooks,
): void {
  if (!syncInFlight) {
    syncInFlight = syncRecentPayments(store, env, merchant)
      .catch((error) => {
        console.warn(
          "[test-merchant/payments] background sync failed:",
          error instanceof Error ? error.message : error,
        );
      })
      .finally(() => {
        syncInFlight = null;
      });
  }
  if (hooks?.waitUntil) {
    hooks.waitUntil(syncInFlight);
  }
}

async function getLogsChunk(
  env: RegistryEnv,
  filter: {
    address: string;
    fromBlock: string;
    toBlock: string;
    topics: (string | null)[];
  },
  chunkStart: number,
  chunkEnd: number,
): Promise<RpcLog[]> {
  try {
    return await rpc<RpcLog[]>(env, "eth_getLogs", [filter]);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    const oversized = /413|payload|too large|limit exceeded|response size/i.test(
      message,
    );
    const span = chunkEnd - chunkStart + 1;
    if (!oversized || span <= MIN_SCAN_CHUNK_BLOCKS) {
      throw error;
    }
    const mid = chunkStart + Math.floor(span / 2) - 1;
    const left = await getLogsChunk(
      env,
      {
        ...filter,
        fromBlock: `0x${chunkStart.toString(16)}`,
        toBlock: `0x${mid.toString(16)}`,
      },
      chunkStart,
      mid,
    );
    const right = await getLogsChunk(
      env,
      {
        ...filter,
        fromBlock: `0x${(mid + 1).toString(16)}`,
        toBlock: `0x${chunkEnd.toString(16)}`,
      },
      mid + 1,
      chunkEnd,
    );
    return [...left, ...right];
  }
}

async function bootstrapKnownPayments(
  store: RegistryStore,
  env: RegistryEnv,
): Promise<void> {
  for (const hash of BOOTSTRAP_TX_HASHES) {
    if (await store.getTestPaymentByHash(hash)) continue;
    try {
      await detectPayment(store, env, hash);
    } catch (error) {
      console.warn(
        `[test-merchant/payments] bootstrap ${hash.slice(0, 10)}… skipped:`,
        error instanceof Error ? error.message : error,
      );
    }
  }
}

async function backfillFromExplorer(
  store: RegistryStore,
  env: RegistryEnv,
  merchant: NonNullable<Awaited<ReturnType<RegistryStore["getSharedTestMerchant"]>>>,
): Promise<void> {
  const url = new URL("https://api-sepolia.basescan.org/api");
  url.searchParams.set("module", "account");
  url.searchParams.set("action", "tokentx");
  url.searchParams.set("contractaddress", merchant.token_contract || DEFAULT_USDC);
  url.searchParams.set("address", merchant.wallet_address);
  url.searchParams.set("page", "1");
  url.searchParams.set("offset", "50");
  url.searchParams.set("sort", "desc");
  const apiKey = env.BASESCAN_API_KEY?.trim();
  if (apiKey) url.searchParams.set("apikey", apiKey);

  const response = await fetch(url, { signal: AbortSignal.timeout(12_000) });
  if (!response.ok) throw new Error(`Explorer returned ${response.status}`);
  const body = (await response.json()) as {
    status?: string;
    message?: string;
    result?: ExplorerTokenTx[] | string;
  };
  if (!Array.isArray(body.result)) {
    throw new Error(typeof body.result === "string" ? body.result : "Explorer returned no transfers");
  }

  for (const row of body.result) {
    const hash = row.hash?.trim().toLowerCase();
    if (!hash || !HASH.test(hash)) continue;
    if (
      row.to?.toLowerCase() !== merchant.wallet_address.toLowerCase() ||
      row.contractAddress?.toLowerCase() !==
        (merchant.token_contract || DEFAULT_USDC).toLowerCase()
    ) {
      continue;
    }
    if (await store.getTestPaymentByHash(hash)) continue;
    try {
      await detectPayment(store, env, hash);
    } catch {
      // Fall through — RPC receipt path may fail for very old pruned nodes.
      const amountRaw = BigInt(row.value || "0");
      if (amountRaw <= 0n || !row.from) continue;
      await store.createTestPayment({
        merchant_identifier_id: merchant.identifier_id,
        transaction_hash: hash,
        network: merchant.network,
        asset: merchant.asset,
        amount: formatUsdc(amountRaw),
        amount_raw: amountRaw.toString(),
        sender: row.from,
        recipient: merchant.wallet_address,
        timestamp: row.timeStamp
          ? new Date(Number(row.timeStamp) * 1000).toISOString()
          : nowIso(),
        confirmation_status: "CONFIRMED",
        testnet: true,
        block_number: row.blockNumber ? Number(row.blockNumber) : null,
      });
    }
  }
}

async function syncRecentPayments(
  store: RegistryStore,
  env: RegistryEnv,
  merchant: NonNullable<Awaited<ReturnType<RegistryStore["getSharedTestMerchant"]>>>,
): Promise<void> {
  const existing = await store.listTestPayments(1);
  if (existing.length === 0) {
    await bootstrapKnownPayments(store, env);
    try {
      await backfillFromExplorer(store, env, merchant);
    } catch (error) {
      console.warn(
        "[test-merchant/payments] explorer backfill skipped:",
        error instanceof Error ? error.message : error,
      );
    }
  }

  const latestBlock = await rpc<string>(env, "eth_blockNumber", []);
  const latestNumber = Number(BigInt(latestBlock));
  const storedMax = await store.getMaxTestPaymentBlock();
  if (lastScannedBlock === null && storedMax !== null) {
    lastScannedBlock = storedMax;
  }

  const lookback =
    existing.length === 0 && storedMax === null
      ? EMPTY_BACKFILL_BLOCKS
      : RECENT_SCAN_BLOCKS;
  const fromNumber =
    lastScannedBlock === null
      ? Math.max(0, latestNumber - lookback)
      : Math.max(0, lastScannedBlock + 1);
  if (fromNumber > latestNumber) {
    lastScannedBlock = latestNumber;
    return;
  }

  const recipientTopic = `0x${merchant.wallet_address
    .replace(/^0x/i, "")
    .padStart(64, "0")}`;
  for (let chunkStart = fromNumber; chunkStart <= latestNumber; chunkStart += SCAN_CHUNK_BLOCKS) {
    const chunkEnd = Math.min(chunkStart + SCAN_CHUNK_BLOCKS - 1, latestNumber);
    let logs: RpcLog[] = [];
    try {
      logs = await getLogsChunk(
        env,
        {
          address: merchant.token_contract || DEFAULT_USDC,
          fromBlock: `0x${chunkStart.toString(16)}`,
          toBlock: `0x${chunkEnd.toString(16)}`,
          topics: [TRANSFER_TOPIC, null, recipientTopic],
        },
        chunkStart,
        chunkEnd,
      );
    } catch (error) {
      console.warn(
        `[test-merchant/payments] eth_getLogs ${chunkStart}-${chunkEnd} skipped:`,
        error instanceof Error ? error.message : error,
      );
      continue;
    }

    for (const log of logs) {
      const transactionHash = log.transactionHash?.toLowerCase();
      if (!transactionHash || (await store.getTestPaymentByHash(transactionHash))) {
        continue;
      }
      try {
        await detectPayment(store, env, transactionHash);
      } catch {
        // Ignore unrelated or incomplete logs; explicit hash verification reports errors.
      }
    }
    lastScannedBlock = chunkEnd;
  }
  lastScannedBlock = latestNumber;
}

async function detectPayment(
  store: RegistryStore,
  env: RegistryEnv,
  transactionHash: string,
): Promise<TestPaymentRecord> {
  const existing = await store.getTestPaymentByHash(transactionHash);
  if (existing) return existing;
  const merchant = await store.getSharedTestMerchant();
  if (!merchant) throw new Error("The shared protocol Test Merchant is not configured.");
  const [chainId, receipt, transaction] = await Promise.all([
    rpc<string>(env, "eth_chainId", []),
    rpc<RpcReceipt | null>(env, "eth_getTransactionReceipt", [transactionHash]),
    rpc<RpcTransaction | null>(env, "eth_getTransactionByHash", [transactionHash]),
  ]);
  if (chainId !== CHAIN_ID) throw new Error("Configured RPC is not Base Sepolia.");
  if (!receipt || !transaction || receipt.status !== "0x1" || !receipt.blockNumber) {
    throw new Error("Transaction is not confirmed on Base Sepolia.");
  }
  if (transaction.to?.toLowerCase() !== merchant.token_contract.toLowerCase()) {
    throw new Error("Transaction recipient is not the shared USDC contract.");
  }
  const transfer = (receipt.logs ?? []).find(
    (log) =>
      log.address?.toLowerCase() === merchant.token_contract.toLowerCase() &&
      log.topics?.[0]?.toLowerCase() === TRANSFER_TOPIC &&
      addressFromTopic(log.topics[2])?.toLowerCase() === merchant.wallet_address.toLowerCase(),
  );
  const sender = addressFromTopic(transfer?.topics?.[1]);
  if (!transfer || !sender || !transfer.data) {
    throw new Error("Confirmed transaction contains no transfer to the shared Test Merchant.");
  }
  const amountRaw = BigInt(transfer.data).toString();
  if (amountRaw === "0") throw new Error("Test Merchant payment amount must be positive.");
  const block = await rpc<RpcBlock | null>(
    env,
    "eth_getBlockByNumber",
    [receipt.blockNumber, false],
  );
  const timestamp = block?.timestamp
    ? new Date(Number(BigInt(block.timestamp)) * 1000).toISOString()
    : nowIso();
  return store.createTestPayment({
    merchant_identifier_id: merchant.identifier_id,
    transaction_hash: transactionHash,
    network: merchant.network,
    asset: merchant.asset,
    amount: formatUsdc(BigInt(amountRaw)),
    amount_raw: amountRaw,
    sender: transaction.from || sender,
    recipient: merchant.wallet_address,
    timestamp,
    confirmation_status: "CONFIRMED",
    testnet: true,
    block_number: Number(BigInt(receipt.blockNumber)),
  });
}
