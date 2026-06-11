"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Option = { name: string; titles: number };
type Labels = {
  choose: string;
  save: string;
  saved: string;
  titlesWord: string;
  lockNote: string;
  lockedMsg: string;
};

export default function ChampionForm({
  options,
  current,
  locked,
  labels
}: {
  options: Option[];
  current: string | null;
  locked: boolean;
  labels: Labels;
}) {
  const router = useRouter();
  const [pick, setPick] = useState(current ?? "");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  async function save() {
    if (!pick || busy || locked) return;
    setBusy(true);
    setDone(false);
    const res = await fetch("/api/champion", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ pick })
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      router.refresh();
    }
  }

  // After kickoff, the pick is frozen — show it read-only.
  if (locked) {
    return (
      <div className="rounded-2xl bg-white p-5 shadow-card">
        <p className="text-sm text-muted">🔒 {labels.lockedMsg}</p>
        <p className="mt-2 text-2xl font-bold text-pitch-deep">{current ?? "—"}</p>
      </div>
    );
  }

  return (
    <div className="space-y-4 rounded-2xl bg-white p-5 shadow-card">
      <select
        value={pick}
        onChange={(e) => {
          setPick(e.target.value);
          setDone(false);
        }}
        className="w-full rounded-xl border border-line bg-white px-4 py-3 text-lg outline-none focus:border-pitch"
      >
        <option value="" disabled>
          {labels.choose}
        </option>
        {options.map((o) => (
          <option key={o.name} value={o.name}>
            {o.name}
            {o.titles > 0 ? ` — ${o.titles}★ ${labels.titlesWord}` : ""}
          </option>
        ))}
      </select>

      <button
        onClick={save}
        disabled={!pick || busy}
        className="w-full rounded-xl bg-pitch py-3 text-lg font-semibold text-white shadow-card transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {labels.save}
      </button>

      {done && (
        <p className="text-center text-sm font-semibold text-pitch">
          ✓ {labels.saved} {pick}
        </p>
      )}

      <p className="text-center text-xs text-muted">⏳ {labels.lockNote}</p>
    </div>
  );
}
