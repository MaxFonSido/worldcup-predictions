import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
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
  const userId = (body?.userId ?? "").toString();
  const newPin = (body?.newPin ?? "").toString().trim();
  if (!/^\d{4}$/.test(newPin)) return NextResponse.json({ error: "badPin" }, { status: 400 });

  // Reset = update the PIN only. Picks, points, and the account all stay intact.
  const pin_hash = await bcrypt.hash(newPin, 10);
  const { error } = await supabase.from("users").update({ pin_hash }).eq("id", userId);
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
