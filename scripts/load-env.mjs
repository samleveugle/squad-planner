import { existsSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import dotenv from "dotenv";

const rootDir = join(dirname(fileURLToPath(import.meta.url)), "..");
const rootEnvPath = join(rootDir, ".env.local");
const cursorEnvPath = join(rootDir, ".cursor", ".env.local");

function loadEnvFile(path) {
  if (!existsSync(path)) {
    return false;
  }

  dotenv.config({ path, override: true });
  return true;
}

const loadedFromRoot = loadEnvFile(rootEnvPath);
const loadedFromCursor = !loadedFromRoot && loadEnvFile(cursorEnvPath);

if (!loadedFromRoot && loadedFromCursor) {
  console.warn(
    "\n⚠️  .env.local staat in .cursor/ — Next.js leest die map niet.\n" +
      "   Kopieer het bestand naar de projectroot (naast package.json):\n" +
      `   ${rootEnvPath}\n`
  );
}

if (!loadedFromRoot && !loadedFromCursor) {
  console.error(
    "\n❌ Geen .env.local gevonden.\n" +
      `   Maak ${rootEnvPath} aan (zie .env.example en README).\n`
  );
  process.exit(1);
}

export { rootDir };
