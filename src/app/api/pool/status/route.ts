import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getPoolStatus } from "@/lib/pool";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ open: false, joined: false, closesAt: null });
  const status = await getPoolStatus(db(), session.userId);
  return NextResponse.json(status);
}
