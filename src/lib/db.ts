import { createClient, SupabaseClient } from "@supabase/supabase-js";

// All database access happens on the server with the service-role key.
// This key is secret and must never be exposed to the browser.
let client: SupabaseClient | null = null;

export function db(): SupabaseClient {
  if (client) return client;
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  client = createClient(url, key, { auth: { persistSession: false } });
  return client;
}

// Total matches in the 2026 World Cup — each player starts with this many picks.
export const TOTAL_MATCHES = 104;
