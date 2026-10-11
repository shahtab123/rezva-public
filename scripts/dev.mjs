import { execFileSync, spawn } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const skipBuild = process.argv.includes("--skip-build");
const apiOnly = process.argv.includes("--api-only");

const wranglerCli = join(root, "node_modules/wrangler/bin/wrangler.js");
const concurrentlyCli = join(root, "node_modules/concurrently/dist/bin/concurrently.js");

function run(command, args) {
  return new Promise((resolve, reject) => {
    const child = spawn(command, args, {
      cwd: root,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("exit", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`Process exited with code ${code}`));
      }
    });
  });
}

function runDetached(command, args) {
  const child = spawn(command, args, {
    cwd: root,
    stdio: "inherit",
  });
  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
}

async function waitForUrl(url, label, attempts = 60) {
  for (let i = 0; i < attempts; i += 1) {
    try {
      const response = await fetch(url, {
        signal: AbortSignal.timeout(1_000),
      });
      if (response.ok) {
        console.log(`✓ ${label} ready`);
        return;
      }
    } catch {
      // Server still starting.
    }
    await new Promise((resolve) => setTimeout(resolve, 500));
  }
}

function stopListeningProcesses(port) {
  let output = "";
  try {
    output = execFileSync("netstat", ["-ano"], { encoding: "utf8" });
  } catch {
    return;
  }

  const processIds = new Set();
  for (const line of output.split(/\r?\n/)) {
    const columns = line.trim().split(/\s+/);
    if (
      columns[0] === "TCP" &&
      columns[1]?.endsWith(`:${port}`) &&
      columns[3] === "LISTENING" &&
      columns[4]
    ) {
      processIds.add(columns[4]);
    }
  }

  for (const processId of processIds) {
    try {
      execFileSync("taskkill", ["/PID", processId, "/T", "/F"], {
        stdio: "ignore",
      });
    } catch {
      // The process may have exited between netstat and taskkill.
    }
  }
}

function stopDevProcesses() {
  stopListeningProcesses(3000);
  stopApiProcesses();
}

function stopApiProcesses() {
  stopListeningProcesses(8787);
  try {
    execFileSync("taskkill", ["/IM", "workerd.exe", "/T", "/F"], {
      stdio: "ignore",
    });
  } catch {
    // No Wrangler worker is running.
  }
  try {
    execFileSync(
      "wmic",
      [
        "process",
        "where",
        `CommandLine like '%wrangler%' and ProcessId != ${process.pid}`,
        "delete",
      ],
      { stdio: "ignore" },
    );
  } catch {
    // No Wrangler parent process is running.
  }
}

await run(process.execPath, [join(root, "scripts/ensure-env.mjs")]);

if (apiOnly) {
  stopApiProcesses();
} else {
  stopDevProcesses();
}

if (!skipBuild) {
  await run(process.execPath, [join(root, "scripts/build-packages.mjs")]);
}

// Neon-only local API: registry/.dev.vars (from .env.local) must include DATABASE_URL.
// Do NOT pass `--var DATABASE_URL:` - that clears Neon and falls back to local D1.
const wranglerArgs = [
  wranglerCli,
  "dev",
  "--config",
  "registry/wrangler.toml",
  "--ip",
  "0.0.0.0",
  "--log-level",
  "warn",
];

if (apiOnly) {
  console.log(
    "Starting API → http://127.0.0.1:8787 (Neon via DATABASE_URL · LAN: http://<this-PC-IP>:8787)"
  );
  const child = spawn(process.execPath, wranglerArgs, {
    cwd: root,
    stdio: "inherit",
  });
  child.on("error", (error) => {
    console.error(error.message);
    process.exit(1);
  });
  void waitForUrl("http://127.0.0.1:8787/health", "API");
  child.on("exit", (code) => {
    process.exit(code ?? 0);
  });
  await new Promise(() => {});
}

console.log(
  "Starting API → http://127.0.0.1:8787 (Neon)  ·  Website → http://localhost:3000"
);

runDetached(process.execPath, [
  concurrentlyCli,
  "-k",
  "--success",
  "first",
  "--prefix",
  "none",
  "npm run dev:api:quiet --silent",
  "npm run dev -w @rezva/website --silent",
]);

void waitForUrl("http://127.0.0.1:8787/health", "API");
void waitForUrl("http://127.0.0.1:3000", "Website");
