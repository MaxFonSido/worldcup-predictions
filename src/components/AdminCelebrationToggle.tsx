"use client";

// V41 — Admin control for the 🦈 Celebration Video (Shark Wins).
// Two controls, same card: paste/save the YouTube video ID, and the usual
// show-to-all toggle (identical pattern to the ribbon/mascot toggles).

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCelebrationToggle({
  enabled,
  videoId,
}: {
  enabled: boolean;
  videoId: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [id, setId] = useState(videoId);
  const [saved, setSaved] = useState(false);

  async function post(body: Record<string, unknown>) {
    if (busy) return false;
    setBusy(true);
    const res = await fetch("/api/admin/celebration-toggle", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setBusy(false);
    return res.ok;
  }

  async function saveId() {
    // Accept either the bare ID or a full YouTube URL — extract the ID.
    const m = id.trim().match(/(?:v=|youtu\.be\/|embed\/)?([A-Za-z0-9_-]{11})(?:[?&#]|$)/);
    const clean = m ? m[1] : id.trim();
    if (await post({ videoId: clean })) {
      setId(clean);
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
      router.refresh();
    }
  }

  async function toggle() {
    if (await post({ enabled: !enabled })) router.refresh();
  }

  return (
    <div className="rounded-xl bg-white p-4 shadow-card">
      <div className="flex items-center gap-2">
        <input
          value={id}
          onChange={(e) => setId(e.target.value)}
          placeholder="YouTube video ID or URL"
          className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
          dir="ltr"
        />
        <button
          onClick={saveId}
          disabled={busy}
          className="rounded-lg bg-pitch px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
        >
          {saved ? "✓" : "Save"}
        </button>
      </div>

      <div className="mt-3 flex items-center justify-between">
        <span className="font-semibold">
          {enabled ? (
            <span className="text-pitch-deep">🦈 Visible to everyone</span>
          ) : (
            <span className="text-muted">🦈 Only you can see it</span>
          )}
        </span>
        <button
          onClick={toggle}
          disabled={busy || !videoId}
          title={!videoId ? "Save a video ID first" : undefined}
          className={`rounded-lg px-3 py-2 text-sm font-semibold text-white disabled:opacity-50 ${
            enabled ? "bg-red-500" : "bg-pitch"
          }`}
        >
          {enabled ? "Hide" : "Show to all"}
        </button>
      </div>
    </div>
  );
}
