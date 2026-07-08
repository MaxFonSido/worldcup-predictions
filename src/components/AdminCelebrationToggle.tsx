"use client";

// V41.1 — Admin control for the 🦈 Celebration Video (Shark Wins).
// Two controls, same card: paste/save the self-hosted MP4 URL (pre-filled
// with the GitHub Release asset by default), and the usual show-to-all
// toggle (identical pattern to the ribbon/mascot toggles).

import { useState } from "react";
import { useRouter } from "next/navigation";

export default function AdminCelebrationToggle({
  enabled,
  videoUrl,
}: {
  enabled: boolean;
  videoUrl: string;
}) {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [url, setUrl] = useState(videoUrl);
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

  async function saveUrl() {
    const clean = url.trim();
    if (await post({ videoUrl: clean })) {
      setUrl(clean);
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
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          placeholder="Video URL (MP4)"
          className="min-w-0 flex-1 rounded-lg border border-black/10 px-3 py-2 text-sm"
          dir="ltr"
        />
        <button
          onClick={saveUrl}
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
          disabled={busy || !videoUrl}
          title={!videoUrl ? "Save a video URL first" : undefined}
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
