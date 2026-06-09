import type { Metadata, Viewport } from "next";
import { Vazirmatn } from "next/font/google";
import { getLang, dir } from "@/lib/i18n";
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

export default function RootLayout({ children }: { children: React.ReactNode }) {
  const lang = getLang();
  return (
    <html lang={lang} dir={dir(lang)} className={vazir.variable}>
      <body className="font-sans">{children}</body>
    </html>
  );
}
