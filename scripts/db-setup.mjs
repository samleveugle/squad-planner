import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");

function runScript(name) {
  return new Promise((resolve, reject) => {
    const child = spawn(process.execPath, ["--use-system-ca", join(rootDir, "scripts", name)], {
      stdio: "inherit",
      cwd: rootDir,
    });

    child.on("close", (code) => {
      if (code === 0) {
        resolve();
      } else {
        reject(new Error(`${name} exited with code ${code}`));
      }
    });
  });
}

console.log("=== Stap 1/2: tabellen aanmaken ===\n");
await runScript("db-migrate.mjs");

console.log("\n=== Stap 2/2: spelers + events laden ===\n");
await runScript("db-seed.mjs");

console.log("\n✅ Database setup klaar!");
