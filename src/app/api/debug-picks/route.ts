import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const supabase = db();

  const [
    { data: allPicks, error: picksError },
    { data: myPicks, error: myPicksError },
    { data: matches, error: matchesError },
  ] = await Promise.all([
    supabase.from("predictions").select("match_id, user_id, pick"),
    supabase.from("predictions").select("match_id, pick").eq("user_id", session.userId),
    supabase.from("matches").select("id, team_a, team_b, status, kickoff_utc").order("kickoff_utc", { ascending: true }),
  ]);

  return NextResponse.json({
    session: { userId: session.userId, displayName: session.displayName },
    allPicksCount: allPicks?.length ?? null,
    allPicksError: picksError?.message ?? null,
    myPicksCount: myPicks?.length ?? null,
    myPicksError: myPicksError?.message ?? null,
    myPicks: myPicks ?? [],
    matchesCount: matches?.length ?? null,
    matchesError: matchesError?.message ?? null,
  });
}
