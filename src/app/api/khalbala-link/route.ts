import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
import { db } from "@/lib/db";
import { SignJWT } from "jose";

export async function GET() {
  const session = await getSession();
  if (!session) {
    return NextResponse.json({ error: "Not logged in" }, { status: 401 });
  }

  const sharedSecret = process.env.KHALBALA_SHARED_SECRET;
  const khalBalaUrl = process.env.KHALBALA_URL;
  if (!sharedSecret || !khalBalaUrl) {
    return NextResponse.json({ error: "Khal Bala not configured" }, { status: 500 });
  }

  // Look up the user's avatar_emoji from the users table
  const supabase = db();
  const { data: me } = await supabase
    .from("users")
    .select("avatar_emoji")
    .eq("id", session.userId)
    .maybeSingle();

  const secret = new TextEncoder().encode(sharedSecret);

  const token = await new SignJWT({
    displayName: session.displayName,
    avatarEmoji: me?.avatar_emoji ?? null,
  })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  const url = `${khalBalaUrl}/api/enter?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ url });
}
