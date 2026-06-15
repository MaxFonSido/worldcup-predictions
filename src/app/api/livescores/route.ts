import { NextResponse } from "next/server";
import { fetchLiveScores } from "@/lib/livescores";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const matches = await fetchLiveScores();
  return NextResponse.json({ matches });
}
