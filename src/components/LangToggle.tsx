"use client";

import { useState } from "react";

export default function LangToggle({ current }: { current: "en" | "fa" }) {
  const [busy, setBusy] = useState(false);

  function setLang(lang: "en" | "fa") {
    if (lang === current || busy) return;
    setBusy(true);
    document.cookie = `lang=${lang};path=/;max-age=${60 * 60 * 24 * 365}`;
    window.location.reload();
  }

  const base =
    "px-3 py-1 text-sm rounded-full transition-colors";
  const on = "bg-white text-pitch-deep font-semibold shadow-sm";
  const off = "text-white/80 hover:text-white";

  return (
    <div className="inline-flex items-center gap-1 rounded-full bg-white/15 p-1">
      <button className={`${base} ${current === "en" ? on : off}`} onClick={() => setLang("en")}>
        EN
      </button>
      <button className={`${base} ${current === "fa" ? on : off}`} onClick={() => setLang("fa")}>
        فارسی
      </button>
    </div>
  );
}
