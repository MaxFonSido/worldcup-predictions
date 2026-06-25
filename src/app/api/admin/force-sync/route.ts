import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { db } from "@/lib/db";
import { syncMatches } from "@/lib/football";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ ok: false, error: "Unauthorized" }, { status: 401 });

  const supabase = db();
  if (!(await isAdmin(supabase, session.displayName))) {
    return NextResponse.json({ ok: false, error: "Forbidden" }, { status: 403 });
  }

  try {
    // Reset last_sync so syncIfStale won't throttle future syncs
    await supabase
      .from("app_meta")
      .upsert({ key: "last_sync", value: new Date(0).toISOString() }, { onConflict: "key" });

    const { updated } = await syncMatches();
    return NextResponse.json({ ok: true, updated });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
