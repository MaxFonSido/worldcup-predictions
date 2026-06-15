import { NextResponse } from "next/server";
import { sendMorningDigest } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  // Accept auth via header (Vercel cron) OR query param (external cron)
  const auth = req.headers.get("authorization");
  const url = new URL(req.url);
  const secret = url.searchParams.get("secret");
  const valid =
    auth === `Bearer ${process.env.CRON_SECRET}` ||
    secret === process.env.CRON_SECRET;

  if (!valid) {
    return NextResponse.json({ error: "forbidden" }, { status: 403 });
  }

  try {
    const sent = await sendMorningDigest();
    return NextResponse.json({ ok: true, sent });
  } catch (e) {
    return NextResponse.json({ ok: false, error: String(e) }, { status: 500 });
  }
}
