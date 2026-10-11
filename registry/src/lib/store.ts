import type {
  ComplaintRecord,
  ComplaintStatus,
  DashboardProviderAccountRecord,
  FreeApiCredentialRecord,
  FreeApiCredentialStatus,
  FreeApiUsage,
  ProviderApiUsage,
  ProviderWebhookRecord,
  ProviderWebhookStatus,
  SharedTestMerchantRecord,
  TestPaymentRecord,
  TestPaymentStatus,
  NameAvailabilityResponse,
  NativeNameProofStatus,
  NativeNameRecord,
  NativeNameReviewTier,
  NativeNameStatus,
  PaymentDestinationInput,
  ProviderStatus,
  RegistryAction,
  RegistryEventRecord,
  RegistryEventType,
  WalletProviderRecord,
} from "@universal-payment/protocol";
import { FREE_API_LIMITS, PROVIDER_API_LIMITS } from "@universal-payment/protocol";
import { newId, nowIso, sha256Hex } from "./config.js";
import type { DbExecutor } from "./db/executor.js";
import {
  buildHardReservedSeedSql,
  buildProtectedDictionarySeedSql,
  PROTECTED_REVIEW_HINT,
} from "./protected-dictionary.js";
import { SCHEMA_POSTGRES_SEED_SQL, SCHEMA_POSTGRES_SQL } from "./schema-postgres.js";
import { SCHEMA_SEED_SQL, SCHEMA_SQL } from "./schema.js";

/** Neon TIMESTAMPTZ often arrives as Date; D1 uses strings. Normalize before .slice/Date.parse. */
function asIsoString(value: unknown): string | null {
  if (value == null || value === "") return null;
  if (typeof value === "string") return value;
  if (value instanceof Date && Number.isFinite(value.getTime())) {
    return value.toISOString();
  }
  const parsed = new Date(String(value));
  if (Number.isFinite(parsed.getTime())) {
    return parsed.toISOString();
  }
  return String(value);
}

function dayKey(value: unknown): string | null {
  return asIsoString(value)?.slice(0, 10) ?? null;
}

export type IdentifierRow = {
  id: string;
  type: string;
  normalized_value: string;
  display_value: string;
  controller_id: string;
  name_id: string | null;
  status: string;
  registered_at: string;
  activated_at: string | null;
  last_updated: string;
  last_payment_update: string | null;
  removed_at: string | null;
  available_at: string | null;
  pending_activation_at: string | null;
  pending_destination_json: string | null;
};

export type PaymentDestinationRow = {
  id: string;
  identifier_id: string;
  chain: string;
  asset: string;
  address: string;
  token_contract: string | null;
  network_identifier: string | null;
  memo: string | null;
  payment_reference: string | null;
  minimum_amount: string | null;
  maximum_amount: string | null;
  fixed_amount: string | null;
  expiration: string | null;
  status: string;
  created_at: string;
  updated_at: string;
};

type FreeApiCredentialRow = {
  id: string;
  owner_user_id: string;
  key_hash: string;
  key_prefix: string;
  status: string;
  created_at: string;
  revoked_at: string | null;
  last_used_at: string | null;
  day_started_at: string | null;
  day_count: number;
  minute_started_at: string | null;
  minute_count: number;
};

type DashboardProviderAccountRow = {
  privy_user_id: string;
  provider_id: string;
  key_prefix: string;
  minute_started_at: string | null;
  minute_count: number;
  day_started_at: string | null;
  day_count: number;
  last_used_at: string | null;
  created_at: string;
  updated_at: string;
};

type ProviderWebhookRow = {
  id: string;
  provider_id: string;
  url: string;
  secret_prefix: string;
  secret_hash: string;
  signing_secret: string | null;
  events_json: string;
  status: string;
  created_at: string;
  updated_at: string;
};

type SharedTestMerchantRow = {
  identifier_id: string;
  identifier_value: string;
  controller_id: string;
  wallet_address: string;
  network: string;
  asset: string;
  token_contract: string;
  network_identifier: string;
};

type TestPaymentRow = {
  id: string;
  merchant_identifier_id: string;
  transaction_hash: string;
  network: string;
  asset: string;
  amount: string;
  amount_raw: string;
  sender: string;
  recipient: string;
  timestamp: string;
  confirmation_status: string;
  testnet: boolean | number;
  block_number: number | string | null;
  detected_at: string;
};

function complaintFromRow(row: Record<string, string | null>): ComplaintRecord {
  return {
    id: row.id!,
    identifier_id: row.identifier_id!,
    ...(row.reporter_user_id ? { reporter_user_id: row.reporter_user_id } : {}),
    ...(row.filing_provider_id ? { filing_provider_id: row.filing_provider_id } : {}),
    reason: row.reason!,
    description: row.description!,
    evidence_json: row.evidence_json ?? null,
    status: row.status as ComplaintRecord["status"],
    resolution_action: (row.resolution_action as RegistryAction | null) ?? null,
    resolution_notes: row.resolution_notes ?? null,
    created_at: row.created_at!,
    updated_at: row.updated_at!,
  };
}

export type DashboardApplication = {
  id: string;
  privyUserId: string;
  track: "business" | "provider";
  status: string;
  payload: Record<string, string>;
  submittedAt?: string;
  reviewedAt?: string;
  rejectionReason?: string;
  documentRequest?: Record<string, unknown>;
  documentResponse?: Record<string, unknown>;
  controllerWallet?: string;
};

type DashboardApplicationRow = {
  id: string;
  privy_user_id: string;
  track: "business" | "provider";
  status: string;
  payload_json: string;
  submitted_at: string | null;
  reviewed_at: string | null;
  rejection_reason: string | null;
  document_request_json: string | null;
  document_response_json: string | null;
  controller_wallet: string | null;
};

function parseJsonObject(value: string | null): Record<string, unknown> | undefined {
  if (!value) return undefined;
  try {
    const parsed = JSON.parse(value);
    return parsed && typeof parsed === "object" ? parsed as Record<string, unknown> : undefined;
  } catch {
    return undefined;
  }
}

function dashboardApplicationFromRow(row: DashboardApplicationRow): DashboardApplication {
  let payload: Record<string, string> = {};
  try {
    const parsed = JSON.parse(row.payload_json);
    if (parsed && typeof parsed === "object") payload = parsed as Record<string, string>;
  } catch {
    // Preserve a readable empty payload if legacy data is malformed.
  }
  return {
    id: row.id,
    privyUserId: row.privy_user_id,
    track: row.track,
    status: row.status,
    payload,
    ...(row.submitted_at ? { submittedAt: row.submitted_at } : {}),
    ...(row.reviewed_at ? { reviewedAt: row.reviewed_at } : {}),
    ...(row.rejection_reason ? { rejectionReason: row.rejection_reason } : {}),
    ...(parseJsonObject(row.document_request_json)
      ? { documentRequest: parseJsonObject(row.document_request_json) }
      : {}),
    ...(parseJsonObject(row.document_response_json)
      ? { documentResponse: parseJsonObject(row.document_response_json) }
      : {}),
    ...(row.controller_wallet ? { controllerWallet: row.controller_wallet } : {}),
  };
}

export class RegistryStore {
  constructor(private readonly db: DbExecutor) {}

  async ping(): Promise<void> {
    await this.db.one("SELECT 1 AS ok");
  }

  async migrate(): Promise<void> {
    const schema = this.db.dialect === "postgres" ? SCHEMA_POSTGRES_SQL : SCHEMA_SQL;
    const seed = this.db.dialect === "postgres" ? SCHEMA_POSTGRES_SEED_SQL : SCHEMA_SEED_SQL;
    for (const statement of [schema, seed]) {
      const parts = statement
        .split(";")
        .map((part) => part.trim())
        .filter(Boolean);
      await this.db.execStatements(parts);
    }
    await this.ensureComplaintColumns();
    await this.ensureNativeNameReviewColumns();
    await this.ensureFreeApiColumns();
    await this.ensureWebhookColumns();
    await this.ensureProviderResolvePolicyColumn();
    await this.seedHardReserved();
    await this.seedProtectedDictionary();
  }

  private async ensureProviderResolvePolicyColumn(): Promise<void> {
    const alters =
      this.db.dialect === "postgres"
        ? [
            "ALTER TABLE wallet_providers ADD COLUMN IF NOT EXISTS resolve_policy_json TEXT",
          ]
        : ["ALTER TABLE wallet_providers ADD COLUMN resolve_policy_json TEXT"];
    for (const statement of alters) {
      try {
        await this.db.run(statement);
      } catch {
        // Column already exists (SQLite).
      }
    }
  }

  private async ensureComplaintColumns(): Promise<void> {
    const alters =
      this.db.dialect === "postgres"
        ? [
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS reporter_user_id TEXT",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_action TEXT",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS resolution_notes TEXT",
          ]
        : [
            "ALTER TABLE complaints ADD COLUMN reporter_user_id TEXT",
            "ALTER TABLE complaints ADD COLUMN resolution_action TEXT",
            "ALTER TABLE complaints ADD COLUMN resolution_notes TEXT",
          ];
    for (const statement of alters) {
      try {
        await this.db.run(statement);
      } catch {
        // Column already exists (SQLite).
      }
    }
    await this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_complaints_reporter ON complaints(reporter_user_id, created_at)",
    );
  }

  private async ensureNativeNameReviewColumns(): Promise<void> {
    const alters =
      this.db.dialect === "postgres"
        ? [
            "ALTER TABLE native_names ADD COLUMN IF NOT EXISTS review_tier TEXT",
            "ALTER TABLE native_names ADD COLUMN IF NOT EXISTS dictionary_match TEXT",
            "ALTER TABLE native_names ADD COLUMN IF NOT EXISTS proof_status TEXT",
            "ALTER TABLE native_names ADD COLUMN IF NOT EXISTS review_notes TEXT",
          ]
        : [
            "ALTER TABLE native_names ADD COLUMN review_tier TEXT",
            "ALTER TABLE native_names ADD COLUMN dictionary_match TEXT",
            "ALTER TABLE native_names ADD COLUMN proof_status TEXT",
            "ALTER TABLE native_names ADD COLUMN review_notes TEXT",
          ];
    for (const statement of alters) {
      try {
        await this.db.run(statement);
      } catch {
        // Column already exists (SQLite).
      }
    }
  }

  private async ensureFreeApiColumns(): Promise<void> {
    const alters =
      this.db.dialect === "postgres"
        ? [
            "ALTER TABLE free_api_credentials ADD COLUMN IF NOT EXISTS revoked_at TIMESTAMPTZ",
            "ALTER TABLE free_api_credentials ADD COLUMN IF NOT EXISTS last_used_at TIMESTAMPTZ",
            "ALTER TABLE free_api_credentials ADD COLUMN IF NOT EXISTS day_started_at TIMESTAMPTZ",
            "ALTER TABLE free_api_credentials ADD COLUMN IF NOT EXISTS day_count INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE free_api_credentials ADD COLUMN IF NOT EXISTS minute_started_at TIMESTAMPTZ",
            "ALTER TABLE free_api_credentials ADD COLUMN IF NOT EXISTS minute_count INTEGER NOT NULL DEFAULT 0",
          ]
        : [
            "ALTER TABLE free_api_credentials ADD COLUMN revoked_at TEXT",
            "ALTER TABLE free_api_credentials ADD COLUMN last_used_at TEXT",
            "ALTER TABLE free_api_credentials ADD COLUMN day_started_at TEXT",
            "ALTER TABLE free_api_credentials ADD COLUMN day_count INTEGER NOT NULL DEFAULT 0",
            "ALTER TABLE free_api_credentials ADD COLUMN minute_started_at TEXT",
            "ALTER TABLE free_api_credentials ADD COLUMN minute_count INTEGER NOT NULL DEFAULT 0",
          ];
    for (const statement of alters) {
      try {
        await this.db.run(statement);
      } catch {
        // Column already exists (SQLite).
      }
    }
    await this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_free_api_credentials_key_hash ON free_api_credentials(key_hash, status)",
    );
  }

  private async ensureWebhookColumns(): Promise<void> {
    const alters =
      this.db.dialect === "postgres"
        ? [
            "ALTER TABLE provider_webhooks ADD COLUMN IF NOT EXISTS signing_secret TEXT",
            "ALTER TABLE complaints ADD COLUMN IF NOT EXISTS filing_provider_id TEXT",
          ]
        : [
            "ALTER TABLE provider_webhooks ADD COLUMN signing_secret TEXT",
            "ALTER TABLE complaints ADD COLUMN filing_provider_id TEXT",
          ];
    for (const statement of alters) {
      try {
        await this.db.run(statement);
      } catch {
        // Column already exists (SQLite).
      }
    }
    await this.db.run(
      `CREATE TABLE IF NOT EXISTS provider_webhook_deliveries (
        id TEXT PRIMARY KEY,
        webhook_id TEXT NOT NULL,
        provider_id TEXT NOT NULL,
        event TEXT NOT NULL,
        status TEXT NOT NULL,
        http_status INTEGER,
        error_message TEXT,
        attempted_at TEXT NOT NULL
      )`,
    );
    await this.db.run(
      "CREATE INDEX IF NOT EXISTS idx_provider_webhook_deliveries_webhook ON provider_webhook_deliveries(webhook_id, attempted_at)",
    );
  }

  private async seedHardReserved(): Promise<void> {
    const dialect = this.db.dialect === "postgres" ? "postgres" : "sqlite";
    const seed = buildHardReservedSeedSql(dialect);
    const parts = seed
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    await this.db.execStatements(parts);
  }

  private async seedProtectedDictionary(): Promise<void> {
    const dialect = this.db.dialect === "postgres" ? "postgres" : "sqlite";
    const seed = buildProtectedDictionarySeedSql(dialect);
    const parts = seed
      .split(";")
      .map((part) => part.trim())
      .filter(Boolean);
    await this.db.execStatements(parts);
  }

  async seedDevProvider(apiKey: string): Promise<void> {
    const existing = await this.db.one<{ provider_id: string }>(
      "SELECT provider_id FROM wallet_providers LIMIT 1",
    );
    if (existing) {
      return;
    }

    const timestamp = nowIso();
    const hash = await sha256Hex(apiKey);
    await this.db.run(
      `INSERT INTO wallet_providers (
        provider_id, name, website, status, integration_level,
        api_key_hash, allowed_identifier_types_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      "provider_dev",
      "Development Provider",
      null,
      "APPROVED",
      "RESOLVER_PLUS_MERCHANT_SETUP",
      hash,
      JSON.stringify([]),
      timestamp,
      timestamp,
    );
  }

  async getDevProvider(): Promise<WalletProviderRecord | null> {
    return this.getProviderById("provider_dev");
  }

  async getProviderByApiKeyHash(hash: string): Promise<WalletProviderRecord | null> {
    const row = await this.db.one<Record<string, string>>(
      "SELECT * FROM wallet_providers WHERE api_key_hash = ?",
      hash,
    );
    return row ? this.mapProvider(row) : null;
  }

  async getProviderById(providerId: string): Promise<WalletProviderRecord | null> {
    const row = await this.db.one<Record<string, string>>(
      "SELECT * FROM wallet_providers WHERE provider_id = ?",
      providerId,
    );
    return row ? this.mapProvider(row) : null;
  }

  async listProviders(): Promise<WalletProviderRecord[]> {
    const rows = await this.db.all<Record<string, string | null>>(
      "SELECT * FROM wallet_providers ORDER BY created_at ASC",
    );
    return rows.map((row) => this.mapProvider(row));
  }

  async createProvider(input: {
    providerId: string;
    name: string;
    website?: string;
    integrationLevel: WalletProviderRecord["integration_level"];
    allowedIdentifierTypes: string[];
    resolvePolicy?: WalletProviderRecord["resolve_policy"];
    apiKeyHash: string;
    status?: ProviderStatus;
  }): Promise<WalletProviderRecord> {
    const timestamp = nowIso();
    const status = input.status ?? "APPROVED";
    const policyJson = input.resolvePolicy
      ? JSON.stringify(input.resolvePolicy)
      : null;
    await this.db.run(
      `INSERT INTO wallet_providers (
        provider_id, name, website, status, integration_level,
        api_key_hash, allowed_identifier_types_json, resolve_policy_json,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      input.providerId,
      input.name,
      input.website ?? null,
      status,
      input.integrationLevel,
      input.apiKeyHash,
      JSON.stringify(input.allowedIdentifierTypes),
      policyJson,
      timestamp,
      timestamp,
    );
    return (await this.getProviderById(input.providerId))!;
  }

  async updateProvider(
    providerId: string,
    patch: {
      name?: string;
      website?: string | null;
      status?: ProviderStatus;
      integrationLevel?: WalletProviderRecord["integration_level"];
      allowedIdentifierTypes?: string[];
      resolvePolicy?: WalletProviderRecord["resolve_policy"] | null;
      apiKeyHash?: string;
    },
  ): Promise<WalletProviderRecord | null> {
    const existing = await this.getProviderById(providerId);
    if (!existing) {
      return null;
    }
    const timestamp = nowIso();
    const row = await this.db.one<{ api_key_hash: string; resolve_policy_json?: string | null }>(
      "SELECT api_key_hash, resolve_policy_json FROM wallet_providers WHERE provider_id = ?",
      providerId,
    );
    let policyJson: string | null =
      row?.resolve_policy_json === undefined
        ? existing.resolve_policy
          ? JSON.stringify(existing.resolve_policy)
          : null
        : (row.resolve_policy_json ?? null);
    if (patch.resolvePolicy !== undefined) {
      policyJson =
        patch.resolvePolicy === null
          ? null
          : JSON.stringify(patch.resolvePolicy);
    }
    await this.db.run(
      `UPDATE wallet_providers
       SET name = ?, website = ?, status = ?, integration_level = ?,
           allowed_identifier_types_json = ?, resolve_policy_json = ?,
           api_key_hash = ?, updated_at = ?
       WHERE provider_id = ?`,
      patch.name ?? existing.name,
      patch.website === undefined ? (existing.website ?? null) : patch.website,
      patch.status ?? existing.status,
      patch.integrationLevel ?? existing.integration_level,
      JSON.stringify(patch.allowedIdentifierTypes ?? existing.allowed_identifier_types),
      policyJson,
      patch.apiKeyHash ?? row!.api_key_hash,
      timestamp,
      providerId,
    );
    return this.getProviderById(providerId);
  }

  private mapProvider(row: Record<string, string | null>): WalletProviderRecord {
    let resolvePolicy: WalletProviderRecord["resolve_policy"];
    if (row.resolve_policy_json) {
      try {
        resolvePolicy = JSON.parse(row.resolve_policy_json) as WalletProviderRecord["resolve_policy"];
      } catch {
        resolvePolicy = undefined;
      }
    }
    return {
      provider_id: row.provider_id!,
      name: row.name!,
      website: row.website ?? undefined,
      status: row.status as WalletProviderRecord["status"],
      integration_level: row.integration_level as WalletProviderRecord["integration_level"],
      allowed_identifier_types: JSON.parse(row.allowed_identifier_types_json!) as string[],
      ...(resolvePolicy ? { resolve_policy: resolvePolicy } : {}),
      created_at: row.created_at!,
      updated_at: row.updated_at!,
    };
  }

  async ensureController(walletAddress: string): Promise<string> {
    const normalized = walletAddress.toLowerCase();
    const existing = await this.db.one<{ controller_id: string }>(
      "SELECT controller_id FROM controllers WHERE wallet_address = ?",
      normalized,
    );
    if (existing) {
      return existing.controller_id;
    }

    const controllerId = newId("controller");
    await this.db.run(
      "INSERT INTO controllers (controller_id, wallet_address, created_at) VALUES (?, ?, ?)",
      controllerId,
      normalized,
      nowIso(),
    );
    return controllerId;
  }

  async getSharedTestMerchant(): Promise<SharedTestMerchantRecord | null> {
    const row = await this.db.one<SharedTestMerchantRow>(
      "SELECT identifier_id, identifier_value, controller_id, wallet_address, network, asset, token_contract, network_identifier FROM shared_test_merchant WHERE id = 1",
    );
    if (!row) return null;
    return {
      identifier_id: row.identifier_id,
      identifier_value: row.identifier_value,
      controller_id: row.controller_id,
      wallet_address: row.wallet_address,
      network: row.network as "base-sepolia",
      asset: row.asset as "USDC",
      token_contract: row.token_contract,
      network_identifier: row.network_identifier as "eip155:84532",
    };
  }

  async ensureSharedTestMerchant(input: {
    walletAddress: string;
    identifierValue: string;
    tokenContract: string;
  }): Promise<SharedTestMerchantRecord> {
    const existing = await this.getSharedTestMerchant();
    if (existing) return existing;
    const walletAddress = input.walletAddress.trim().toLowerCase();
    if (!/^0x[a-f0-9]{40}$/i.test(walletAddress)) {
      throw new Error("TEST_MERCHANT_WALLET must be a valid EVM address.");
    }
    if (!/^0x[a-f0-9]{40}$/i.test(input.tokenContract.trim())) {
      throw new Error("TEST_MERCHANT_USDC_CONTRACT must be a valid EVM address.");
    }
    const identifierValue = input.identifierValue.trim();
    const normalizedValue = identifierValue.toLowerCase();
    const controllerId = await this.ensureController(walletAddress);
    let identifier = await this.getIdentifierByTypeValue("custom", normalizedValue);
    const paymentOptions: PaymentDestinationInput[] = [
      {
        chain: "base",
        asset: "USDC",
        address: walletAddress,
        token_contract: input.tokenContract,
        network_identifier: "eip155:84532",
      },
    ];
    if (!identifier) {
      identifier = await this.createIdentifier({
        type: "custom",
        normalizedValue,
        displayValue: identifierValue,
        controllerId,
        nameId: null,
        pendingActivationAt: nowIso(),
        paymentOptions,
      });
      await this.activateIdentifier(identifier.id, nowIso());
      identifier = (await this.getIdentifierById(identifier.id))!;
    } else {
      const updatedAt = nowIso();
      await this.db.run(
        `UPDATE identifiers
         SET controller_id = ?, status = 'active', activated_at = ?,
             pending_activation_at = NULL, last_updated = ?
         WHERE id = ?`,
        controllerId,
        updatedAt,
        updatedAt,
        identifier.id,
      );
      await this.replaceActiveDestinations(identifier.id, paymentOptions, updatedAt);
      identifier = (await this.getIdentifierById(identifier.id))!;
    }
    const createdAt = nowIso();
    await this.db.run(
      this.db.dialect === "postgres"
        ? `INSERT INTO shared_test_merchant (
            id, identifier_id, identifier_value, controller_id, wallet_address,
            network, asset, token_contract, network_identifier, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?) ON CONFLICT (id) DO NOTHING`
        : `INSERT OR IGNORE INTO shared_test_merchant (
            id, identifier_id, identifier_value, controller_id, wallet_address,
            network, asset, token_contract, network_identifier, created_at
          ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      1,
      identifier.id,
      identifierValue,
      controllerId,
      walletAddress,
      "base-sepolia",
      "USDC",
      input.tokenContract,
      "eip155:84532",
      createdAt,
    );
    return (await this.getSharedTestMerchant())!;
  }

  private mapTestPayment(row: TestPaymentRow): TestPaymentRecord {
    return {
      id: row.id,
      merchant_identifier_id: row.merchant_identifier_id,
      transaction_hash: row.transaction_hash,
      network: row.network,
      asset: row.asset,
      amount: row.amount,
      amount_raw: row.amount_raw,
      sender: row.sender,
      recipient: row.recipient,
      timestamp: row.timestamp,
      confirmation_status: row.confirmation_status as TestPaymentStatus,
      testnet: Boolean(row.testnet),
      block_number: row.block_number === null ? null : Number(row.block_number),
      detected_at: row.detected_at,
    };
  }

  async getTestPaymentByHash(
    transactionHash: string,
  ): Promise<TestPaymentRecord | null> {
    const row = await this.db.one<TestPaymentRow>(
      "SELECT * FROM test_payments WHERE transaction_hash = ?",
      transactionHash,
    );
    return row ? this.mapTestPayment(row) : null;
  }

  async createTestPayment(input: Omit<TestPaymentRecord, "id" | "detected_at">): Promise<TestPaymentRecord> {
    const existing = await this.getTestPaymentByHash(input.transaction_hash);
    if (existing) return existing;
    const detectedAt = nowIso();
    await this.db.run(
      `INSERT INTO test_payments (
        id, merchant_identifier_id, transaction_hash, network, asset, amount,
        amount_raw, sender, recipient, timestamp, confirmation_status, testnet,
        block_number, detected_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      newId("payment"),
      input.merchant_identifier_id,
      input.transaction_hash,
      input.network,
      input.asset,
      input.amount,
      input.amount_raw,
      input.sender,
      input.recipient,
      input.timestamp,
      input.confirmation_status,
      input.testnet ? 1 : 0,
      input.block_number,
      detectedAt,
    );
    return (await this.getTestPaymentByHash(input.transaction_hash))!;
  }

  async listTestPayments(limit = 50): Promise<TestPaymentRecord[]> {
    const rows = await this.db.all<TestPaymentRow>(
      "SELECT * FROM test_payments ORDER BY detected_at DESC LIMIT ?",
      Math.min(Math.max(limit, 1), 100),
    );
    return rows.map((row) => this.mapTestPayment(row));
  }

  async getMaxTestPaymentBlock(): Promise<number | null> {
    const row = await this.db.one<{ max_block: number | string | null }>(
      "SELECT MAX(block_number) AS max_block FROM test_payments",
    );
    if (row?.max_block === null || row?.max_block === undefined) return null;
    const value = Number(row.max_block);
    return Number.isFinite(value) ? value : null;
  }

  private mapFreeApiCredential(
    row: FreeApiCredentialRow,
  ): FreeApiCredentialRecord {
    return {
      id: row.id,
      owner_user_id: row.owner_user_id,
      key_prefix: row.key_prefix,
      status: row.status as FreeApiCredentialStatus,
      created_at: asIsoString(row.created_at) ?? String(row.created_at),
      revoked_at: asIsoString(row.revoked_at),
      last_used_at: asIsoString(row.last_used_at),
      day_started_at: asIsoString(row.day_started_at),
      day_count: Number(row.day_count ?? 0),
      minute_started_at: asIsoString(row.minute_started_at),
      minute_count: Number(row.minute_count ?? 0),
    };
  }

  async getFreeApiCredentialByOwner(
    ownerUserId: string,
  ): Promise<FreeApiCredentialRecord | null> {
    const row = await this.db.one<FreeApiCredentialRow>(
      "SELECT * FROM free_api_credentials WHERE owner_user_id = ? ORDER BY created_at DESC LIMIT 1",
      ownerUserId,
    );
    return row ? this.mapFreeApiCredential(row) : null;
  }

  async getFreeApiCredentialByKeyHash(
    keyHash: string,
  ): Promise<FreeApiCredentialRecord | null> {
    const row = await this.db.one<FreeApiCredentialRow>(
      "SELECT * FROM free_api_credentials WHERE key_hash = ?",
      keyHash,
    );
    return row ? this.mapFreeApiCredential(row) : null;
  }

  async createFreeApiCredential(input: {
    id: string;
    ownerUserId: string;
    keyHash: string;
    keyPrefix: string;
  }): Promise<FreeApiCredentialRecord> {
    const createdAt = nowIso();
    const existing = await this.getFreeApiCredentialByOwner(input.ownerUserId);
    if (existing?.status === "REVOKED") {
      await this.db.run(
        `UPDATE free_api_credentials
         SET id = ?, key_hash = ?, key_prefix = ?, status = 'ACTIVE',
             created_at = ?, revoked_at = NULL, last_used_at = NULL,
             day_started_at = NULL, day_count = 0, minute_started_at = NULL,
             minute_count = 0
         WHERE owner_user_id = ?`,
        input.id,
        input.keyHash,
        input.keyPrefix,
        createdAt,
        input.ownerUserId,
      );
      return (await this.getFreeApiCredentialByOwner(input.ownerUserId))!;
    }
    await this.db.run(
      `INSERT INTO free_api_credentials (
        id, owner_user_id, key_hash, key_prefix, status, created_at,
        revoked_at, last_used_at, day_started_at, day_count,
        minute_started_at, minute_count
      ) VALUES (?, ?, ?, ?, 'ACTIVE', ?, NULL, NULL, NULL, 0, NULL, 0)`,
      input.id,
      input.ownerUserId,
      input.keyHash,
      input.keyPrefix,
      createdAt,
    );
    return (await this.getFreeApiCredentialByOwner(input.ownerUserId))!;
  }

  async revokeFreeApiCredential(
    ownerUserId: string,
  ): Promise<FreeApiCredentialRecord | null> {
    const existing = await this.getFreeApiCredentialByOwner(ownerUserId);
    if (!existing || existing.status === "REVOKED") {
      return existing;
    }
    const revokedAt = nowIso();
    await this.db.run(
      "UPDATE free_api_credentials SET status = 'REVOKED', revoked_at = ? WHERE owner_user_id = ?",
      revokedAt,
      ownerUserId,
    );
    return this.getFreeApiCredentialByOwner(ownerUserId);
  }

  async recordFreeApiUsage(
    credentialId: string,
    timestamp = nowIso(),
  ): Promise<{
    allowed: boolean;
    credential: FreeApiCredentialRecord;
    usage: FreeApiUsage;
    retry_after_seconds?: number;
  } | null> {
    const existingRow = await this.db.one<FreeApiCredentialRow>(
      "SELECT * FROM free_api_credentials WHERE id = ?",
      credentialId,
    );
    if (!existingRow) return null;
    const existing = this.mapFreeApiCredential(existingRow);
    const now = Date.parse(timestamp);
    const minuteStartedAt = existing.minute_started_at;
    const minuteStarted =
      minuteStartedAt &&
      Number.isFinite(Date.parse(minuteStartedAt)) &&
      now - Date.parse(minuteStartedAt) < 60_000
        ? minuteStartedAt
        : timestamp;
    const minuteCount =
      minuteStarted === minuteStartedAt ? existing.minute_count : 0;
    const dayStarted =
      dayKey(existing.day_started_at) === dayKey(timestamp)
        ? (existing.day_started_at ?? timestamp)
        : timestamp;
    const dayCount =
      dayStarted === existing.day_started_at ? existing.day_count : 0;
    const minuteReset = new Date(Date.parse(minuteStarted) + 60_000).toISOString();
    const dayReset = new Date(
      Date.parse(`${dayKey(timestamp)}T00:00:00.000Z`) + 86_400_000,
    ).toISOString();
    const usage: FreeApiUsage = {
      requests_per_minute: FREE_API_LIMITS.requests_per_minute,
      requests_per_day: FREE_API_LIMITS.requests_per_day,
      minute_count: minuteCount,
      day_count: dayCount,
      minute_reset_at: minuteReset,
      day_reset_at: dayReset,
    };
    if (
      existing.status !== "ACTIVE" ||
      minuteCount >= FREE_API_LIMITS.requests_per_minute ||
      dayCount >= FREE_API_LIMITS.requests_per_day
    ) {
      return {
        allowed: false,
        credential: existing,
        usage,
        retry_after_seconds:
          minuteCount >= FREE_API_LIMITS.requests_per_minute
            ? Math.max(1, Math.ceil((Date.parse(minuteReset) - now) / 1000))
            : Math.max(1, Math.ceil((Date.parse(dayReset) - now) / 1000)),
      };
    }

    await this.db.run(
      `UPDATE free_api_credentials
       SET last_used_at = ?, day_started_at = ?, day_count = ?,
           minute_started_at = ?, minute_count = ?
       WHERE id = ? AND status = 'ACTIVE'`,
      timestamp,
      dayStarted,
      dayCount + 1,
      minuteStarted,
      minuteCount + 1,
      credentialId,
    );
    const updated = (await this.getFreeApiCredentialByOwner(existing.owner_user_id))!;
    return {
      allowed: true,
      credential: updated,
      usage: {
        ...usage,
        minute_count: minuteCount + 1,
        day_count: dayCount + 1,
      },
    };
  }

  async getControllerWallet(controllerId: string): Promise<string | null> {
    const row = await this.db.one<{ wallet_address: string }>(
      "SELECT wallet_address FROM controllers WHERE controller_id = ?",
      controllerId,
    );
    return row?.wallet_address ?? null;
  }

  async isNameReserved(name: string): Promise<boolean> {
    const row = await this.db.one("SELECT name FROM reserved_names WHERE name = ?", name);
    return Boolean(row);
  }

  async getProtectedDictionaryMatch(
    name: string,
  ): Promise<{ name: string; category: string; note: string | null } | null> {
    const row = await this.db.one<{ name: string; category: string; note: string | null }>(
      "SELECT name, category, note FROM protected_name_dictionary WHERE name = ?",
      name,
    );
    return row ?? null;
  }

  async getNameAvailability(name: string): Promise<NameAvailabilityResponse> {
    if (await this.isNameReserved(name)) {
      return {
        available: false,
        name,
        reserved: true,
        review_required: false,
      };
    }

    const held = await this.db.one(
      "SELECT id FROM native_names WHERE name = ? AND status IN ('active', 'pending_review')",
      name,
    );
    if (held) {
      return { available: false, name };
    }

    const protectedMatch = await this.getProtectedDictionaryMatch(name);
    if (protectedMatch) {
      return {
        available: true,
        name,
        review_required: true,
        review_tier: "protected",
        review_hint: PROTECTED_REVIEW_HINT,
      };
    }

    return {
      available: true,
      name,
      review_required: false,
      review_tier: "standard",
    };
  }

  async createNativeName(name: string, controllerId: string): Promise<NativeNameRecord> {
    const timestamp = nowIso();
    const protectedMatch = await this.getProtectedDictionaryMatch(name);
    const reviewTier: NativeNameReviewTier = protectedMatch ? "protected" : "standard";
    const status: NativeNameStatus = protectedMatch ? "pending_review" : "active";
    const proofStatus: NativeNameProofStatus = protectedMatch
      ? "requested"
      : "not_required";

    const record: NativeNameRecord = {
      id: newId("name"),
      name,
      controller_id: controllerId,
      status,
      review_tier: reviewTier,
      dictionary_match: protectedMatch?.name ?? null,
      proof_status: proofStatus,
      review_notes: protectedMatch
        ? "Protected dictionary match. Operator may request ownership proof by email before activation."
        : null,
      created_at: timestamp,
      updated_at: timestamp,
    };
    await this.db.run(
      `INSERT INTO native_names (
        id, name, controller_id, status, review_tier, dictionary_match,
        proof_status, review_notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.name,
      record.controller_id,
      record.status,
      record.review_tier,
      record.dictionary_match,
      record.proof_status,
      record.review_notes,
      record.created_at,
      record.updated_at,
    );
    return record;
  }

  private mapNativeNameRow(row: Record<string, string | null>): NativeNameRecord {
    return {
      id: row.id!,
      name: row.name!,
      controller_id: row.controller_id!,
      status: (row.status as NativeNameStatus) ?? "active",
      review_tier: (row.review_tier as NativeNameReviewTier) || "standard",
      dictionary_match: row.dictionary_match ?? null,
      proof_status: (row.proof_status as NativeNameProofStatus) || "not_required",
      review_notes: row.review_notes ?? null,
      created_at: row.created_at!,
      updated_at: row.updated_at!,
    };
  }

  async getNativeNameById(id: string): Promise<NativeNameRecord | null> {
    const row = await this.db.one<Record<string, string | null>>(
      "SELECT * FROM native_names WHERE id = ?",
      id,
    );
    if (!row) {
      return null;
    }
    return this.mapNativeNameRow(row);
  }

  async getNativeNameLabel(id: string): Promise<string | undefined> {
    const row = await this.getNativeNameById(id);
    return row?.name;
  }

  async updateNativeName(
    id: string,
    controllerId: string,
    patch: {
      status?: NativeNameStatus;
      proof_status?: NativeNameProofStatus;
      review_notes?: string | null;
    },
  ): Promise<NativeNameRecord | null> {
    const existing = await this.getNativeNameById(id);
    if (!existing || existing.controller_id !== controllerId) {
      return null;
    }
    const updatedAt = nowIso();
    const status = patch.status ?? existing.status;
    const proofStatus = patch.proof_status ?? existing.proof_status;
    const reviewNotes =
      patch.review_notes !== undefined ? patch.review_notes : existing.review_notes;
    await this.db.run(
      `UPDATE native_names
       SET status = ?, proof_status = ?, review_notes = ?, updated_at = ?
       WHERE id = ?`,
      status,
      proofStatus,
      reviewNotes,
      updatedAt,
      id,
    );
    return {
      ...existing,
      status,
      proof_status: proofStatus,
      review_notes: reviewNotes,
      updated_at: updatedAt,
    };
  }

  async getIdentifierByTypeValue(
    type: string,
    normalizedValue: string,
  ): Promise<IdentifierRow | null> {
    return this.db.one<IdentifierRow>(
      "SELECT * FROM identifiers WHERE type = ? AND normalized_value = ?",
      type,
      normalizedValue,
    );
  }

  async getIdentifierById(id: string): Promise<IdentifierRow | null> {
    return this.db.one<IdentifierRow>("SELECT * FROM identifiers WHERE id = ?", id);
  }

  async createIdentifier(input: {
    type: string;
    normalizedValue: string;
    displayValue: string;
    controllerId: string;
    nameId: string | null;
    pendingActivationAt: string;
    paymentOptions: PaymentDestinationInput[];
  }): Promise<IdentifierRow> {
    const timestamp = nowIso();
    const id = newId("id");
    await this.db.run(
      `INSERT INTO identifiers (
        id, type, normalized_value, display_value, controller_id, name_id,
        status, registered_at, activated_at, last_updated, last_payment_update,
        removed_at, available_at, pending_activation_at, pending_destination_json
      ) VALUES (?, ?, ?, ?, ?, ?, 'pending', ?, NULL, ?, NULL, NULL, NULL, ?, NULL)`,
      id,
      input.type,
      input.normalizedValue,
      input.displayValue,
      input.controllerId,
      input.nameId,
      timestamp,
      timestamp,
      input.pendingActivationAt,
    );

    await this.replaceActiveDestinations(id, input.paymentOptions, timestamp);
    await this.recordEvent({
      eventType: "registered",
      identifierId: id,
      nameId: input.nameId,
      authorizationReference: input.controllerId,
    });

    return (await this.getIdentifierById(id))!;
  }

  async replaceActiveDestinations(
    identifierId: string,
    options: PaymentDestinationInput[],
    timestamp: string,
  ): Promise<void> {
    await this.db.run(
      "UPDATE payment_destinations SET status = 'inactive', updated_at = ? WHERE identifier_id = ? AND status = 'active'",
      timestamp,
      identifierId,
    );

    for (const option of options) {
      await this.db.run(
        `INSERT INTO payment_destinations (
          id, identifier_id, chain, asset, address, token_contract,
          network_identifier, memo, payment_reference, minimum_amount,
          maximum_amount, fixed_amount, expiration, status, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 'active', ?, ?)`,
        newId("dest"),
        identifierId,
        option.chain,
        option.asset,
        option.address,
        option.token_contract ?? null,
        option.network_identifier ?? null,
        option.memo ?? null,
        option.payment_reference ?? null,
        option.minimum_amount ?? null,
        option.maximum_amount ?? null,
        option.fixed_amount ?? null,
        option.expiration ?? null,
        timestamp,
        timestamp,
      );
    }
  }

  async activateIdentifier(id: string, activatedAt: string): Promise<void> {
    await this.db.run(
      `UPDATE identifiers
       SET status = 'active', activated_at = ?, pending_activation_at = NULL,
           last_updated = ?
       WHERE id = ? AND status = 'pending'`,
      activatedAt,
      activatedAt,
      id,
    );
    await this.recordEvent({ eventType: "activated", identifierId: id });
  }

  async setUpdatePending(
    id: string,
    pendingActivationAt: string,
    pendingOptions: PaymentDestinationInput[],
    lastPaymentUpdate: string,
  ): Promise<void> {
    await this.db.run(
      `UPDATE identifiers
       SET status = 'update_pending', pending_activation_at = ?,
           pending_destination_json = ?, last_payment_update = ?, last_updated = ?
       WHERE id = ?`,
      pendingActivationAt,
      JSON.stringify(pendingOptions),
      lastPaymentUpdate,
      lastPaymentUpdate,
      id,
    );
    await this.recordEvent({
      eventType: "payment_destination_changed",
      identifierId: id,
    });
  }

  async commitPendingDestination(id: string, activatedAt: string): Promise<void> {
    const identifier = await this.getIdentifierById(id);
    if (!identifier?.pending_destination_json) {
      return;
    }
    const pending = JSON.parse(
      identifier.pending_destination_json,
    ) as PaymentDestinationInput[];
    await this.replaceActiveDestinations(id, pending, activatedAt);
    await this.db.run(
      `UPDATE identifiers
       SET status = 'active', pending_activation_at = NULL,
           pending_destination_json = NULL, last_updated = ?
       WHERE id = ?`,
      activatedAt,
      id,
    );
    await this.recordEvent({
      eventType: "activated",
      identifierId: id,
      metadata: { kind: "destination_update" },
    });
  }

  async updateIdentifierMetadata(
    id: string,
    patch: { nameId?: string | null },
  ): Promise<void> {
    const timestamp = nowIso();
    if (patch.nameId !== undefined) {
      await this.db.run(
        "UPDATE identifiers SET name_id = ?, last_updated = ? WHERE id = ?",
        patch.nameId,
        timestamp,
        id,
      );
    }
    await this.recordEvent({ eventType: "metadata_updated", identifierId: id });
  }

  async removeIdentifier(
    id: string,
    removedAt: string,
    availableAt: string | null,
  ): Promise<void> {
    await this.db.run(
      `UPDATE identifiers
       SET status = 'removed', removed_at = ?, available_at = ?,
           last_updated = ?, pending_activation_at = NULL,
           pending_destination_json = NULL
       WHERE id = ?`,
      removedAt,
      availableAt,
      removedAt,
      id,
    );
    await this.db.run(
      "UPDATE payment_destinations SET status = 'inactive', updated_at = ? WHERE identifier_id = ?",
      removedAt,
      id,
    );
    await this.recordEvent({ eventType: "removed", identifierId: id });
  }

  async suspendIdentifier(id: string, authorizationReference: string): Promise<void> {
    const timestamp = nowIso();
    await this.db.run(
      `UPDATE identifiers
       SET status = 'suspended', last_updated = ?, pending_activation_at = NULL,
           pending_destination_json = NULL
       WHERE id = ? AND status NOT IN ('removed', 'revoked')`,
      timestamp,
      id,
    );
    await this.recordEvent({
      eventType: "suspended",
      identifierId: id,
      authorizationReference,
    });
  }

  async reinstateIdentifier(id: string, authorizationReference: string): Promise<void> {
    const timestamp = nowIso();
    await this.db.run(
      `UPDATE identifiers
       SET status = 'active', last_updated = ?
       WHERE id = ? AND status = 'suspended'`,
      timestamp,
      id,
    );
    await this.recordEvent({
      eventType: "reinstated",
      identifierId: id,
      authorizationReference,
    });
  }

  async revokeIdentifier(id: string, authorizationReference: string): Promise<void> {
    const timestamp = nowIso();
    await this.db.run(
      `UPDATE identifiers
       SET status = 'revoked', removed_at = ?, available_at = NULL,
           last_updated = ?, pending_activation_at = NULL,
           pending_destination_json = NULL
       WHERE id = ?`,
      timestamp,
      timestamp,
      id,
    );
    await this.db.run(
      "UPDATE payment_destinations SET status = 'inactive', updated_at = ? WHERE identifier_id = ?",
      timestamp,
      id,
    );
    await this.recordEvent({
      eventType: "revoked",
      identifierId: id,
      authorizationReference,
    });
  }

  async reclaimIdentifier(
    id: string,
    newControllerId: string,
    authorizationReference: string,
    pendingActivationAt: string,
  ): Promise<void> {
    const identifier = await this.getIdentifierById(id);
    if (!identifier) {
      return;
    }
    const timestamp = nowIso();
    // Ownership transfers immediately; payment readiness waits for safety period.
    await this.db.run(
      `UPDATE identifiers
       SET controller_id = ?, status = 'pending', last_updated = ?,
           pending_activation_at = ?, pending_destination_json = NULL,
           activated_at = NULL
       WHERE id = ?`,
      newControllerId,
      timestamp,
      pendingActivationAt,
      id,
    );
    await this.db.run(
      "UPDATE payment_destinations SET status = 'inactive', updated_at = ? WHERE identifier_id = ?",
      timestamp,
      id,
    );
    await this.recordEvent({
      eventType: "reclaimed",
      identifierId: id,
      authorizationReference,
      metadata: {
        previous_controller_id: identifier.controller_id,
        new_controller_id: newControllerId,
        pending_activation_at: pendingActivationAt,
      },
    });
  }

  async listActiveWarnings(identifierId: string): Promise<string[]> {
    const rows = await this.db.all<{ metadata_json: string | null }>(
      `SELECT metadata_json FROM registry_events
       WHERE identifier_id = ? AND event_type = 'metadata_updated'
       ORDER BY timestamp DESC LIMIT 20`,
      identifierId,
    );
    const warnings: string[] = [];
    for (const row of rows) {
      if (!row.metadata_json) {
        continue;
      }
      try {
        const meta = JSON.parse(row.metadata_json) as {
          kind?: string;
          notes?: string | null;
        };
        if (meta.kind === "warning") {
          warnings.push(meta.notes?.trim() || "complaint_warning");
        }
      } catch {
        // ignore malformed metadata
      }
    }
    return [...new Set(warnings)].slice(0, 5);
  }

  async purgeRemovedIdentifier(id: string): Promise<void> {
    await this.db.run("DELETE FROM payment_destinations WHERE identifier_id = ?", id);
    // Retain registry events and complaints for audit and incident history.
    await this.db.run("DELETE FROM identifiers WHERE id = ?", id);
  }

  async listActiveDestinations(identifierId: string): Promise<PaymentDestinationRow[]> {
    return this.db.all<PaymentDestinationRow>(
      "SELECT * FROM payment_destinations WHERE identifier_id = ? AND status = 'active' ORDER BY created_at ASC",
      identifierId,
    );
  }

  async listDestinationsAsInput(
    identifierId: string,
  ): Promise<PaymentDestinationInput[]> {
    const rows = await this.listActiveDestinations(identifierId);
    return rows.map((row) => ({
      chain: row.chain,
      asset: row.asset,
      address: row.address,
      ...(row.token_contract ? { token_contract: row.token_contract } : {}),
      ...(row.network_identifier
        ? { network_identifier: row.network_identifier }
        : {}),
      ...(row.memo ? { memo: row.memo } : {}),
      ...(row.payment_reference ? { payment_reference: row.payment_reference } : {}),
      ...(row.minimum_amount ? { minimum_amount: row.minimum_amount } : {}),
      ...(row.maximum_amount ? { maximum_amount: row.maximum_amount } : {}),
      ...(row.fixed_amount ? { fixed_amount: row.fixed_amount } : {}),
      ...(row.expiration ? { expiration: row.expiration } : {}),
    }));
  }

  async recordEvent(input: {
    eventType: RegistryEventType;
    identifierId?: string | null;
    nameId?: string | null;
    authorizationReference?: string | null;
    metadata?: Record<string, unknown>;
  }): Promise<void> {
    await this.db.run(
      `INSERT INTO registry_events (
        id, event_type, identifier_id, name_id, timestamp,
        authorization_reference, metadata_json
      ) VALUES (?, ?, ?, ?, ?, ?, ?)`,
      newId("event"),
      input.eventType,
      input.identifierId ?? null,
      input.nameId ?? null,
      nowIso(),
      input.authorizationReference ?? null,
      input.metadata ? JSON.stringify(input.metadata) : null,
    );
  }

  async listEvents(identifierId: string): Promise<RegistryEventRecord[]> {
    const rows = await this.db.all<Record<string, string | null>>(
      "SELECT * FROM registry_events WHERE identifier_id = ? ORDER BY timestamp ASC",
      identifierId,
    );
    return rows.map((row) => ({
      id: row.id!,
      event_type: row.event_type as RegistryEventType,
      identifier_id: row.identifier_id ?? null,
      name_id: row.name_id ?? null,
      timestamp: row.timestamp!,
      authorization_reference: row.authorization_reference ?? null,
      metadata_json: row.metadata_json ?? null,
    }));
  }

  async createComplaint(input: {
    identifierId: string;
    reporterUserId?: string | null;
    filingProviderId?: string | null;
    reason: string;
    description: string;
    evidence: string[];
  }): Promise<ComplaintRecord> {
    const timestamp = nowIso();
    const record: ComplaintRecord = {
      id: newId("complaint"),
      identifier_id: input.identifierId,
      ...(input.reporterUserId ? { reporter_user_id: input.reporterUserId } : {}),
      ...(input.filingProviderId ? { filing_provider_id: input.filingProviderId } : {}),
      reason: input.reason,
      description: input.description,
      evidence_json: input.evidence.length ? JSON.stringify(input.evidence) : null,
      status: "SUBMITTED",
      created_at: timestamp,
      updated_at: timestamp,
    };
    await this.db.run(
      `INSERT INTO complaints (
        id, identifier_id, reporter_user_id, filing_provider_id, reason, description, evidence_json, status, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      record.id,
      record.identifier_id,
      record.reporter_user_id ?? null,
      record.filing_provider_id ?? null,
      record.reason,
      record.description,
      record.evidence_json,
      record.status,
      record.created_at,
      record.updated_at,
    );
    await this.recordEvent({
      eventType: "complaint_submitted",
      identifierId: input.identifierId,
    });
    return record;
  }

  async getComplaint(id: string): Promise<ComplaintRecord | null> {
    const row = await this.db.one<Record<string, string | null>>(
      "SELECT * FROM complaints WHERE id = ?",
      id,
    );
    if (!row) {
      return null;
    }
    return complaintFromRow(row);
  }

  async listComplaintsForReporter(reporterUserId: string, limit = 100): Promise<ComplaintRecord[]> {
    const rows = await this.db.all<Record<string, string | null>>(
      "SELECT * FROM complaints WHERE reporter_user_id = ? ORDER BY created_at DESC LIMIT ?",
      reporterUserId,
      limit,
    );
    return rows.map(complaintFromRow);
  }

  async resolveComplaint(
    id: string,
    input: {
      status: ComplaintStatus;
      action: RegistryAction;
      notes?: string;
    },
  ): Promise<ComplaintRecord | null> {
    const existing = await this.getComplaint(id);
    if (!existing) {
      return null;
    }
    const timestamp = nowIso();
    await this.db.run(
      `UPDATE complaints
       SET status = ?, resolution_action = ?, resolution_notes = ?, updated_at = ?
       WHERE id = ?`,
      input.status,
      input.action,
      input.notes ?? null,
      timestamp,
      id,
    );
    return this.getComplaint(id);
  }

  async listNamesByControllerWallet(wallet: string): Promise<NativeNameRecord[]> {
    const rows = await this.db.all<Record<string, string | null>>(
      `SELECT n.* FROM native_names n
       INNER JOIN controllers c ON n.controller_id = c.controller_id
       WHERE LOWER(c.wallet_address) = LOWER(?)
         AND n.status != 'removed'
       ORDER BY n.updated_at DESC`,
      wallet,
    );
    return rows.map((row) => this.mapNativeNameRow(row));
  }

  async listIdentifiersByControllerWallet(wallet: string): Promise<IdentifierRow[]> {
    return this.db.all<IdentifierRow>(
      `SELECT i.* FROM identifiers i
       INNER JOIN controllers c ON i.controller_id = c.controller_id
       WHERE LOWER(c.wallet_address) = LOWER(?)
         AND i.status NOT IN ('removed', 'revoked')
       ORDER BY i.last_updated DESC`,
      wallet,
    );
  }

  async listIdentifiersForOperator(limit = 200): Promise<
    Array<
      IdentifierRow & {
        controller_wallet: string | null;
        destination_count: number;
      }
    >
  > {
    return this.db.all(
      `SELECT i.*, c.wallet_address AS controller_wallet,
        (SELECT COUNT(*) FROM payment_destinations d WHERE d.identifier_id = i.id AND d.status = 'active') AS destination_count
       FROM identifiers i
       LEFT JOIN controllers c ON i.controller_id = c.controller_id
       ORDER BY i.last_updated DESC
       LIMIT ?`,
      limit,
    );
  }

  async listNamesForOperator(filter?: {
    status?: NativeNameStatus;
    limit?: number;
  }): Promise<Array<NativeNameRecord & { controller_wallet: string | null }>> {
    const limit = filter?.limit ?? 200;
    if (filter?.status) {
      const rows = await this.db.all<Record<string, string | null>>(
        `SELECT n.*, c.wallet_address AS controller_wallet
         FROM native_names n
         LEFT JOIN controllers c ON n.controller_id = c.controller_id
         WHERE n.status = ?
         ORDER BY n.updated_at DESC
         LIMIT ?`,
        filter.status,
        limit,
      );
      return rows.map((row) => ({
        ...this.mapNativeNameRow(row),
        controller_wallet: row.controller_wallet ?? null,
      }));
    }
    const rows = await this.db.all<Record<string, string | null>>(
      `SELECT n.*, c.wallet_address AS controller_wallet
       FROM native_names n
       LEFT JOIN controllers c ON n.controller_id = c.controller_id
       ORDER BY n.updated_at DESC
       LIMIT ?`,
      limit,
    );
    return rows.map((row) => ({
      ...this.mapNativeNameRow(row),
      controller_wallet: row.controller_wallet ?? null,
    }));
  }

  async listComplaintsForOperator(limit = 200): Promise<ComplaintRecord[]> {
    const rows = await this.db.all<Record<string, string | null>>(
      "SELECT * FROM complaints ORDER BY created_at DESC LIMIT ?",
      limit,
    );
    return rows.map((row) => ({
      id: row.id!,
      identifier_id: row.identifier_id!,
      reason: row.reason!,
      description: row.description!,
      evidence_json: row.evidence_json ?? null,
      status: row.status as ComplaintRecord["status"],
      resolution_action: (row.resolution_action as RegistryAction | null) ?? null,
      resolution_notes: row.resolution_notes ?? null,
      created_at: row.created_at!,
      updated_at: row.updated_at!,
    }));
  }

  async listProtectedDictionaryEntries(limit = 1000): Promise<
    Array<{ name: string; category: string; note: string | null }>
  > {
    return this.db.all(
      "SELECT name, category, note FROM protected_name_dictionary ORDER BY name ASC LIMIT ?",
      limit,
    );
  }

  async addProtectedDictionaryEntry(
    name: string,
    category = "manual",
    note?: string | null,
  ): Promise<void> {
    const existing = await this.getProtectedDictionaryMatch(name);
    if (existing) {
      await this.db.run(
        "UPDATE protected_name_dictionary SET category = ?, note = ? WHERE name = ?",
        category,
        note ?? null,
        name,
      );
      return;
    }
    await this.db.run(
      "INSERT INTO protected_name_dictionary (name, category, note) VALUES (?, ?, ?)",
      name,
      category,
      note ?? null,
    );
  }

  async removeProtectedDictionaryEntry(name: string): Promise<boolean> {
    const existing = await this.getProtectedDictionaryMatch(name);
    if (!existing) {
      return false;
    }
    await this.db.run("DELETE FROM protected_name_dictionary WHERE name = ?", name);
    return true;
  }

  async activateNativeNameByOperator(id: string, notes?: string | null): Promise<NativeNameRecord | null> {
    const existing = await this.getNativeNameById(id);
    if (!existing) {
      return null;
    }
    const updatedAt = nowIso();
    await this.db.run(
      `UPDATE native_names
       SET status = 'active', proof_status = 'accepted', review_notes = ?, updated_at = ?
       WHERE id = ?`,
      notes ?? existing.review_notes,
      updatedAt,
      id,
    );
    return this.getNativeNameById(id);
  }

  async createProviderNamespace(input: {
    slug: string;
    providerId: string;
    description?: string;
    registrationPolicy?: string;
    reservedNames?: string[];
    status?: string;
  }): Promise<Record<string, string | null>> {
    const timestamp = nowIso();
    const slug = input.slug.toLowerCase();
    await this.db.run(
      `INSERT INTO provider_namespaces (
        slug, provider_id, status, description, registration_policy, reserved_names_json, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      slug,
      input.providerId,
      input.status ?? "submitted",
      input.description ?? null,
      input.registrationPolicy ?? "provider_managed_pricing",
      input.reservedNames?.length ? JSON.stringify(input.reservedNames) : null,
      timestamp,
      timestamp,
    );
    return (await this.getProviderNamespace(slug))!;
  }

  async getProviderNamespace(slug: string): Promise<Record<string, string | null> | null> {
    return this.db.one("SELECT * FROM provider_namespaces WHERE slug = ?", slug.toLowerCase());
  }

  async listProviderNamespaces(providerId: string): Promise<Array<Record<string, string | null>>> {
    return this.db.all(
      "SELECT * FROM provider_namespaces WHERE provider_id = ? ORDER BY updated_at DESC",
      providerId,
    );
  }

  async listAllProviderNamespaces(): Promise<Array<Record<string, string | null>>> {
    return this.db.all("SELECT * FROM provider_namespaces ORDER BY updated_at DESC");
  }

  async updateProviderNamespace(
    slug: string,
    patch: Partial<{
      status: string;
      description: string | null;
      registrationPolicy: string;
    }>,
  ): Promise<Record<string, string | null> | null> {
    const existing = await this.getProviderNamespace(slug);
    if (!existing) return null;
    const updatedAt = nowIso();
    await this.db.run(
      `UPDATE provider_namespaces
       SET status = ?, description = ?, registration_policy = ?, updated_at = ?
       WHERE slug = ?`,
      patch.status ?? existing.status!,
      (patch.description !== undefined ? patch.description : existing.description) ?? null,
      patch.registrationPolicy ?? existing.registration_policy!,
      updatedAt,
      slug.toLowerCase(),
    );
    return this.getProviderNamespace(slug);
  }

  async getNamespaceName(
    namespaceSlug: string,
    label: string,
  ): Promise<Record<string, string | null> | null> {
    return this.db.one(
      "SELECT * FROM namespace_names WHERE namespace_slug = ? AND label = ?",
      namespaceSlug.toLowerCase(),
      label.toLowerCase(),
    );
  }

  async getNamespaceNameByFullName(fullName: string): Promise<Record<string, string | null> | null> {
    return this.db.one("SELECT * FROM namespace_names WHERE full_name = ?", fullName.toLowerCase());
  }

  async getNamespaceNameAvailability(
    namespaceSlug: string,
    label: string,
  ): Promise<{ available: boolean; reason?: string }> {
    const ns = await this.getProviderNamespace(namespaceSlug);
    if (!ns || ns.status !== "active") {
      return { available: false, reason: "namespace_inactive" };
    }
    const reserved = ns.reserved_names_json
      ? (JSON.parse(ns.reserved_names_json) as string[])
      : [];
    const normalizedLabel = label.toLowerCase();
    if (reserved.includes(normalizedLabel)) {
      return { available: false, reason: "reserved" };
    }
    const existing = await this.getNamespaceName(namespaceSlug, normalizedLabel);
    if (existing && existing.status !== "removed") {
      return { available: false, reason: "taken" };
    }
    return { available: true };
  }

  async createNamespaceName(input: {
    namespaceSlug: string;
    label: string;
    controllerRef?: string;
    chain?: string;
    asset?: string;
    address?: string;
  }): Promise<Record<string, string | null>> {
    const timestamp = nowIso();
    const slug = input.namespaceSlug.toLowerCase();
    const label = input.label.toLowerCase();
    const fullName = `${label}.${slug}`;
    const preview =
      input.address && input.chain && input.asset
        ? `${input.chain}:${input.asset}:${input.address.slice(0, 8)}…`
        : null;
    const id = newId("nsname");
    await this.db.run(
      `INSERT INTO namespace_names (
        id, namespace_slug, label, full_name, controller_ref, status,
        chain, asset, address, destination_preview,
        registered_at, activated_at, last_updated, last_payment_update
      ) VALUES (?, ?, ?, ?, ?, 'active', ?, ?, ?, ?, ?, ?, ?, ?)`,
      id,
      slug,
      label,
      fullName,
      input.controllerRef ?? null,
      input.chain ?? null,
      input.asset ?? null,
      input.address ?? null,
      preview,
      timestamp,
      timestamp,
      timestamp,
      input.address ? timestamp : null,
    );
    return (await this.getNamespaceName(slug, label))!;
  }

  async updateNamespaceName(
    namespaceSlug: string,
    label: string,
    patch: Partial<{
      status: string;
      controllerRef: string | null;
      chain: string | null;
      asset: string | null;
      address: string | null;
    }>,
  ): Promise<Record<string, string | null> | null> {
    const existing = await this.getNamespaceName(namespaceSlug, label);
    if (!existing) return null;
    const updatedAt = nowIso();
    const chain = patch.chain !== undefined ? patch.chain : existing.chain ?? null;
    const asset = patch.asset !== undefined ? patch.asset : existing.asset ?? null;
    const address = patch.address !== undefined ? patch.address : existing.address ?? null;
    const preview =
      address && chain && asset ? `${chain}:${asset}:${address.slice(0, 8)}…` : existing.destination_preview;
    await this.db.run(
      `UPDATE namespace_names
       SET status = ?, controller_ref = ?, chain = ?, asset = ?, address = ?,
           destination_preview = ?, last_updated = ?, last_payment_update = ?
       WHERE namespace_slug = ? AND label = ?`,
      patch.status ?? existing.status!,
      (patch.controllerRef !== undefined ? patch.controllerRef : existing.controller_ref) ?? null,
      chain,
      asset,
      address,
      preview ?? null,
      updatedAt,
      address ? updatedAt : existing.last_payment_update ?? null,
      namespaceSlug.toLowerCase(),
      label.toLowerCase(),
    );
    return this.getNamespaceName(namespaceSlug, label);
  }

  async listNamespaceNames(namespaceSlug: string): Promise<Array<Record<string, string | null>>> {
    return this.db.all(
      "SELECT * FROM namespace_names WHERE namespace_slug = ? AND status != 'removed' ORDER BY registered_at DESC",
      namespaceSlug.toLowerCase(),
    );
  }

  async getNamespaceUsage(namespaceSlug: string): Promise<{
    total_names: number;
    active_names: number;
    registrations_this_month: number;
    removals_this_month: number;
  }> {
    const slug = namespaceSlug.toLowerCase();
    const total = await this.db.one<{ count: number }>(
      "SELECT COUNT(*) as count FROM namespace_names WHERE namespace_slug = ? AND status != 'removed'",
      slug,
    );
    const active = await this.db.one<{ count: number }>(
      "SELECT COUNT(*) as count FROM namespace_names WHERE namespace_slug = ? AND status = 'active'",
      slug,
    );
    return {
      total_names: Number(total?.count ?? 0),
      active_names: Number(active?.count ?? 0),
      registrations_this_month: Number(total?.count ?? 0),
      removals_this_month: 0,
    };
  }

  async getDashboardApplication(id: string): Promise<DashboardApplication | null> {
    const row = await this.db.one<DashboardApplicationRow>(
      "SELECT * FROM dashboard_applications WHERE id = ?",
      id,
    );
    return row ? dashboardApplicationFromRow(row) : null;
  }

  async listDashboardApplications(privyUserId?: string): Promise<DashboardApplication[]> {
    const rows = privyUserId
      ? await this.db.all<DashboardApplicationRow>(
          "SELECT * FROM dashboard_applications WHERE privy_user_id = ? ORDER BY submitted_at DESC",
          privyUserId,
        )
      : await this.db.all<DashboardApplicationRow>(
          "SELECT * FROM dashboard_applications ORDER BY submitted_at DESC",
        );
    return rows.map(dashboardApplicationFromRow);
  }

  async saveDashboardApplication(input: {
    id: string;
    privyUserId: string;
    track: "business" | "provider";
    status: string;
    payload: Record<string, string>;
    submittedAt: string;
    controllerWallet?: string | null;
    documentRequest?: Record<string, unknown> | null;
    documentResponse?: Record<string, unknown> | null;
  }): Promise<DashboardApplication> {
    await this.db.run(
      `INSERT INTO dashboard_applications
        (id, privy_user_id, track, status, payload_json, submitted_at,
         document_request_json, document_response_json, controller_wallet)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
       ON CONFLICT (privy_user_id, track) DO UPDATE SET
        id = excluded.id,
        status = excluded.status,
        payload_json = excluded.payload_json,
        submitted_at = excluded.submitted_at,
        reviewed_at = NULL,
        rejection_reason = NULL,
        document_request_json = excluded.document_request_json,
        document_response_json = excluded.document_response_json,
        controller_wallet = excluded.controller_wallet`,
      input.id,
      input.privyUserId,
      input.track,
      input.status,
      JSON.stringify(input.payload),
      input.submittedAt,
      input.documentRequest ? JSON.stringify(input.documentRequest) : null,
      input.documentResponse ? JSON.stringify(input.documentResponse) : null,
      input.controllerWallet ?? null,
    );
    const row = await this.db.one<DashboardApplicationRow>(
      "SELECT * FROM dashboard_applications WHERE privy_user_id = ? AND track = ?",
      input.privyUserId,
      input.track,
    );
    if (!row) throw new Error("Failed to save dashboard application");
    return dashboardApplicationFromRow(row);
  }

  async updateDashboardApplication(
    id: string,
    patch: {
      status?: string;
      payload?: Record<string, string>;
      rejectionReason?: string | null;
      documentRequest?: Record<string, unknown> | null;
      documentResponse?: Record<string, unknown> | null;
    },
  ): Promise<DashboardApplication | null> {
    const existing = await this.getDashboardApplication(id);
    if (!existing) return null;
    const reviewedAt = patch.status ? nowIso() : existing.reviewedAt ?? null;
    await this.db.run(
      `UPDATE dashboard_applications
       SET status = ?, payload_json = ?, reviewed_at = ?, rejection_reason = ?,
           document_request_json = ?, document_response_json = ?
       WHERE id = ?`,
      patch.status ?? existing.status,
      JSON.stringify(patch.payload ?? existing.payload),
      reviewedAt,
      patch.rejectionReason === undefined
        ? existing.rejectionReason ?? null
        : patch.rejectionReason,
      patch.documentRequest === undefined
        ? (existing.documentRequest ? JSON.stringify(existing.documentRequest) : null)
        : (patch.documentRequest ? JSON.stringify(patch.documentRequest) : null),
      patch.documentResponse === undefined
        ? (existing.documentResponse ? JSON.stringify(existing.documentResponse) : null)
        : (patch.documentResponse ? JSON.stringify(patch.documentResponse) : null),
      id,
    );
    return this.getDashboardApplication(id);
  }

  async getApprovedProviderApplication(
    privyUserId: string,
  ): Promise<DashboardApplication | null> {
    const row = await this.db.one<DashboardApplicationRow>(
      `SELECT * FROM dashboard_applications
       WHERE privy_user_id = ? AND track = 'provider' AND status = 'approved'
       ORDER BY reviewed_at DESC LIMIT 1`,
      privyUserId,
    );
    return row ? dashboardApplicationFromRow(row) : null;
  }

  async getDashboardProviderAccount(
    privyUserId: string,
  ): Promise<DashboardProviderAccountRecord | null> {
    const row = await this.db.one<DashboardProviderAccountRow>(
      "SELECT * FROM dashboard_provider_accounts WHERE privy_user_id = ?",
      privyUserId,
    );
    return row ? this.mapDashboardProviderAccount(row) : null;
  }

  async getDashboardProviderAccountByProviderId(
    providerId: string,
  ): Promise<DashboardProviderAccountRecord | null> {
    const row = await this.db.one<DashboardProviderAccountRow>(
      "SELECT * FROM dashboard_provider_accounts WHERE provider_id = ?",
      providerId,
    );
    return row ? this.mapDashboardProviderAccount(row) : null;
  }

  async ensureUniqueProviderId(baseId: string): Promise<string> {
    let candidate = baseId;
    let suffix = 0;
    while (await this.getProviderById(candidate)) {
      suffix += 1;
      candidate = `${baseId}_${suffix}`;
    }
    return candidate;
  }

  async provisionProviderDashboardAccount(input: {
    privyUserId: string;
    providerId: string;
    name: string;
    website?: string;
    integrationLevel: WalletProviderRecord["integration_level"];
    allowedIdentifierTypes: string[];
    apiKeyHash: string;
    keyPrefix: string;
  }): Promise<{
    account: DashboardProviderAccountRecord;
    provider: WalletProviderRecord;
  }> {
    const existing = await this.getDashboardProviderAccount(input.privyUserId);
    if (existing) {
      const provider = await this.getProviderById(existing.provider_id);
      if (!provider) {
        throw new Error("Linked provider record is missing.");
      }
      return { account: existing, provider };
    }
    const timestamp = nowIso();
    const provider = await this.createProvider({
      providerId: input.providerId,
      name: input.name,
      website: input.website,
      integrationLevel: input.integrationLevel,
      allowedIdentifierTypes: input.allowedIdentifierTypes,
      apiKeyHash: input.apiKeyHash,
      status: "APPROVED",
    });
    await this.db.run(
      `INSERT INTO dashboard_provider_accounts (
        privy_user_id, provider_id, key_prefix, minute_started_at, minute_count,
        day_started_at, day_count, last_used_at, created_at, updated_at
      ) VALUES (?, ?, ?, NULL, 0, NULL, 0, NULL, ?, ?)`,
      input.privyUserId,
      input.providerId,
      input.keyPrefix,
      timestamp,
      timestamp,
    );
    const account = (await this.getDashboardProviderAccount(input.privyUserId))!;
    return { account, provider };
  }

  async regenerateProviderDashboardKey(input: {
    privyUserId: string;
    apiKeyHash: string;
    keyPrefix: string;
  }): Promise<DashboardProviderAccountRecord | null> {
    const account = await this.getDashboardProviderAccount(input.privyUserId);
    if (!account) return null;
    const timestamp = nowIso();
    await this.updateProvider(account.provider_id, { apiKeyHash: input.apiKeyHash });
    await this.db.run(
      `UPDATE dashboard_provider_accounts
       SET key_prefix = ?, minute_started_at = NULL, minute_count = 0,
           day_started_at = NULL, day_count = 0, updated_at = ?
       WHERE privy_user_id = ?`,
      input.keyPrefix,
      timestamp,
      input.privyUserId,
    );
    return this.getDashboardProviderAccount(input.privyUserId);
  }

  async recordProviderUsage(
    providerId: string,
    timestamp = nowIso(),
  ): Promise<{
    allowed: boolean;
    account: DashboardProviderAccountRecord;
    usage: ProviderApiUsage;
    retry_after_seconds?: number;
  } | null> {
    const account = await this.getDashboardProviderAccountByProviderId(providerId);
    if (!account) return null;
    const existingRow = await this.db.one<DashboardProviderAccountRow>(
      "SELECT * FROM dashboard_provider_accounts WHERE provider_id = ?",
      providerId,
    );
    if (!existingRow) return null;
    const existing = this.mapDashboardProviderAccount(existingRow);
    const now = Date.parse(timestamp);
    const minuteStartedAt = existing.minute_started_at;
    const minuteStarted =
      minuteStartedAt &&
      Number.isFinite(Date.parse(minuteStartedAt)) &&
      now - Date.parse(minuteStartedAt) < 60_000
        ? minuteStartedAt
        : timestamp;
    const minuteCount =
      minuteStarted === minuteStartedAt ? existing.minute_count : 0;
    const dayStarted =
      dayKey(existing.day_started_at) === dayKey(timestamp)
        ? (existing.day_started_at ?? timestamp)
        : timestamp;
    const dayCount =
      dayStarted === existing.day_started_at ? existing.day_count : 0;
    const minuteReset = new Date(Date.parse(minuteStarted) + 60_000).toISOString();
    const dayReset = new Date(
      Date.parse(`${dayKey(dayStarted)}T00:00:00.000Z`) + 86_400_000,
    ).toISOString();
    const usage: ProviderApiUsage = {
      requests_per_minute: PROVIDER_API_LIMITS.requests_per_minute,
      requests_per_day: PROVIDER_API_LIMITS.requests_per_day,
      minute_count: minuteCount,
      day_count: dayCount,
      minute_reset_at: minuteReset,
      day_reset_at: dayReset,
    };
    if (minuteCount >= PROVIDER_API_LIMITS.requests_per_minute) {
      return {
        allowed: false,
        account: existing,
        usage,
        retry_after_seconds: Math.max(
          1,
          Math.ceil((Date.parse(minuteReset) - now) / 1000),
        ),
      };
    }
    if (dayCount >= PROVIDER_API_LIMITS.requests_per_day) {
      return {
        allowed: false,
        account: existing,
        usage,
        retry_after_seconds: Math.max(
          1,
          Math.ceil((Date.parse(dayReset) - now) / 1000),
        ),
      };
    }
    await this.db.run(
      `UPDATE dashboard_provider_accounts
       SET minute_started_at = ?, minute_count = ?, day_started_at = ?, day_count = ?,
           last_used_at = ?, updated_at = ?
       WHERE provider_id = ?`,
      minuteStarted,
      minuteCount + 1,
      dayStarted,
      dayCount + 1,
      timestamp,
      timestamp,
      providerId,
    );
    const updated = (await this.getDashboardProviderAccountByProviderId(providerId))!;
    return {
      allowed: true,
      account: updated,
      usage: {
        ...usage,
        minute_count: minuteCount + 1,
        day_count: dayCount + 1,
      },
    };
  }

  async listProviderWebhooks(providerId: string): Promise<ProviderWebhookRecord[]> {
    const rows = await this.db.all<ProviderWebhookRow>(
      "SELECT * FROM provider_webhooks WHERE provider_id = ? ORDER BY created_at DESC",
      providerId,
    );
    return rows.map((row) => this.mapProviderWebhook(row));
  }

  async getProviderWebhook(
    webhookId: string,
    providerId: string,
  ): Promise<ProviderWebhookRecord | null> {
    const row = await this.db.one<ProviderWebhookRow>(
      "SELECT * FROM provider_webhooks WHERE id = ? AND provider_id = ?",
      webhookId,
      providerId,
    );
    return row ? this.mapProviderWebhook(row) : null;
  }

  async createProviderWebhook(input: {
    id: string;
    providerId: string;
    url: string;
    secretHash: string;
    secretPrefix: string;
    signingSecret: string;
    events: string[];
  }): Promise<ProviderWebhookRecord> {
    const timestamp = nowIso();
    await this.db.run(
      `INSERT INTO provider_webhooks (
        id, provider_id, url, secret_prefix, secret_hash, signing_secret, events_json, status,
        created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, 'ACTIVE', ?, ?)`,
      input.id,
      input.providerId,
      input.url,
      input.secretPrefix,
      input.secretHash,
      input.signingSecret,
      JSON.stringify(input.events),
      timestamp,
      timestamp,
    );
    return (await this.getProviderWebhook(input.id, input.providerId))!;
  }

  async updateProviderWebhook(
    webhookId: string,
    providerId: string,
    patch: {
      url?: string;
      events?: string[];
      status?: ProviderWebhookStatus;
    },
  ): Promise<ProviderWebhookRecord | null> {
    const existing = await this.getProviderWebhook(webhookId, providerId);
    if (!existing) return null;
    const timestamp = nowIso();
    await this.db.run(
      `UPDATE provider_webhooks
       SET url = ?, events_json = ?, status = ?, updated_at = ?
       WHERE id = ? AND provider_id = ?`,
      patch.url ?? existing.url,
      JSON.stringify(patch.events ?? existing.events),
      patch.status ?? existing.status,
      timestamp,
      webhookId,
      providerId,
    );
    return this.getProviderWebhook(webhookId, providerId);
  }

  async deleteProviderWebhook(
    webhookId: string,
    providerId: string,
  ): Promise<boolean> {
    const existing = await this.getProviderWebhook(webhookId, providerId);
    if (!existing) return false;
    await this.db.run(
      "DELETE FROM provider_webhooks WHERE id = ? AND provider_id = ?",
      webhookId,
      providerId,
    );
    return true;
  }

  async listProviderWebhooksForDispatch(
    providerId: string,
    event: string,
  ): Promise<
    Array<{
      id: string;
      provider_id: string;
      url: string;
      signing_secret: string;
    }>
  > {
    const rows = await this.db.all<ProviderWebhookRow>(
      `SELECT * FROM provider_webhooks
       WHERE provider_id = ? AND status = 'ACTIVE' AND signing_secret IS NOT NULL`,
      providerId,
    );
    return rows
      .filter((row) => {
        const events = JSON.parse(row.events_json) as string[];
        return events.includes(event);
      })
      .map((row) => ({
        id: row.id,
        provider_id: row.provider_id,
        url: row.url,
        signing_secret: row.signing_secret!,
      }));
  }

  async recordWebhookDelivery(input: {
    id: string;
    webhookId: string;
    providerId: string;
    event: string;
    status: "DELIVERED" | "FAILED";
    httpStatus: number | null;
    errorMessage: string | null;
  }): Promise<void> {
    await this.db.run(
      `INSERT INTO provider_webhook_deliveries (
        id, webhook_id, provider_id, event, status, http_status, error_message, attempted_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      input.id,
      input.webhookId,
      input.providerId,
      input.event,
      input.status,
      input.httpStatus,
      input.errorMessage,
      nowIso(),
    );
  }

  async listWebhookDeliveries(
    webhookId: string,
    providerId: string,
    limit = 20,
  ): Promise<
    Array<{
      id: string;
      event: string;
      status: string;
      http_status: number | null;
      error_message: string | null;
      attempted_at: string;
    }>
  > {
    return this.db.all(
      `SELECT id, event, status, http_status, error_message, attempted_at
       FROM provider_webhook_deliveries
       WHERE webhook_id = ? AND provider_id = ?
       ORDER BY attempted_at DESC
       LIMIT ?`,
      webhookId,
      providerId,
      limit,
    );
  }

  private mapDashboardProviderAccount(
    row: DashboardProviderAccountRow,
  ): DashboardProviderAccountRecord {
    return {
      privy_user_id: row.privy_user_id,
      provider_id: row.provider_id,
      key_prefix: row.key_prefix,
      minute_started_at: asIsoString(row.minute_started_at),
      minute_count: Number(row.minute_count ?? 0),
      day_started_at: asIsoString(row.day_started_at),
      day_count: Number(row.day_count ?? 0),
      last_used_at: asIsoString(row.last_used_at),
      created_at: asIsoString(row.created_at) ?? String(row.created_at),
      updated_at: asIsoString(row.updated_at) ?? String(row.updated_at),
    };
  }

  private mapProviderWebhook(row: ProviderWebhookRow): ProviderWebhookRecord {
    return {
      id: row.id,
      provider_id: row.provider_id,
      url: row.url,
      secret_prefix: row.secret_prefix,
      events: JSON.parse(row.events_json) as string[],
      status: row.status as ProviderWebhookStatus,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  }
}
