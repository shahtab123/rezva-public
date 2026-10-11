import { execSync } from "node:child_process";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const packages = ["protocol", "identifier-types", "external-naming", "sdk"];

for (const pkg of packages) {
  execSync("npx tsc -p tsconfig.json", {
    cwd: join(root, pkg),
    stdio: "pipe",
  });
}

console.log("Packages built (protocol, identifier-types, external-naming, sdk).");
