import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const supabase = db();
  if (!(await isAdmin(supabase, session.displayName))) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  const body = await req.json().catch(() => null);
  const enabled = !!body?.enabled;

  const { error } = await supabase
    .from("app_meta")
    .upsert({ key: "mascot_enabled", value: enabled ? "true" : "false" }, { onConflict: "key" });
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
