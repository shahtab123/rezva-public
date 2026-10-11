-- Protected dictionary + native name elevated review fields
-- Applied via RegistryStore.migrate() ensure* helpers and schema CREATE IF NOT EXISTS.

CREATE TABLE IF NOT EXISTS protected_name_dictionary (
  name TEXT PRIMARY KEY,
  category TEXT NOT NULL,
  note TEXT
);
