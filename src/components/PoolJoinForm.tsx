"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = { join: string; yourName: string; payNote: string };

export default function PoolJoinForm({ labels }: { labels: Labels }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [busy, setBusy] = useState(false);

  async function join() {
    if (!name.trim() || busy) return;
    setBusy(true);
    const res = await fetch("/api/pool/join", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ realName: name.trim() })
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="mb-4 space-y-3 rounded-2xl bg-white p-5 shadow-card">
      <input
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder={labels.yourName}
        maxLength={80}
        className="w-full rounded-xl border border-line px-4 py-3 outline-none focus:border-pitch"
      />
      <button
        onClick={join}
        disabled={!name.trim() || busy}
        className="w-full rounded-xl bg-gold py-3 text-lg font-semibold text-white shadow-card transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {labels.join}
      </button>
      <p className="text-center text-xs text-muted">{labels.payNote}</p>
    </div>
  );
}
