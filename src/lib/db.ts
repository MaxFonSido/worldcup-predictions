import { createClient, SupabaseClient } from "@supabase/supabase-js";

// IMPORTANT: Do NOT cache the client as a singleton.
// A fresh client is created per request so that Vercel's Data Cache
// is bypassed and every DB read returns live data.
export function db(): SupabaseClient {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !key) {
    throw new Error("Missing SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY");
  }
  return createClient(url, key, {
    auth: { persistSession: false },
    global: {
      fetch: (input, init) => fetch(input, { ...init, cache: "no-store" }),
    },
  });
}

// Total matches in the 2026 World Cup — each player starts with this many picks.
export const TOTAL_MATCHES = 104;
