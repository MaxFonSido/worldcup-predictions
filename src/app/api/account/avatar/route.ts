import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { AVATARS } from "@/lib/avatar";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "unauthorized" }, { status: 401 });

  const { emoji } = await req.json();

  // Validate: must be one of the allowed emojis, or null to reset
  if (emoji !== null && !AVATARS.includes(emoji)) {
    return NextResponse.json({ error: "invalid emoji" }, { status: 400 });
  }

  const { error } = await db()
    .from("users")
    .update({ avatar_emoji: emoji })
    .eq("id", session.userId);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  return NextResponse.json({ ok: true });
}
