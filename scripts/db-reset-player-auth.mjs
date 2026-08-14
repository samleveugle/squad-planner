/**
 * Reset auth voor één speler zodat hij opnieuw kan registreren.
 * Usage: node --use-system-ca scripts/db-reset-player-auth.mjs <email>
 */
import { createClient } from "@supabase/supabase-js";

import "./load-env.mjs";

const email = process.argv[2]?.trim().toLowerCase();

if (!email) {
  console.error("\nUsage: node --use-system-ca scripts/db-reset-player-auth.mjs <email>\n");
  process.exit(1);
}

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error("\n❌ NEXT_PUBLIC_SUPABASE_URL of SUPABASE_SERVICE_ROLE_KEY ontbreekt in .env.local\n");
  process.exit(1);
}

const admin = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

console.log(`\nAuth reset voor: ${email}\n`);

const { data: player, error: playerError } = await admin
  .from("players")
  .select("id, name, email, auth_user_id")
  .eq("email", email)
  .maybeSingle();

if (playerError) {
  console.error("❌ Speler opzoeken mislukt:", playerError.message);
  process.exit(1);
}

if (!player) {
  console.error("❌ Geen speler gevonden met dit e-mailadres in players.");
  process.exit(1);
}

console.log(`Speler: ${player.name} (${player.id})`);
console.log(`Huidige auth_user_id: ${player.auth_user_id ?? "(leeg)"}`);

const authUserIds = new Set();

if (player.auth_user_id) {
  authUserIds.add(player.auth_user_id);
}

const { data: authList, error: listError } = await admin.auth.admin.listUsers({
  page: 1,
  perPage: 1000,
});

if (listError) {
  console.error("❌ Auth users ophalen mislukt:", listError.message);
  process.exit(1);
}

for (const user of authList.users) {
  if (user.email?.trim().toLowerCase() === email) {
    authUserIds.add(user.id);
  }
}

for (const authUserId of authUserIds) {
  const { error: deleteError } = await admin.auth.admin.deleteUser(authUserId);
  if (deleteError) {
    console.error(`❌ Auth user ${authUserId} verwijderen mislukt:`, deleteError.message);
    process.exit(1);
  }
  console.log(`✅ Auth user verwijderd: ${authUserId}`);
}

if (authUserIds.size === 0) {
  console.log("ℹ️  Geen auth user gevonden in Supabase Auth (alleen players-koppeling wordt gewist).");
}

const { error: updateError } = await admin
  .from("players")
  .update({ auth_user_id: null })
  .eq("id", player.id);

if (updateError) {
  console.error("❌ auth_user_id wissen mislukt:", updateError.message);
  process.exit(1);
}

console.log("✅ players.auth_user_id gewist");
console.log(`\n${player.name} kan nu opnieuw registreren via /register\n`);
