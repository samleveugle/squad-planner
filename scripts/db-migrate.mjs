import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { rootDir } from "./load-env.mjs";

const sqlPath = join(rootDir, "supabase", "migrations", "001_initial_schema.sql");
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error(
    "\n❌ SUPABASE_DB_URL ontbreekt in .env.local\n\n" +
      "Zo vind je die in Supabase:\n" +
      "1. Project Settings (tandwiel) → Database\n" +
      "2. Connection string → URI → kopieer\n" +
      "3. Vervang [YOUR-PASSWORD] door je database-wachtwoord\n" +
      "4. Plak als SUPABASE_DB_URL=... in .env.local\n\n" +
      "Alternatief: open supabase/migrations/001_initial_schema.sql\n" +
      "en plak de inhoud in Supabase → SQL Editor → Run.\n"
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

console.log("Database tabellen aanmaken...");

const db = postgres(databaseUrl, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);
  console.log("✅ Tabellen aangemaakt (players, events, availability, lineups, match_stats)");
} catch (error) {
  console.error("❌ Migratie mislukt:", error.message);
  process.exit(1);
} finally {
  await db.end();
}
