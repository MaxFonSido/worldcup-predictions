"use client";

import { useState } from "react";

export type BreakdownLine = {
  matchId: string;
  label: string; // "Team A vs Team B"
  guess: string; // team name or "Draw"
  status: "correct" | "wrong" | "pending";
};

export default function ScoreBreakdown({ lines }: { lines: BreakdownLine[] }) {
  const [open, setOpen] = useState(false);

  if (lines.length === 0) return null;

  return (
    <div className="mt-2 border-t border-pitch/10 pt-2">
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between"
      >
        <span className="text-xs font-bold uppercase tracking-wide text-muted">
          How they scored
        </span>
        <svg
          width="12" height="12" viewBox="0 0 24 24" fill="none"
          stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"
          className={`text-muted transition-transform duration-200 ${open ? "rotate-180" : ""}`}
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      {open && (
        <div className="mt-2 space-y-1">
          {lines.map((l) => (
            <div key={l.matchId} className="flex items-center justify-between gap-2 text-xs">
              <span className="truncate text-muted">{l.label}</span>
              <span className="flex shrink-0 items-center gap-2">
                <span className="tnum text-muted">{l.guess}</span>
                {l.status === "correct" && (
                  <span className="tnum font-bold text-gold">+1</span>
                )}
                {l.status === "wrong" && (
                  <span className="tnum font-bold text-muted">0</span>
                )}
                {l.status === "pending" && (
                  <span className="font-semibold text-muted/70">Pending</span>
                )}
              </span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
