"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminMascotToggle({ enabled }: { enabled: boolean }) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/admin/mascot-toggle", {
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
            <span className="text-pitch-deep">⚽ Visible to everyone</span>
          ) : (
            <span className="text-muted">⚽ Only you can see it</span>
          )}
        </span>
      </div>
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          enabled ? "bg-red-500" : "bg-pitch"
        }`}
      >
        {enabled ? "Hide" : "Show to all"}
      </button>
    </div>
  );
}
