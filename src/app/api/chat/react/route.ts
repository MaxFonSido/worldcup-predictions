import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const ALLOWED = new Set(["👍", "❤️", "😂", "🔥", "⚽", "🎉"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const payload = await req.json().catch(() => null);
  const messageId = (payload?.messageId ?? "").toString().trim();
  const emoji = (payload?.emoji ?? "").toString().trim();

  if (!messageId || !emoji || !ALLOWED.has(emoji)) {
    return NextResponse.json({ error: "invalid" }, { status: 400 });
  }

  const supabase = db();

  // Check if this user already reacted to this message
  const { data: existing } = await supabase
    .from("reactions")
    .select("id, emoji")
    .eq("message_id", messageId)
    .eq("user_id", session.userId)
    .maybeSingle();

  if (existing) {
    if (existing.emoji === emoji) {
      // Same emoji — toggle off (remove reaction)
      await supabase.from("reactions").delete().eq("id", existing.id);
    } else {
      // Different emoji — change reaction
      await supabase.from("reactions").update({ emoji }).eq("id", existing.id);
    }
  } else {
    // New reaction
    await supabase.from("reactions").insert({
      message_id: messageId,
      user_id: session.userId,
      emoji
    });
  }

  return NextResponse.json({ ok: true });
}
