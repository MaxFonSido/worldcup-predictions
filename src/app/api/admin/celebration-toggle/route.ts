import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

// V41 — accepts { enabled?: boolean, videoId?: string } and upserts the
// matching app_meta keys. Same auth pattern as the other admin toggles.
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const supabase = db();
  if (!(await isAdmin(supabase, session.displayName))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  if (!body) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const rows: { key: string; value: string }[] = [];
  if (typeof body.enabled === "boolean") {
    rows.push({ key: "celebration_video_visible", value: body.enabled ? "true" : "false" });
  }
  if (typeof body.videoId === "string") {
    rows.push({ key: "celebration_video_id_shark", value: body.videoId.trim() });
  }
  if (rows.length === 0) return NextResponse.json({ error: "bad-request" }, { status: 400 });

  const { error } = await supabase.from("app_meta").upsert(rows, { onConflict: "key" });
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
