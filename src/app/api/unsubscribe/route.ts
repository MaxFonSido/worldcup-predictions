import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { verifyUnsub } from "@/lib/email";

export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function GET(req: Request) {
  const url = new URL(req.url);
  const uid = url.searchParams.get("uid") ?? "";
  const tok = url.searchParams.get("tok") ?? "";

  if (!uid || !tok || !verifyUnsub(uid, tok)) {
    return new Response(page("Invalid link", "This unsubscribe link isn't valid."), {
      status: 400,
      headers: { "Content-Type": "text/html" }
    });
  }

  await db().from("users").update({ email: null }).eq("id", uid);

  return new Response(
    page("Unsubscribed", "You've been unsubscribed from match reminders. You can resubscribe anytime from the app."),
    { status: 200, headers: { "Content-Type": "text/html" } }
  );
}

function page(title: string, msg: string): string {
  return `<!DOCTYPE html><html><head><meta charset="UTF-8"><meta name="viewport" content="width=device-width,initial-scale=1">
<title>${title}</title></head><body style="font-family:-apple-system,sans-serif;display:flex;align-items:center;justify-content:center;min-height:100vh;background:#F4F1E8;margin:0">
<div style="text-align:center;padding:40px"><div style="font-size:24px;font-weight:800;color:#0B5138">${title}</div>
<p style="color:#6B7A70;margin-top:8px">${msg}</p></div></body></html>`;
}
