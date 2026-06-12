"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = { join: string; firstName: string; lastName: string; payNote: string };

export default function PoolJoinForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [first, setFirst] = useState("");
  const [last, setLast] = useState("");
  const [busy, setBusy] = useState(false);

  const ready = first.trim().length > 0 && last.trim().length > 0;

  async function join() {
    if (!ready || busy) return;
    setBusy(true);
    const res = await fetch("/api/pool/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ firstName: first.trim(), lastName: last.trim() })
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="mb-4 space-y-3 rounded-2xl bg-white p-5 shadow-card">
      <div className="flex gap-2">
        <input
          value={first}
          onChange={(e) => setFirst(e.target.value)}
          placeholder={labels.firstName}
          maxLength={40}
          className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-pitch"
        />
        <input
          value={last}
          onChange={(e) => setLast(e.target.value)}
          placeholder={labels.lastName}
          maxLength={40}
          className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-pitch"
        />
      </div>
      <button
        onClick={join}
        disabled={!ready || busy}
        className="w-full rounded-xl bg-gold py-3 text-lg font-semibold text-white shadow-card transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {labels.join}
      </button>
      <p className="text-center text-xs text-muted">{labels.payNote}</p>
    </div>
  );
}
