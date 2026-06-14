import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";
import ChatRoom from "@/components/ChatRoom";
import { markChatRead } from "@/lib/chat";

export const dynamic = "force-dynamic";

export default async function ChatPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [{ data: msgs }, { data: users }, { data: reactions }] = await Promise.all([
    supabase.from("messages").select("id, user_id, body, created_at").order("created_at", { ascending: true }).limit(200),
    supabase.from("users").select("id, display_name"),
    supabase.from("reactions").select("message_id, user_id, emoji")
  ]);
  const nameById = new Map((users ?? []).map((u) => [u.id, u.display_name as string]));

  // Group reactions by message_id
  const rxnMap = new Map<string, { emoji: string; user_id: string; name: string }[]>();
  for (const r of reactions ?? []) {
    const mid = r.message_id as string;
    if (!rxnMap.has(mid)) rxnMap.set(mid, []);
    rxnMap.get(mid)!.push({
      emoji: r.emoji as string,
      user_id: r.user_id as string,
      name: nameById.get(r.user_id as string) ?? "?"
    });
  }

  // Opening the chat marks it read for this user (clears the unread dot).
  await markChatRead(supabase, session.userId);

  const initial = (msgs ?? []).map((m) => ({
    id: m.id as string,
    user_id: m.user_id as string,
    name: nameById.get(m.user_id as string) ?? "?",
    body: m.body as string,
    created_at: m.created_at as string,
    reactions: rxnMap.get(m.id as string) ?? []
  }));

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="chat" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.chatTitle}</h1>
        <ChatRoom
          myUserId={session.userId}
          lang={lang}
          initial={initial}
          labels={{ placeholder: tr.chatPlaceholder, send: tr.chatSend, empty: tr.chatEmpty, react: tr.chatReact }}
        />
      </main>
    </>
  );
}
