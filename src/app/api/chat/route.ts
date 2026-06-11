import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const MAX_LEN = 500;

async function recentMessages() {
  const supabase = db();
  const [{ data: msgs }, { data: users }] = await Promise.all([
    supabase
      .from("messages")
      .select("id, user_id, body, created_at")
      .order("created_at", { ascending: true })
      .limit(200),
    supabase.from("users").select("id, display_name")
  ]);
  const nameById = new Map((users ?? []).map((u) => [u.id, u.display_name as string]));
  return (msgs ?? []).map((m) => ({
    id: m.id as string,
    user_id: m.user_id as string,
    name: nameById.get(m.user_id as string) ?? "?",
    body: m.body as string,
    created_at: m.created_at as string
  }));
}

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });
  const messages = await recentMessages();
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

  const messages = await recentMessages();
  return NextResponse.json({ ok: true, messages });
}
