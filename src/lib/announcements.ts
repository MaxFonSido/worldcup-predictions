import type { SupabaseClient } from "@supabase/supabase-js";
import { getChampionLock } from "@/lib/champion";

export type Announcements = {
  poolOpen: boolean;
  poolJoined: boolean;
  poolClosesAt: string | null;
  championOpen: boolean; // only true when picks have been explicitly reopened
  championClosesAt: string | null;
};

// One place that gathers everything worth announcing, so the whole app shows a single
// tidy strip instead of a separate banner per feature.
export async function getAnnouncements(
  supabase: SupabaseClient,
  userId: string
): Promise<Announcements> {
  const [{ data: poolMeta }, { data: entry }, lock] = await Promise.all([
    supabase.from("app_meta").select("value").eq("key", "pool_closes_at").maybeSingle(),
    supabase.from("pool_entries").select("id").eq("user_id", userId).maybeSingle(),
    getChampionLock(supabase)
  ]);

  const poolClosesAt = (poolMeta?.value as string | null) ?? null;
  const poolOpen = poolClosesAt ? Date.now() < new Date(poolClosesAt).getTime() : false;

  return {
    poolOpen,
    poolJoined: !!entry,
    poolClosesAt,
    championOpen: lock.reopened,
    championClosesAt: lock.closesAt
  };
}
