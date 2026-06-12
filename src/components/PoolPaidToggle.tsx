"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = { markPaid: string; markUnpaid: string };

export default function PoolPaidToggle({
  userId,
  paid,
  labels
}: {
  userId: string;
  paid: boolean;
  labels: Labels;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);

  async function toggle() {
    if (busy) return;
    setBusy(true);
    const res = await fetch("/api/pool/paid", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, paid: !paid })
    });
    setBusy(false);
    if (res.ok) router.refresh();
  }

  return (
    <button
      onClick={toggle}
      disabled={busy}
      className={`rounded-lg px-2 py-1 text-xs font-semibold disabled:opacity-50 ${
        paid ? "bg-ink/10 text-ink" : "bg-pitch text-white"
      }`}
    >
      {paid ? labels.markUnpaid : labels.markPaid}
    </button>
  );
}
