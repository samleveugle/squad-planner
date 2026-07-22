import { readFileSync } from "node:fs";
import { join } from "node:path";

import postgres from "postgres";

import { rootDir } from "./load-env.mjs";

const sqlPath = join(rootDir, "supabase", "migrations", "006_rls_policies.sql");
const databaseUrl = process.env.SUPABASE_DB_URL;

if (!databaseUrl) {
  console.error(
    "\n❌ SUPABASE_DB_URL ontbreekt in .env.local\n\n" +
      "Of plak supabase/migrations/006_rls_policies.sql\n" +
      "in Supabase → SQL Editor → Run.\n"
  );
  process.exit(1);
}

const sql = readFileSync(sqlPath, "utf8");

console.log("RLS policies toepassen (006_rls_policies.sql)...\n");

const db = postgres(databaseUrl, { ssl: "require", max: 1 });

const expectedTables = [
  "players",
  "events",
  "availability",
  "lineups",
  "match_stats",
  "push_preferences",
  "availability_reminder_log",
];

try {
  await db.unsafe(sql);

  const policies = await db`
    select tablename, policyname, cmd, roles
    from pg_policies
    where schemaname = 'public'
      and tablename = any(${expectedTables})
    order by tablename, policyname
  `;

  const rls = await db`
    select c.relname as table_name, c.relrowsecurity as rls_enabled
    from pg_class c
    join pg_namespace n on n.oid = c.relnamespace
    where n.nspname = 'public'
      and c.relkind = 'r'
      and c.relname = any(${expectedTables})
    order by c.relname
  `;

  console.log("✅ Migration uitgevoerd zonder fouten.\n");
  console.log("RLS status:");
  for (const row of rls) {
    console.log(`  - ${row.table_name}: ${row.rls_enabled ? "enabled" : "DISABLED"}`);
  }

  console.log("\nPolicies per tabel:");
  let current = null;
  for (const row of policies) {
    if (row.tablename !== current) {
      current = row.tablename;
      console.log(`\n  ${current}`);
    }
    const roles = Array.isArray(row.roles) ? row.roles.join(",") : row.roles;
    console.log(`    - ${row.policyname} (${row.cmd}) [${roles}]`);
  }

  const tablesWithoutPolicies = expectedTables.filter(
    (table) => !policies.some((p) => p.tablename === table)
  );

  if (tablesWithoutPolicies.length > 0) {
    console.error(
      `\n❌ Tabellen zonder policies: ${tablesWithoutPolicies.join(", ")}`
    );
    process.exit(1);
  }

  const rlsOff = rls.filter((row) => !row.rls_enabled);
  if (rlsOff.length > 0) {
    console.error(
      `\n❌ RLS niet aan op: ${rlsOff.map((r) => r.table_name).join(", ")}`
    );
    process.exit(1);
  }

  console.log(
    `\n✅ Alle ${expectedTables.length} tabellen hebben RLS + minstens 1 policy.`
  );
  console.log(
    "Security Advisor: ververs in Supabase Dashboard → Advisors → Security."
  );
  console.log(
    '"RLS Enabled No Policy" zou weg moeten zijn voor deze tabellen.'
  );
} catch (error) {
  console.error("❌ RLS policies migratie mislukt:", error.message);
  process.exit(1);
} finally {
  await db.end();
}
