"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminChampionToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/admin/champion-toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ enabled: !enabled }),
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
      <div>
        <span className="font-semibold">
          {enabled ? (
            <span className="text-gold">🏆 Open — banner showing</span>
          ) : (
            <span className="text-muted">🏆 Closed — banner hidden</span>
          )}
        </span>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          enabled ? "bg-red-500" : "bg-gold"
        }`}
      >
        {enabled ? "Close" : "Open to all"}
      </button>
    </div>
  );
}
