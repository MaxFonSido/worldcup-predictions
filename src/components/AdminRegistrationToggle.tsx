"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = { stateOpen: string; stateClosed: string; close: string; open: string };

export default function AdminRegistrationToggle({
  open,
  labels
}: {
  open: boolean;
  labels: Labels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/admin/registration", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ open: !open })
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <div className="flex items-center justify-between rounded-xl bg-white p-4 shadow-card">
      <span className="font-semibold">
        {open ? (
          <span className="text-pitch">● {labels.stateOpen}</span>
        ) : (
          <span className="text-red-600">● {labels.stateClosed}</span>
        )}
      </span>
      <button
        onClick={toggle}
        disabled={busy}
        className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
          open ? "bg-red-500" : "bg-pitch"
        }`}
      >
        {open ? labels.close : labels.open}
      </button>
    </div>
  );
}
