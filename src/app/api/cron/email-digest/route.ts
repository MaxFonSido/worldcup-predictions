import { NextResponse } from "next/server";
import { sendMorningDigest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }
  try {
    const sent = await sendMorningDigest();
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
