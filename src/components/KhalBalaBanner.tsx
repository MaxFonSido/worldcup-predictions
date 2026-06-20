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
    <div className="kb-shake relative mb-5 rounded-2xl bg-gradient-to-r from-purple-900 via-purple-800 to-purple-900 p-4 shadow-lg border border-purple-700/40 overflow-hidden">
      <style jsx>{`
        @keyframes kb-shake {
          0%, 100% { transform: translateX(0) rotate(0deg); }
          2% { transform: translateX(-3px) rotate(-1deg); }
          4% { transform: translateX(3px) rotate(1deg); }
          6% { transform: translateX(-3px) rotate(-1deg); }
          8% { transform: translateX(3px) rotate(1deg); }
          10% { transform: translateX(-2px) rotate(-0.5deg); }
          12% { transform: translateX(2px) rotate(0.5deg); }
          14% { transform: translateX(0) rotate(0deg); }
        }
        .kb-shake {
          animation: kb-shake 1s ease-in-out infinite;
        }
        @media (prefers-reduced-motion: reduce) {
          .kb-shake {
            animation: none;
          }
        }
      `}</style>

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
        className="w-full text-center py-1"
      >
        <p dir="rtl" className="font-bold text-gold text-base leading-relaxed">
          {loading ? "در حال باز شدن…" : "خال بالا - بیا قدرت پیشگویی تو امتحان کن"}
        </p>
      </button>
    </div>
  );
}
