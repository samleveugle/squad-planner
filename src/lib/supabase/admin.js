import { createClient } from "@supabase/supabase-js";

import { useSystemCertificates } from "@/lib/node-ssl";

useSystemCertificates();

let adminClient;

export function createAdminClient() {
  if (adminClient) {
    return adminClient;
  }

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL?.trim();
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY?.trim();

  if (!supabaseUrl || !serviceRoleKey) {
    throw new Error(
      "Supabase admin env vars ontbreken. Zet SUPABASE_SERVICE_ROLE_KEY in .env.local (alleen server-side gebruiken)."
    );
  }

  adminClient = createClient(supabaseUrl, serviceRoleKey, {
    auth: { persistSession: false, autoRefreshToken: false },
  });

  return adminClient;
}
