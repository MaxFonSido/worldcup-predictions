"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { AVATARS, emojiFor } from "@/lib/avatar";

type Labels = {
  emojiTitle: string;
  emojiSub: string;
  emojiSaved: string;
  emailTitle: string;
  emailSub: string;
  subscribed: string;
  notSubscribed: string;
};

export default function AccountPanel({
  currentEmoji,
  currentEmail,
  displayName,
  labels,
}: {
  currentEmoji: string | null;
  currentEmail: string | null;
  displayName: string;
  labels: Labels;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<string | null>(currentEmoji);
  const [saved, setSaved] = useState(false);
  const [busy, setBusy] = useState(false);

  // Email state
  const [email, setEmail] = useState(currentEmail ?? "");
  const [subscribed, setSubscribed] = useState(!!currentEmail);
  const [emailBusy, setEmailBusy] = useState(false);
  const [emailMsg, setEmailMsg] = useState("");

  const defaultEmoji = emojiFor(displayName);
  const activeEmoji = selected ?? defaultEmoji;

  async function saveEmoji(emoji: string | null) {
    setSelected(emoji);
    setSaved(false);
    setBusy(true);
    const res = await fetch("/api/account/avatar", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ emoji }),
    });
    setBusy(false);
    if (res.ok) {
      setSaved(true);
      router.refresh();
      setTimeout(() => setSaved(false), 2000);
    }
  }

  async function handleSubscribe() {
    const val = email.trim().toLowerCase();
    if (!val || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(val)) {
      setEmailMsg("Please enter a valid email.");
      return;
    }
    setEmailBusy(true);
    setEmailMsg("");
    try {
      const res = await fetch("/api/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: val }),
      });
      if (res.ok) {
        setSubscribed(true);
        setEmailMsg("✅");
        router.refresh();
      } else {
        setEmailMsg("Something went wrong — try again.");
      }
    } catch {
      setEmailMsg("Something went wrong — try again.");
    } finally {
      setEmailBusy(false);
    }
  }

  async function handleUnsubscribe() {
    setEmailBusy(true);
    setEmailMsg("");
    try {
      await fetch("/api/subscribe", { method: "DELETE" });
      setSubscribed(false);
      setEmail("");
      setEmailMsg("");
      router.refresh();
    } catch {
      setEmailMsg("Something went wrong.");
    } finally {
      setEmailBusy(false);
    }
  }

  return (
    <div className="space-y-6">
      {/* Preview */}
      <div className="flex items-center gap-3 rounded-2xl bg-white p-4 shadow-card">
        <span className="text-3xl">{activeEmoji}</span>
        <div>
          <div className="font-semibold">{displayName}</div>
          <div className="text-xs text-muted">
            {selected ? labels.emojiSaved.replace("!", "") : "Default emoji"}
          </div>
        </div>
      </div>

      {/* Emoji picker */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="font-semibold">{labels.emojiTitle}</h2>
        <p className="mt-1 text-xs text-muted">{labels.emojiSub}</p>

        <div className="mt-4 grid grid-cols-6 gap-2">
          {AVATARS.map((e) => (
            <button
              key={e}
              onClick={() => saveEmoji(e)}
              disabled={busy}
              className={`flex h-12 w-full items-center justify-center rounded-xl text-2xl transition-all ${
                activeEmoji === e
                  ? "bg-pitch/15 ring-2 ring-pitch scale-110"
                  : "bg-surface hover:bg-ink/5"
              }`}
            >
              {e}
            </button>
          ))}
        </div>

        {selected && (
          <button
            onClick={() => saveEmoji(null)}
            disabled={busy}
            className="mt-3 text-xs text-muted underline underline-offset-2 hover:text-ink"
          >
            Reset to default
          </button>
        )}

        {saved && (
          <span className="ml-3 text-xs font-semibold text-pitch">
            {labels.emojiSaved}
          </span>
        )}
      </div>

      {/* Email subscription */}
      <div className="rounded-2xl bg-white p-4 shadow-card">
        <h2 className="font-semibold">{labels.emailTitle}</h2>
        <p className="mt-1 text-xs text-muted">{labels.emailSub}</p>

        {subscribed ? (
          <div className="mt-4">
            <div className="flex items-center gap-2 text-sm">
              <span className="inline-flex items-center gap-1 rounded-full bg-pitch/10 px-3 py-1 text-xs font-semibold text-pitch">
                📧 {labels.subscribed}
              </span>
              <span className="text-xs text-muted">{email}</span>
            </div>
            <button
              onClick={handleUnsubscribe}
              disabled={emailBusy}
              className="mt-3 text-xs text-red-500 underline underline-offset-2 hover:text-red-700"
            >
              Unsubscribe
            </button>
          </div>
        ) : (
          <div className="mt-4 flex gap-2">
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleSubscribe()}
              placeholder="your@email.com"
              className="flex-1 rounded-full border border-line bg-white px-3 py-2 text-sm outline-none focus:border-pitch"
            />
            <button
              onClick={handleSubscribe}
              disabled={emailBusy}
              className="shrink-0 rounded-full bg-pitch px-4 py-2 text-sm font-semibold text-white transition-opacity disabled:opacity-60"
            >
              {emailBusy ? "..." : "Subscribe"}
            </button>
          </div>
        )}

        {emailMsg && (
          <p className={`mt-2 text-xs ${emailMsg.startsWith("✅") ? "text-pitch" : "text-red-500"}`}>
            {emailMsg}
          </p>
        )}
      </div>
    </div>
  );
}
