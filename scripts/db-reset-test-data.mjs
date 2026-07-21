import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { rootDir } from "./load-env.mjs";

const sqlPath = join(
  rootDir,
  "supabase",
  "migrations",
  "004_reset_test_responses.sql"
);
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error(
    "\n❌ SUPABASE_DB_URL ontbreekt in .env.local\n\n" +
      "Of plak supabase/migrations/004_reset_test_responses.sql\n" +
      "in Supabase → SQL Editor → Run.\n"
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

console.log("Test-aanwezigheden en gerelateerde testdata wissen...");
console.log("(players, events en accounts blijven behouden)\n");

const db = postgres(databaseUrl, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);
  console.log("✅ Gewist: availability, lineups, match_stats, availability_reminder_log");
} catch (error) {
  console.error("❌ Reset mislukt:", error.message);
  process.exit(1);
} finally {
  await db.end();
}
