"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function ChampionBanner({ text }: { text: string }) {
  const router = useRouter();
  const [dismissed, setDismissed] = useState(false);

  if (dismissed) return null;

  return (
    <div className="relative mb-5 rounded-2xl bg-gradient-to-r from-gold via-[#E6B82E] to-gold p-4 shadow-lg border border-[#C49419]/40 overflow-hidden">
      {/* Dismiss button */}
      <button
        onClick={(e) => { e.stopPropagation(); setDismissed(true); }}
        className="absolute top-2 right-2 text-[#5A4108]/60 hover:text-[#3A2A05] text-lg leading-none z-10 p-1"
        aria-label="Dismiss"
      >
        ✕
      </button>

      {/* Tappable content */}
      <button onClick={() => router.push("/champion")} className="w-full text-left">
        <div className="flex items-center gap-3">
          <span className="text-3xl">🏆</span>
          <div className="flex-1 min-w-0">
            <p className="font-bold text-[#3A2A05] text-sm">{text}</p>
          </div>
        </div>
      </button>
    </div>
  );
}
