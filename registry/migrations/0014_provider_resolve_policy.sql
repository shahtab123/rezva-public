-- Optional per-provider resolve policy (UNR / registry toggles, blocklists).
ALTER TABLE wallet_providers ADD COLUMN IF NOT EXISTS resolve_policy_json TEXT;
