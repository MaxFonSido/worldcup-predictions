import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { hasUnreadChat } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ unread: false }, { status: 200 });
  const unread = await hasUnreadChat(db(), session.userId);
  return NextResponse.json({ unread });
}
