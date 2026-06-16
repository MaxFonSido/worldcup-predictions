"use client";

import { useState } from "react";

export default function DayAccordion({
  label,
  matchCount,
  defaultOpen,
  children
}: {
  label: string;
  matchCount: number;
  defaultOpen: boolean;
  children: React.ReactNode;
}) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <div>
      <button
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-center justify-between rounded-xl bg-pitch-deep/5 px-4 py-3 transition-colors hover:bg-pitch-deep/10"
      >
        <span className="text-sm font-bold text-pitch-deep">{label}</span>
        <span className="flex items-center gap-2">
          <span className="rounded-full bg-pitch-deep/10 px-2 py-0.5 text-xs font-semibold text-pitch-deep">
            {matchCount}
          </span>
          <span
            className={`text-sm text-pitch-deep transition-transform ${open ? "rotate-180" : ""}`}
          >
            ▾
          </span>
        </span>
      </button>
      {open && <div className="mt-2 space-y-3">{children}</div>}
    </div>
  );
}
