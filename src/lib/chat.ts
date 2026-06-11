import type { SupabaseClient } from "@supabase/supabase-js";

// Is there a chat message newer than the last time this user opened the chat?
export async function hasUnreadChat(supabase: SupabaseClient, userId: string): Promise<boolean> {
  const [{ data: latest }, { data: user }] = await Promise.all([
    supabase.from("messages").select("created_at").order("created_at", { ascending: false }).limit(1),
    supabase.from("users").select("chat_last_read_at").eq("id", userId).single()
  ]);
  const latestAt = latest && latest.length ? new Date(latest[0].created_at as string).getTime() : null;
  if (latestAt === null) return false;
  const lastRead = user?.chat_last_read_at ? new Date(user.chat_last_read_at as string).getTime() : 0;
  return latestAt > lastRead;
}

// Mark the chat as read up to now for this user.
export async function markChatRead(supabase: SupabaseClient, userId: string): Promise<void> {
  await supabase.from("users").update({ chat_last_read_at: new Date().toISOString() }).eq("id", userId);
}
