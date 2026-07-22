import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { rootDir } from "./load-env.mjs";

const sqlPath = join(rootDir, "supabase", "migrations", "005_enable_rls.sql");
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error(
    "\n❌ SUPABASE_DB_URL ontbreekt in .env.local\n\n" +
      "Of plak supabase/migrations/005_enable_rls.sql\n" +
      "in Supabase → SQL Editor → Run.\n"
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

console.log("Row Level Security inschakelen op public tabellen...\n");

const db = postgres(databaseUrl, { ssl: "require", max: 1 });

try {
  await db.unsafe(sql);

  const rows = await db`
    select
      c.relname as table_name,
      c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname in (
        'players',
        'events',
        'availability',
        'lineups',
        'match_stats',
        'push_preferences',
        'availability_reminder_log'
      )
    order by c.relname
  `;

  console.log("✅ RLS status:");
  for (const row of rows) {
    console.log(`   - ${row.table_name}: ${row.rls_enabled ? "enabled" : "DISABLED"}`);
  }

  const missing = rows.filter((row) => !row.rls_enabled);
  if (missing.length > 0) {
    throw new Error(`RLS niet actief op: ${missing.map((r) => r.table_name).join(", ")}`);
  }
} catch (error) {
  console.error("❌ RLS migratie mislukt:", error.message);
  process.exit(1);
} finally {
  await db.end();
}
