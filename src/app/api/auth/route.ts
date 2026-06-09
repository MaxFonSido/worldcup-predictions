import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const body = await req.json().catch(() => null);
  const displayName = (body?.displayName ?? "").toString().trim();
  const pin = (body?.pin ?? "").toString().trim();
  const language = body?.language === "fa" ? "fa" : "en";

  if (!displayName) return NextResponse.json({ error: "badName" }, { status: 400 });
  if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "badPin" }, { status: 400 });

  const supabase = db();

  // Exact-name lookup (display name is the permanent identifier).
  const { data: existing } = await supabase
    .from("users")
    .select("id, display_name, pin_hash")
    .eq("display_name", displayName)
    .maybeSingle();

  let userId: string;

  if (existing) {
    const ok = await bcrypt.compare(pin, existing.pin_hash);
    if (!ok) return NextResponse.json({ error: "wrongPin" }, { status: 401 });
    userId = existing.id;
    await supabase.from("users").update({ language }).eq("id", userId);
  } else {
    const pin_hash = await bcrypt.hash(pin, 10);
    const { data: created, error } = await supabase
      .from("users")
      .insert({ display_name: displayName, pin_hash, language })
      .select("id")
      .single();
    if (error || !created) {
      return NextResponse.json({ error: "server" }, { status: 500 });
    }
    userId = created.id;
  }

  await createSession({ userId, displayName });

  // Remember language for the layout direction (readable by the client toggle).
  cookies().set("lang", language, { path: "/", maxAge: 60 * 60 * 24 * 365 });

  return NextResponse.json({ ok: true });
}
