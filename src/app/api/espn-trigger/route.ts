import { NextResponse } from "next/server";
import { syncMatches } from "@/lib/football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// Called by the client-side ESPN poller when it detects a match just finished.
// No secret needed — worst case someone triggers an extra sync, which is harmless.
// Retries are handled client-side every 2 minutes so we stay within Vercel timeouts.
export async function POST() {
  try {
    const result = await syncMatches();
    return NextResponse.json({ ok: true, ...result });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
