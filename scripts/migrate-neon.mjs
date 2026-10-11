import { readFileSync, existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { neon } from "@neondatabase/serverless";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");

function loadDatabaseUrl() {
  for (const file of [".env.local", ".env"]) {
    const path = join(root, file);
    if (!existsSync(path)) {
      continue;
    }
    for (const line of readFileSync(path, "utf8").split("\n")) {
      const trimmed = line.trim();
      if (trimmed.startsWith("DATABASE_URL=")) {
        return trimmed.slice("DATABASE_URL=".length).trim();
      }
    }
  }
  return process.env.DATABASE_URL ?? null;
}

const databaseUrl = loadDatabaseUrl();
if (!databaseUrl) {
  console.error("DATABASE_URL not found in .env.local or .env");
  process.exit(1);
}

const schemaPath = join(root, "registry", "src", "lib", "schema-postgres.ts");
const schemaSource = readFileSync(schemaPath, "utf8");
const schemaMatch = schemaSource.match(/export const SCHEMA_POSTGRES_SQL = `([\s\S]*?)`;/);
const seedMatch = schemaSource.match(/export const SCHEMA_POSTGRES_SEED_SQL = `([\s\S]*?)`;/);

if (!schemaMatch || !seedMatch) {
  console.error("Could not read postgres schema from schema-postgres.ts");
  process.exit(1);
}

const sql = neon(databaseUrl);
const statements = `${schemaMatch[1]}\n${seedMatch[1]}`
  .split(";")
  .map((part) => part.trim())
  .filter(Boolean);

for (const statement of statements) {
  await sql.query(statement);
  console.log("OK:", statement.slice(0, 60).replace(/\s+/g, " "), "...");
}

console.log("Neon schema migrated.");
