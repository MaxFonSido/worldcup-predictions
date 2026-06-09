"use client";

import { useState } from "react";

export default function LangToggle({
  current,
  variant = "onDark"
}: {
  current: "en" | "fa";
  variant?: "onDark" | "onLight";
}) {
  const [busy, setBusy] = useState(false);

  function setLang(lang: "en" | "fa") {
    if (lang === current || busy) return;
    setBusy(true);
    document.cookie = `lang=${lang};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  const base = "px-3 py-1 text-sm rounded-full transition-colors";

  // onDark = sits on the green header; onLight = sits on the white login screen
  const wrap =
    variant === "onLight" ? "bg-ink/10" : "bg-white/15";
  const on =
    variant === "onLight"
      ? "bg-pitch text-white font-semibold shadow-sm"
      : "bg-white text-pitch-deep font-semibold shadow-sm";
  const off =
    variant === "onLight"
      ? "text-ink/60 hover:text-ink"
      : "text-white/80 hover:text-white";

  return (
    <div className={`inline-flex items-center gap-1 rounded-full p-1 ${wrap}`}>
      <button className={`${base} ${current === "en" ? on : off}`} onClick={() => setLang("en")}>
        EN
      </button>
      <button className={`${base} ${current === "fa" ? on : off}`} onClick={() => setLang("fa")}>
        فارسی
      </button>
    </div>
  );
}
