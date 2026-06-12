import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import bcrypt from "bcryptjs";
import { db } from "@/lib/db";
import { createSession } from "@/lib/session";
import { isRegistrationOpen } from "@/lib/admin";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  try {
    const body = await req.json().catch(() => null);
    const displayName = (body?.displayName ?? "").toString().trim();
    const pin = (body?.pin ?? "").toString().trim();
    const language = body?.language === "fa" ? "fa" : "en";

    if (!displayName) return NextResponse.json({ error: "badName" }, { status: 400 });
    if (!/^\d{4}$/.test(pin)) return NextResponse.json({ error: "badPin" }, { status: 400 });

    const supabase = db();

    const { data: existing, error: lookupError } = await supabase
      .from("users")
      .select("id, display_name, pin_hash")
      .eq("display_name", displayName)
      .maybeSingle();

    if (lookupError) {
      return NextResponse.json({ error: "DB read: " + lookupError.message }, { status: 500 });
    }

    let userId: string;

    if (existing) {
      const ok = await bcrypt.compare(pin, existing.pin_hash);
      if (!ok) return NextResponse.json({ error: "wrongPin" }, { status: 401 });
      userId = existing.id;
      await supabase.from("users").update({ language }).eq("id", userId);
    } else {
      // New name = a sign-up. Blocked once the organizer closes sign-ups.
      if (!(await isRegistrationOpen(supabase))) {
        return NextResponse.json({ error: "regClosed" }, { status: 403 });
      }
      const pin_hash = await bcrypt.hash(pin, 10);
      const { data: created, error: insertError } = await supabase
        .from("users")
        .insert({ display_name: displayName, pin_hash, language })
        .select("id")
        .single();
      if (insertError || !created) {
        return NextResponse.json(
          { error: "DB write: " + (insertError?.message || "no row returned") },
          { status: 500 }
        );
      }
      userId = created.id;
    }

    await createSession({ userId, displayName });
    cookies().set("lang", language, { path: "/", maxAge: 60 * 60 * 24 * 365 });
    return NextResponse.json({ ok: true });
  } catch (e: any) {
    return NextResponse.json({ error: "Crash: " + (e?.message || String(e)) }, { status: 500 });
  }
}
