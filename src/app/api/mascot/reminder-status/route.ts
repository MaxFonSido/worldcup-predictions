import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

const URGENT_WINDOW_MS = 6 * 60 * 60 * 1000; // 6 hours

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ status: "none" });

  const supabase = db();
  const nowIso = new Date().toISOString();

  // Open matches = kickoff still in the future (picks lock at kickoff).
  const [{ data: openMatches }, { data: myPicks }] = await Promise.all([
    supabase.from("matches").select("id, kickoff_utc").gt("kickoff_utc", nowIso),
    supabase.from("predictions").select("match_id").eq("user_id", session.userId),
  ]);

  if (!openMatches || openMatches.length === 0) {
    return NextResponse.json({ status: "none" });
  }

  const pickedIds = new Set((myPicks ?? []).map((p) => p.match_id as string));
  const unpicked = openMatches.filter((m) => !pickedIds.has(m.id as string));

  if (unpicked.length === 0) {
    return NextResponse.json({ status: "none" });
  }

  const now = Date.now();
  const nearestMs = Math.min(
    ...unpicked.map((m) => new Date(m.kickoff_utc as string).getTime() - now)
  );

  const status = nearestMs <= URGENT_WINDOW_MS ? "urgent" : "gentle";
  return NextResponse.json({ status, unpickedCount: unpicked.length });
}
