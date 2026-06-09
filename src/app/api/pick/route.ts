import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const VALID = new Set(["TEAM_A", "TEAM_B", "DRAW"]);

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const matchId = (body?.matchId ?? "").toString();
  const pick = (body?.pick ?? "").toString();

  if (!matchId || !VALID.has(pick)) {
    return NextResponse.json({ error: "bad" }, { status: 400 });
  }

  const supabase = db();

  const { data: match } = await supabase
    .from("matches")
    .select("id, kickoff_utc, status")
    .eq("id", matchId)
    .maybeSingle();

  if (!match) return NextResponse.json({ error: "notFound" }, { status: 404 });

  // Lock the moment the match kicks off (uses our stored time, not the live feed,
  // so locking stays reliable even if the feed is down).
  const locked =
    new Date(match.kickoff_utc).getTime() <= Date.now() ||
    !["SCHEDULED", "TIMED"].includes(match.status);

  if (locked) return NextResponse.json({ error: "locked" }, { status: 403 });

  const { error } = await supabase.from("predictions").upsert(
    {
      user_id: session.userId,
      match_id: matchId,
      pick,
      updated_at: new Date().toISOString()
    },
    { onConflict: "user_id,match_id" }
  );

  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
