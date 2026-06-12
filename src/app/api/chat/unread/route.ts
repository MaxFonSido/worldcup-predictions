import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { unreadChatCount } from "@/lib/chat";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ count: 0 }, { status: 200 });
  const count = await unreadChatCount(db(), session.userId);
  return NextResponse.json({ count });
}
