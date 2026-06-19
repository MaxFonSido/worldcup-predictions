import { NextResponse } from "next/server";
import { getSession } from "@/lib/session";
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

  const secret = new TextEncoder().encode(sharedSecret);

  // Sign a short-lived token (5 minutes) with the user's display name
  const token = await new SignJWT({ displayName: session.displayName })
    .setProtectedHeader({ alg: "HS256" })
    .setIssuedAt()
    .setExpirationTime("5m")
    .sign(secret);

  const url = `${khalBalaUrl}/api/enter?token=${encodeURIComponent(token)}`;
  return NextResponse.json({ url });
}
