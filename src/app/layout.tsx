import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { headers } from "next/headers";
import { getLang, dir } from "@/lib/i18n";
import { isNight } from "@/lib/theme";
import { db } from "@/lib/db";
import { isFlagSeasonEnabled } from "@/lib/admin";
import FlagWaveBackground from "@/components/FlagWaveBackground";
import "./globals.css";

// Vazirmatn covers both Persian and Latin scripts beautifully — one font, both languages.
const vazir = Vazirmatn({
  subsets: ["arabic", "latin"],
  display: "swap",
  variable: "--font-vazir"
});

export const metadata: Metadata = {
  title: "World Cup Predictions",
  description: "Family World Cup 2026 prediction game"
};

export const viewport: Viewport = {
  themeColor: "#0E7A4F",
  width: "device-width",
  initialScale: 1
};

export default async function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();

  // Approximate location from the request (set by the host) — no GPS permission needed.
  const h = headers();
  const lat = parseFloat(h.get("x-vercel-ip-latitude") ?? "");
  const lng = parseFloat(h.get("x-vercel-ip-longitude") ?? "");
  const tz = h.get("x-vercel-ip-timezone");
  const dark = isNight(
    Number.isFinite(lat) ? lat : null,
    Number.isFinite(lng) ? lng : null,
    tz
  );

  // Flag background — manual switch from Admin, applies to every page from here.
  const flagOn = await isFlagSeasonEnabled(db());

  return (
    <html
      lang={lang}
      dir={dir(lang)}
      className={`${vazir.variable}${dark ? " dark" : ""}`}
    >
      <body className="font-sans has-bottom-nav">
        {flagOn && <FlagWaveBackground />}
        {children}
      </body>
    </html>
  );
}
