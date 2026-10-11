export const SCHEMA_SQL = `
CREATE TABLE IF NOT EXISTS wallet_providers (
  provider_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  status TEXT NOT NULL,
  integration_level TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  allowed_identifier_types_json TEXT NOT NULL,
  resolve_policy_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS controllers (
  controller_id TEXT PRIMARY KEY,
  wallet_address TEXT NOT NULL UNIQUE,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS native_names (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL UNIQUE,
  controller_id TEXT NOT NULL,
  status TEXT NOT NULL,
  review_tier TEXT,
  dictionary_match TEXT,
  proof_status TEXT,
  review_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS identifiers (
  id TEXT PRIMARY KEY,
  type TEXT NOT NULL,
  normalized_value TEXT NOT NULL,
  display_value TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  name_id TEXT,
  status TEXT NOT NULL,
  registered_at TEXT NOT NULL,
  activated_at TEXT,
  last_updated TEXT NOT NULL,
  last_payment_update TEXT,
  removed_at TEXT,
  available_at TEXT,
  pending_activation_at TEXT,
  pending_destination_json TEXT,
  UNIQUE (type, normalized_value)
);

CREATE TABLE IF NOT EXISTS payment_destinations (
  id TEXT PRIMARY KEY,
  identifier_id TEXT NOT NULL,
  chain TEXT NOT NULL,
  asset TEXT NOT NULL,
  address TEXT NOT NULL,
  token_contract TEXT,
  network_identifier TEXT,
  memo TEXT,
  payment_reference TEXT,
  minimum_amount TEXT,
  maximum_amount TEXT,
  fixed_amount TEXT,
  expiration TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_identifiers_type_value ON identifiers(type, normalized_value);
CREATE INDEX IF NOT EXISTS idx_payment_destinations_identifier ON payment_destinations(identifier_id, status);

CREATE TABLE IF NOT EXISTS registry_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  identifier_id TEXT,
  name_id TEXT,
  timestamp TEXT NOT NULL,
  authorization_reference TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_registry_events_identifier ON registry_events(identifier_id, timestamp);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  identifier_id TEXT NOT NULL,
  reporter_user_id TEXT,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_json TEXT,
  status TEXT NOT NULL,
  resolution_action TEXT,
  resolution_notes TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS reserved_names (
  name TEXT PRIMARY KEY
);

CREATE TABLE IF NOT EXISTS protected_name_dictionary (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  note TEXT
);

CREATE TABLE IF NOT EXISTS provider_namespaces (
  slug TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  status TEXT NOT NULL,
  description TEXT,
  registration_policy TEXT NOT NULL,
  reserved_names_json TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS namespace_names (
  id TEXT PRIMARY KEY,
  namespace_slug TEXT NOT NULL,
  label TEXT NOT NULL,
  full_name TEXT NOT NULL UNIQUE,
  controller_ref TEXT,
  status TEXT NOT NULL,
  chain TEXT,
  asset TEXT,
  address TEXT,
  destination_preview TEXT,
  registered_at TEXT NOT NULL,
  activated_at TEXT,
  last_updated TEXT NOT NULL,
  last_payment_update TEXT,
  UNIQUE (namespace_slug, label)
);

CREATE INDEX IF NOT EXISTS idx_namespace_names_slug ON namespace_names(namespace_slug, status);

CREATE TABLE IF NOT EXISTS dashboard_applications (
  id TEXT PRIMARY KEY,
  privy_user_id TEXT NOT NULL,
  track TEXT NOT NULL,
  status TEXT NOT NULL,
  payload_json TEXT NOT NULL,
  submitted_at TEXT,
  reviewed_at TEXT,
  rejection_reason TEXT,
  document_request_json TEXT,
  document_response_json TEXT,
  controller_wallet TEXT,
  UNIQUE (privy_user_id, track)
);

CREATE INDEX IF NOT EXISTS idx_dashboard_applications_user
  ON dashboard_applications(privy_user_id, track);

CREATE TABLE IF NOT EXISTS free_api_credentials (
  id TEXT PRIMARY KEY,
  owner_user_id TEXT NOT NULL,
  key_hash TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  revoked_at TEXT,
  last_used_at TEXT,
  day_started_at TEXT,
  day_count INTEGER NOT NULL DEFAULT 0,
  minute_started_at TEXT,
  minute_count INTEGER NOT NULL DEFAULT 0
);

CREATE INDEX IF NOT EXISTS idx_free_api_credentials_key_hash
  ON free_api_credentials(key_hash, status);

CREATE TABLE IF NOT EXISTS shared_test_merchant (
  id INTEGER PRIMARY KEY,
  identifier_id TEXT NOT NULL UNIQUE,
  identifier_value TEXT NOT NULL,
  controller_id TEXT NOT NULL,
  wallet_address TEXT NOT NULL,
  network TEXT NOT NULL,
  asset TEXT NOT NULL,
  token_contract TEXT NOT NULL,
  network_identifier TEXT NOT NULL,
  created_at TEXT NOT NULL
);

CREATE TABLE IF NOT EXISTS test_payments (
  id TEXT PRIMARY KEY,
  merchant_identifier_id TEXT NOT NULL,
  transaction_hash TEXT NOT NULL UNIQUE,
  network TEXT NOT NULL,
  asset TEXT NOT NULL,
  amount TEXT NOT NULL,
  amount_raw TEXT NOT NULL,
  sender TEXT NOT NULL,
  recipient TEXT NOT NULL,
  timestamp TEXT NOT NULL,
  confirmation_status TEXT NOT NULL,
  testnet INTEGER NOT NULL,
  block_number INTEGER,
  detected_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_test_payments_merchant
  ON test_payments(merchant_identifier_id, detected_at);

CREATE TABLE IF NOT EXISTS dashboard_provider_accounts (
  privy_user_id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL UNIQUE,
  key_prefix TEXT NOT NULL,
  minute_started_at TEXT,
  minute_count INTEGER NOT NULL DEFAULT 0,
  day_started_at TEXT,
  day_count INTEGER NOT NULL DEFAULT 0,
  last_used_at TEXT,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_dashboard_provider_accounts_provider
  ON dashboard_provider_accounts(provider_id);

CREATE TABLE IF NOT EXISTS provider_webhooks (
  id TEXT PRIMARY KEY,
  provider_id TEXT NOT NULL,
  url TEXT NOT NULL,
  secret_prefix TEXT NOT NULL,
  secret_hash TEXT NOT NULL,
  signing_secret TEXT,
  events_json TEXT NOT NULL,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_webhooks_provider
  ON provider_webhooks(provider_id, status);

CREATE TABLE IF NOT EXISTS provider_webhook_deliveries (
  id TEXT PRIMARY KEY,
  webhook_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  event TEXT NOT NULL,
  status TEXT NOT NULL,
  http_status INTEGER,
  error_message TEXT,
  attempted_at TEXT NOT NULL
);

CREATE INDEX IF NOT EXISTS idx_provider_webhook_deliveries_webhook
  ON provider_webhook_deliveries(webhook_id, attempted_at);

`;

export const SCHEMA_SEED_SQL = `
INSERT OR IGNORE INTO reserved_names (name) VALUES ('admin');
INSERT OR IGNORE INTO reserved_names (name) VALUES ('support');
INSERT OR IGNORE INTO reserved_names (name) VALUES ('system');
INSERT OR IGNORE INTO reserved_names (name) VALUES ('api');
INSERT OR IGNORE INTO reserved_names (name) VALUES ('official');
INSERT OR IGNORE INTO reserved_names (name) VALUES ('rezva');
`;
