import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { getAnnouncements } from "@/lib/announcements";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({
      poolOpen: false,
      poolJoined: false,
      poolClosesAt: null,
      championOpen: false,
      championClosesAt: null
    });
  }
  return NextResponse.json(await getAnnouncements(db(), session.userId));
}
