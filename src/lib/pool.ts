import type { SupabaseClient } from "@supabase/supabase-js";

export const POOL_FEE = 20;

export type PoolStatus = { closesAt: string | null; open: boolean; joined: boolean };

// Reads the signup window (app_meta "pool_closes_at") and whether this user has joined.
export async function getPoolStatus(supabase: SupabaseClient, userId: string): Promise<PoolStatus> {
  const [{ data: meta }, { data: entry }] = await Promise.all([
    supabase.from("app_meta").select("value").eq("key", "pool_closes_at").maybeSingle(),
    supabase.from("pool_entries").select("id").eq("user_id", userId).maybeSingle()
  ]);
  const closesAt = (meta?.value as string | null) ?? null;
  const open = closesAt ? Date.now() < new Date(closesAt).getTime() : false;
  return { closesAt, open, joined: !!entry };
}
