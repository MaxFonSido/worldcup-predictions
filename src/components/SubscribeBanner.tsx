"use client";

import { useState } from "react";

export default function SubscribeBanner({ subscribed }: { subscribed: boolean }) {
  const [email, setEmail] = useState("");
  const [done, setDone] = useState(subscribed);
  const [justSubscribed, setJustSubscribed] = useState(false);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  // Already subscribed from a previous session — show small manage link
  if (done && !justSubscribed) {
    return (
      <div className="mx-4 mb-2 flex items-center justify-center gap-2 text-xs text-muted">
        <span>📧 Subscribed to match reminders</span>
        <span>·</span>
        <button
          onClick={async () => {
            await fetch("/api/subscribe", { method: "DELETE" });
            setDone(false);
            setJustSubscribed(false);
          }}
          className="underline underline-offset-2 transition-colors hover:text-ink"
        >
          Unsubscribe
        </button>
      </div>
    );
  }

  // Just subscribed — show confirmation
  if (justSubscribed) {
    return (
      <div className="mx-4 mb-3 rounded-2xl border border-green-200 bg-green-50 px-4 py-3 shadow-card dark:border-green-900 dark:bg-green-950/40">
        <div className="text-sm font-semibold text-green-800 dark:text-green-200">
          ✅ You're subscribed — match reminders are on!
        </div>
        <p className="mt-1 text-xs text-green-600 dark:text-green-400">
          Check your email — we just sent you a welcome message with today's schedule.
        </p>
      </div>
    );
  }

  async function handleSubscribe() {
    const val = email.trim().toLowerCase();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setError("Please enter a valid email.");
      return;
    }
    setBusy(true);
    setError("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: val })
      });
      if (res.ok) {
        setDone(true);
        setJustSubscribed(true);
      } else {
        setError("Something went wrong — try again.");
      }
    } catch {
      setError("Something went wrong — try again.");
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="mx-4 mb-3 rounded-2xl border border-blue-200 bg-blue-50 p-4 shadow-card dark:border-blue-900 dark:bg-blue-950/40">
      <div className="text-sm font-semibold text-blue-900 dark:text-blue-200">
        ⚽ Never miss a bet — get match reminders by email
      </div>
      <p className="mt-1 text-xs text-blue-700 dark:text-blue-400">
        We'll email you the day's schedule each morning and a reminder 1 hour before each game.
      </p>
      <div className="mt-3 flex gap-2">
        <input
          type="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
          placeholder="your@email.com"
          className="flex-1 rounded-full border border-blue-200 bg-white px-3 py-2 text-sm outline-none focus:border-blue-500 dark:border-blue-800 dark:bg-blue-950/60 dark:text-blue-100"
        />
        <button
          onClick={handleSubscribe}
          disabled={busy}
          className="shrink-0 rounded-full bg-pitch px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
        >
          {busy ? "..." : "Subscribe"}
        </button>
      </div>
      {error && <p className="mt-2 text-xs text-red-500">{error}</p>}
    </div>
  );
}
