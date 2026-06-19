"use client";

import { useState } from "react";

export default function KhalBalaBanner() {
  const [dismissed, setDismissed] = useState(false);
  const [loading, setLoading] = useState(false);

  if (dismissed) return null;

  async function handleTap() {
    setLoading(true);
    try {
      const res = await fetch("/api/khalbala-link");
      if (res.ok) {
        const { url } = await res.json();
        window.open(url, "_blank");
      }
    } catch {
      /* ignore */
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="relative mb-5 rounded-2xl bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-4 shadow-lg border border-purple-700/40 overflow-hidden">
      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="absolute top-2 right-2 text-purple-300/60 hover:text-white text-lg leading-none z-10 p-1"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Tappable content */}
      <button
        onClick={handleTap}
        disabled={loading}
        className="w-full text-left"
      >
        <div className="flex items-center gap-3">
          <span className="text-3xl">🃏</span>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2">
              <span className="font-bold text-white text-sm">Khal Bala</span>
              <span className="text-purple-300 text-sm" dir="rtl">خال بالا</span>
            </div>
            <p className="text-purple-200/80 text-xs mt-0.5">
              {loading ? "Opening..." : "Knockout predictions — exact scores & multipliers →"}
            </p>
          </div>
        </div>
      </button>
    </div>
  );
}
