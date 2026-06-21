import type { SupabaseClient } from "@supabase/supabase-js";

// The organizer's display name is stored in app_meta under "admin_name".
export async function getAdminName(supabase: SupabaseClient): Promise<string | null> {
  const { data } = await supabase.from("app_meta").select("value").eq("key", "admin_name").maybeSingle();
  return (data?.value as string | null) ?? null;
}

export async function isAdmin(supabase: SupabaseClient, displayName: string): Promise<boolean> {
  const name = await getAdminName(supabase);
  return !!name && name === displayName;
}

// New sign-ups (registration of brand-new names) can be turned off by the
// organizer once the tournament is underway. Existing users always log in.
export async function isRegistrationOpen(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.from("app_meta").select("value").eq("key", "registration_open").maybeSingle();
  return (data?.value ?? "true") !== "false"; // default: open
}

// Khal Bala banner visibility — only admin sees it until toggled on
export async function isKhalBalaVisible(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.from("app_meta").select("value").eq("key", "khalbala_visible").maybeSingle();
  return data?.value === "true"; // default: hidden
}

// Champion picking — fully manual switch, set by the organizer. Replaces the old
// kickoff-based auto-lock for this feature. Default: closed, until toggled on.
export async function isChampionPickingEnabled(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.from("app_meta").select("value").eq("key", "champion_picking_enabled").maybeSingle();
  return data?.value === "true"; // default: closed
}

// Waving flag background (July 4th) — fully manual switch, no dates involved.
export async function isFlagSeasonEnabled(supabase: SupabaseClient): Promise<boolean> {
  const { data } = await supabase.from("app_meta").select("value").eq("key", "flag_season_enabled").maybeSingle();
  return data?.value === "true"; // default: off
}
