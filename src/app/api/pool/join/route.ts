import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getPoolStatus } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "auth" }, { status: 401 });

  const supabase = db();
  const status = await getPoolStatus(supabase, session.userId);
  if (!status.open) return NextResponse.json({ error: "closed" }, { status: 403 });
  if (status.joined) return NextResponse.json({ error: "already" }, { status: 400 });

  const body = await req.json().catch(() => null);
  const firstName = (body?.firstName ?? "").toString().trim().slice(0, 40);
  const lastName = (body?.lastName ?? "").toString().trim().slice(0, 40);
  if (!firstName || !lastName) return NextResponse.json({ error: "badName" }, { status: 400 });
  const realName = `${firstName} ${lastName}`;

  const { error } = await supabase
    .from("pool_entries")
    .insert({ user_id: session.userId, real_name: realName, paid: false });
  if (error) return NextResponse.json({ error: "server" }, { status: 500 });
  return NextResponse.json({ ok: true });
}
