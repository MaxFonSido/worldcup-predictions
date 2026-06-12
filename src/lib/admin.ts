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
