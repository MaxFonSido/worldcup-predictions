import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { sendMorningDigest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const supabase = db();
  const admin = await isAdmin(supabase, session.displayName);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const meOnly = body?.meOnly === true;

  try {
    let sent: number;
    if (meOnly) {
      // Get admin's email
      const { data: me } = await supabase
        .from("users")
        .select("email")
        .eq("id", session.userId)
        .maybeSingle();
      if (!me?.email) return NextResponse.json({ error: "You have no email subscribed" }, { status: 400 });
      sent = await sendMorningDigest(me.email as string);
    } else {
      sent = await sendMorningDigest();
    }
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
