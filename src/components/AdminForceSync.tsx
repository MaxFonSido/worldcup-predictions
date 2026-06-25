"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminForceSync() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSync() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/force-sync", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setResult(`✅ Synced — ${data.updated} match${data.updated !== 1 ? "es" : ""} updated`);
        router.refresh();
      } else {
        setResult(`❌ ${data.error ?? "Sync failed — try again"}`);
      }
    } catch {
      setResult("❌ Sync failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="mb-1 font-bold text-ink">Prediction Force Sync 🔄</h3>
      <p className="mb-3 text-sm text-muted">
        Force a fresh pull from football-data.org right now — updates match schedules, team names, scores, and knockout bracket slots.
      </p>
      <button
        onClick={handleSync}
        disabled={busy}
        className="rounded-full bg-pitch px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Syncing..." : "🔄 Force Sync Now"}
      </button>
      {result && <p className="mt-3 text-sm">{result}</p>}
    </div>
  );
}
