import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isAdmin } from "@/lib/admin";
import { sendMorningDigest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const admin = await isAdmin(db(), session.displayName);
  if (!admin) return NextResponse.json({ error: "forbidden" }, { status: 403 });

  try {
    const sent = await sendMorningDigest();
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
