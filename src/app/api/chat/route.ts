import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { markChatRead } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEN = 500;

async function recentMessages() {
  const supabase = db();
  const [{ data: msgs }, { data: users }, { data: reactions }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, user_id, body, created_at")
      .order("created_at", { ascending: true })
      .limit(200),
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

  return (msgs ?? []).map((m) => ({
    id: m.id as string,
    user_id: m.user_id as string,
    name: nameById.get(m.user_id as string) ?? "?",
    body: m.body as string,
    created_at: m.created_at as string,
    reactions: rxnMap.get(m.id as string) ?? []
  }));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const messages = await recentMessages();
  await markChatRead(db(), session.userId);
  return NextResponse.json({ messages });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  const body = (payload?.body ?? "").toString().trim().slice(0, MAX_LEN);
  if (!body) return NextResponse.json({ error: "empty" }, { status: 400 });

  const supabase = db();
  const { error } = await supabase.from("messages").insert({ user_id: session.userId, body });
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });

  await markChatRead(supabase, session.userId);
  const messages = await recentMessages();
  return NextResponse.json({ ok: true, messages });
}
