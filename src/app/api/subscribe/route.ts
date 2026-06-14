import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { sendWelcomeEmail } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const body = await req.json().catch(() => null);
  const email = (body?.email ?? "").toString().trim().toLowerCase();

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "invalid email" }, { status: 400 });
  }

  await db().from("users").update({ email }).eq("id", session.userId);

  // Send welcome email — await it so Vercel doesn't cut it off
  await sendWelcomeEmail(session.userId, email).catch(() => {});

  return NextResponse.json({ ok: true });
}

// DELETE = unsubscribe (from within the app)
export async function DELETE() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  await db().from("users").update({ email: null }).eq("id", session.userId);

  return NextResponse.json({ ok: true });
}
