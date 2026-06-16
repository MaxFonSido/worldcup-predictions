"use client";

import { useState } from "react";

export default function AdminSendDigest() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend(meOnly: boolean) {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-digest", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ meOnly })
      });
      const data = await res.json();
      if (data.ok) {
        setResult(meOnly
          ? "✅ Sent to your email — check your inbox"
          : `✅ Sent to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}`
        );
      } else {
        setResult(`❌ ${data.error ?? "Failed — try again"}`);
      }
    } catch {
      setResult("❌ Failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="mb-1 font-bold text-ink">Email Digest</h3>
      <p className="mb-3 text-sm text-muted">
        Send today's match schedule with predictions, yesterday's recap, and family highlights.
      </p>
      <div className="flex gap-2">
        <button
          onClick={() => handleSend(true)}
          disabled={busy}
          className="rounded-full bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "..." : "📧 Send to Me"}
        </button>
        <button
          onClick={() => handleSend(false)}
          disabled={busy}
          className="rounded-full bg-pitch px-4 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
        >
          {busy ? "..." : "📧 Send to All"}
        </button>
      </div>
      {result && <p className="mt-2 text-sm">{result}</p>}
    </div>
  );
}
