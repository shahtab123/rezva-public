import { copyFileSync, existsSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const example = join(root, ".env.example");
const local = join(root, ".env.local");
const workerDevVars = join(root, "registry", ".dev.vars");
const workerProdVars = join(root, "registry", ".prod.vars");

const WORKER_SECRET_KEYS = [
  "DATABASE_URL",
  "UPSTASH_REDIS_REST_URL",
  "UPSTASH_REDIS_REST_TOKEN",
  "ENVIRONMENT",
  "DEV_PROVIDER_KEY",
  "DASHBOARD_SERVICE_KEY",
  "DASHBOARD_PROVIDER_API_KEY",
  "OPERATOR_API_KEY",
  "OPERATOR_RECLAIM_DUAL_TOKEN",
  "CONTROLLER_AUTH_MODE",
  "CONTROLLER_AUTH_HMAC_SECRET",
  "REGISTRATION_SAFETY_SECONDS",
  "UPDATE_SAFETY_SECONDS",
  "REMOVAL_COOLDOWN_SECONDS",
  "RESOLVER_URL",
  "TEST_MERCHANT_WALLET",
  "TEST_MERCHANT_IDENTIFIER",
  "TEST_MERCHANT_USDC_CONTRACT",
  "BASE_SEPOLIA_RPC_URL",
  "ETHEREUM_RPC_URL",
  "BASE_RPC_URL",
  "POLYGON_RPC_URL",
  "SOLANA_RPC_URL",
  "UNSTOPPABLE_API_KEY",
  "UNSTOPPABLE_API_BASE",
  "SNS_RESOLVE_URL",
];

if (!existsSync(local) && existsSync(example)) {
  copyFileSync(example, local);
  console.log("Created .env.local from .env.example - edit as needed.");
}

function parseEnvFile(path) {
  if (!existsSync(path)) {
    return {};
  }

  const values = {};
  for (const line of readFileSync(path, "utf8").split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) {
      continue;
    }
    const eq = trimmed.indexOf("=");
    if (eq === -1) {
      continue;
    }
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    values[key] = value;
  }
  return values;
}

function envLines(env, keys) {
  const lines = [];
  for (const key of keys) {
    const value = env[key];
    if (value) {
      lines.push(`${key}=${value}`);
    }
  }
  return lines;
}

function syncWorkerDevVars() {
  // Prefer .env.local, then fill gaps from .env (so root .env alone still works).
  const env = {
    ...parseEnvFile(join(root, ".env")),
    ...parseEnvFile(local),
  };
  const lines = envLines(env, WORKER_SECRET_KEYS);

  if (lines.length === 0) {
    return;
  }

  writeFileSync(workerDevVars, `${lines.join("\n")}\n`, "utf8");

  // Production deploy file: root .env only (Vercel upload / live Worker secrets).
  // Do not let .env.local localhost overrides leak into `npm run deploy:api`.
  const prodEnv = parseEnvFile(join(root, ".env"));
  const prodLines = envLines(prodEnv, WORKER_SECRET_KEYS);
  if (prodLines.length) {
    writeFileSync(
      workerProdVars,
      `# Auto-synced from root .env only (not .env.local)\n${prodLines.join("\n")}\n`,
      "utf8",
    );
  }

  if (!env.DATABASE_URL) {
    console.error(
      "DATABASE_URL is missing from .env / .env.local.\n" +
        "Rezva local + production API use Neon only - add your Neon connection string.",
    );
    process.exit(1);
  }
  console.log("Worker .dev.vars synced (Neon DATABASE_URL present).");
  if (prodLines.length) {
    console.log("Worker .prod.vars synced from .env (for npm run deploy:api).");
  }
}

function syncWebsitePublicEnv() {
  const env = {
    ...parseEnvFile(join(root, ".env")),
    ...parseEnvFile(local),
  };
  if (!env.NEXT_PUBLIC_REGISTRATION_SAFETY_SECONDS && env.REGISTRATION_SAFETY_SECONDS) {
    env.NEXT_PUBLIC_REGISTRATION_SAFETY_SECONDS = env.REGISTRATION_SAFETY_SECONDS;
  }
  const websiteEnv = join(root, "website", ".env.local");
  const keys = [
    "NEXT_PUBLIC_API_URL",
    "NEXT_PUBLIC_PRIVY_APP_ID",
    "NEXT_PUBLIC_REOWN_PROJECT_ID",
    "NEXT_PUBLIC_REGISTRATION_SAFETY_SECONDS",
    "PRIVY_APP_SECRET",
    "OPERATOR_API_KEY",
    "DASHBOARD_PROVIDER_API_KEY",
    "DASHBOARD_SERVICE_KEY",
    "AUTH_SECRET",
    "ADMIN_USERNAME",
    "ADMIN_PASSWORD",
  ];
  const lines = keys
    .filter((key) => env[key])
    .map((key) => `${key}=${env[key]}`);
  if (lines.length === 0) {
    return;
  }
  writeFileSync(
    websiteEnv,
    `# Auto-synced from root .env / .env.local by scripts/ensure-env.mjs\n${lines.join("\n")}\n`,
    "utf8",
  );
}

syncWorkerDevVars();
syncWebsitePublicEnv();
