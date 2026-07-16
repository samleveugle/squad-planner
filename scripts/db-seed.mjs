import { createClient } from "@supabase/supabase-js";

import { EVENTS, PLAYERS } from "../src/lib/mock-data.js";
import { getPlayerEmail } from "../src/lib/players-db.js";

import "./load-env.mjs";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

if (!supabaseUrl || !serviceRoleKey) {
  console.error(
    "\n❌ NEXT_PUBLIC_SUPABASE_URL en SUPABASE_SERVICE_ROLE_KEY zijn verplicht in .env.local\n"
  );
  process.exit(1);
}

const supabase = createClient(supabaseUrl, serviceRoleKey, {
  auth: { persistSession: false, autoRefreshToken: false },
});

function mapPlayer(player) {
  return {
    id: player.id,
    name: player.name,
    is_admin: player.isAdmin,
    is_squad_player: player.isSquadPlayer,
    email: getPlayerEmail(player.id),
    auth_user_id: null,
  };
}

function mapEvent(event) {
  return {
    id: event.id,
    type: event.type,
    date: event.date,
    time: event.time ?? null,
    location: event.location,
    is_home: event.type === "match" ? event.isHome : null,
    opponent: event.opponent ?? null,
  };
}

async function upsertBatch(table, rows, onConflict) {
  const chunkSize = 100;

  for (let index = 0; index < rows.length; index += chunkSize) {
    const chunk = rows.slice(index, index + chunkSize);
    const { error } = await supabase.from(table).upsert(chunk, { onConflict });

    if (error) {
      throw new Error(`${table}: ${error.message}`);
    }
  }
}

console.log("Spelers en events laden in Supabase...");

try {
  await upsertBatch("players", PLAYERS.map(mapPlayer), "id");
  console.log(`✅ ${PLAYERS.length} spelers`);

  await upsertBatch("events", EVENTS.map(mapEvent), "id");
  console.log(`✅ ${EVENTS.length} events (trainingen + wedstrijden)`);

  console.log("\nKlaar! Check Supabase → Table Editor → players / events");
} catch (error) {
  if (error.message.includes("Could not find the table")) {
    console.error(
      "\n❌ Tabellen bestaan nog niet. Draai eerst:\n   npm run db:migrate\n"
    );
  } else if (error.cause?.code === "UNABLE_TO_VERIFY_LEAF_SIGNATURE") {
    console.error(
      "\n❌ SSL-fout bij verbinding met Supabase.\n" +
        "   Draai: npm run db:seed (gebruikt --use-system-ca automatisch)\n"
    );
  } else {
    console.error("\n❌ Seed mislukt:", error.message);
  }
  process.exit(1);
}
