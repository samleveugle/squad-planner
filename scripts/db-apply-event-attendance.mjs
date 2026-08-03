import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { rootDir } from "./load-env.mjs";

const sqlPath = join(
  rootDir,
  "supabase",
  "migrations",
  "007_event_attendance.sql"
);
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error(
    "\n❌ SUPABASE_DB_URL ontbreekt in .env.local\n\n" +
      "Of plak supabase/migrations/007_event_attendance.sql\n" +
      "in Supabase → SQL Editor → Run.\n"
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

console.log("event_attendance tabel + RLS aanmaken...\n");

const db = postgres(databaseUrl, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);
  console.log("✅ event_attendance klaar (tabel + RLS policies)");
} catch (error) {
  console.error("❌ Migratie mislukt:", error.message);
  process.exit(1);
} finally {
  await db.end();
}
