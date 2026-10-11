-- Rezva registry schema (D1/SQLite; portable to PostgreSQL)

CREATE TABLE IF NOT EXISTS wallet_providers (
  provider_id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  website TEXT,
  status TEXT NOT NULL,
  integration_level TEXT NOT NULL,
  api_key_hash TEXT NOT NULL,
  allowed_identifier_types_json TEXT NOT NULL,
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
  updated_at TEXT NOT NULL,
  FOREIGN KEY (controller_id) REFERENCES controllers(controller_id)
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
  UNIQUE (type, normalized_value),
  FOREIGN KEY (controller_id) REFERENCES controllers(controller_id),
  FOREIGN KEY (name_id) REFERENCES native_names(id)
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
  updated_at TEXT NOT NULL,
  FOREIGN KEY (identifier_id) REFERENCES identifiers(id)
);

CREATE INDEX IF NOT EXISTS idx_identifiers_type_value
  ON identifiers(type, normalized_value);

CREATE INDEX IF NOT EXISTS idx_payment_destinations_identifier
  ON payment_destinations(identifier_id, status);

CREATE TABLE IF NOT EXISTS registry_events (
  id TEXT PRIMARY KEY,
  event_type TEXT NOT NULL,
  identifier_id TEXT,
  name_id TEXT,
  timestamp TEXT NOT NULL,
  authorization_reference TEXT,
  metadata_json TEXT
);

CREATE INDEX IF NOT EXISTS idx_registry_events_identifier
  ON registry_events(identifier_id, timestamp);

CREATE TABLE IF NOT EXISTS complaints (
  id TEXT PRIMARY KEY,
  identifier_id TEXT NOT NULL,
  reason TEXT NOT NULL,
  description TEXT NOT NULL,
  evidence_json TEXT,
  status TEXT NOT NULL,
  created_at TEXT NOT NULL,
  updated_at TEXT NOT NULL,
  FOREIGN KEY (identifier_id) REFERENCES identifiers(id)
);

CREATE TABLE IF NOT EXISTS reserved_names (
  name TEXT PRIMARY KEY
);

INSERT OR IGNORE INTO reserved_names (name) VALUES
  ('admin'),
  ('support'),
  ('system'),
  ('api'),
  ('official'),
  ('rezva');

CREATE TABLE IF NOT EXISTS protected_name_dictionary (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  note TEXT
);
