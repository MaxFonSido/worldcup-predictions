"use client";

import { useState } from "react";

export default function AdminSendDigest() {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState<string | null>(null);

  async function handleSend() {
    setBusy(true);
    setResult(null);
    try {
      const res = await fetch("/api/admin/send-digest", { method: "POST" });
      const data = await res.json();
      if (data.ok) {
        setResult(`✅ Sent to ${data.sent} subscriber${data.sent !== 1 ? "s" : ""}`);
      } else {
        setResult("❌ Failed — try again");
      }
    } catch {
      setResult("❌ Failed — try again");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="rounded-2xl bg-white p-5 shadow-card">
      <h3 className="mb-1 font-bold text-ink">Send Digest Now</h3>
      <p className="mb-3 text-sm text-muted">
        Manually send today's match schedule to all email subscribers.
      </p>
      <button
        onClick={handleSend}
        disabled={busy}
        className="rounded-full bg-blue-600 px-5 py-2 text-sm font-semibold text-white transition-opacity hover:opacity-90 disabled:opacity-60"
      >
        {busy ? "Sending..." : "📧 Send Digest"}
      </button>
      {result && <p className="mt-2 text-sm">{result}</p>}
    </div>
  );
}
