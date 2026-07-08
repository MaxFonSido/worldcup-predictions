import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { headers } from "next/headers";
import { getLang, dir } from "@/lib/i18n";
import { isNight } from "@/lib/theme";
import { db } from "@/lib/db";
import { getSession } from "@/lib/session";
import { isFlagSeasonEnabled, isAdmin, isMascotEnabled, isRibbonEnabled, isCelebrationVideoEnabled, getCelebrationVideoId } from "@/lib/admin";
import FlagWaveBackground from "@/components/FlagWaveBackground";
import MascotPeek from "@/components/MascotPeek";
import MourningRibbon from "@/components/MourningRibbon";
import CelebrationVideo from "@/components/CelebrationVideo";
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

  // CR7 reminder mascot — app-wide, logged-in users only, admin-gated toggle.
  // Mourning ribbon — same gating pattern.
  const session = await getSession();
  let showMascot = false;
  let showRibbon = false;
  let celebrationId = "";
  let celebrationOn = false;
  let celebrationPreview = false;
  if (session) {
    const supabase = db();
    const [admin, mascotOn, ribbonOn, celebOn, celebId] = await Promise.all([
      isAdmin(supabase, session.displayName),
      isMascotEnabled(supabase),
      isRibbonEnabled(supabase),
      isCelebrationVideoEnabled(supabase),
      getCelebrationVideoId(supabase),
    ]);
    showMascot = admin || mascotOn;
    showRibbon = admin || ribbonOn;
    // 🦈 V41: live for everyone when the flag is on; admin always previews.
    celebrationId = celebId;
    celebrationOn = (celebOn || admin) && !!celebId;
    celebrationPreview = admin && !celebOn;
  }

  return (
    <html
      lang={lang}
      dir={dir(lang)}
      className={`${vazir.variable}${dark ? " dark" : ""}`}
    >
      <body className="font-sans has-bottom-nav">
        {flagOn && <FlagWaveBackground />}
        {showRibbon && <MourningRibbon />}
        {showMascot && <MascotPeek />}
        {celebrationOn && (
          <CelebrationVideo videoId={celebrationId} lang={lang} preview={celebrationPreview} />
        )}
        {children}
      </body>
    </html>
  );
}
