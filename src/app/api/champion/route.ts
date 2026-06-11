import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getParticipants } from "@/lib/champion";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const pick = (body?.pick ?? "").toString().trim();

  const supabase = db();

  // Only allow a real participating country (prevents arbitrary input).
  const participants = await getParticipants(supabase);
  if (!participants.includes(pick)) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const { error } = await supabase
    .from("users")
    .update({ champion_pick: pick })
    .eq("id", session.userId);

  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
