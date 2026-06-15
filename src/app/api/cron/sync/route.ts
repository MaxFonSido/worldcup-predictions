import { NextResponse } from "next/server";
import { syncMatches } from "@/lib/football";
import { fixStuckMatches } from "@/lib/espn-backup";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Accept auth via header (Vercel cron) OR query param (external cron services)
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const valid =
    auth === `Bearer ${process.env.CRON_SECRET}` ||
    secret === process.env.CRON_SECRET;

  if (!valid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const result = await syncMatches();
    const espnFixed = await fixStuckMatches().catch(() => 0);
    return NextResponse.json({ ok: true, ...result, espnFixed });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
