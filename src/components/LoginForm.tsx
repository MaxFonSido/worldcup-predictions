"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";

type Labels = {
  enterName: string;
  namePlaceholder: string;
  enterPin: string;
  login: string;
  loginHint: string;
  wrongPin: string;
  badName: string;
  badPin: string;
  regClosed: string;
};

export default function LoginForm({ labels, lang }: { labels: Labels; lang: "en" | "fa" }) {
  const router = useRouter();
  const [name, setName] = useState("");
  const [pin, setPin] = useState("");
  const [error, setError] = useState("");
  const [busy, setBusy] = useState(false);

  async function submit() {
    setError("");
    if (!name.trim()) return setError(labels.badName);
    if (!/^\d{4}$/.test(pin)) return setError(labels.badPin);

    setBusy(true);
    const res = await fetch("/api/auth", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ displayName: name.trim(), pin, language: lang })
    });
    setBusy(false);

    if (res.ok) {
      router.push("/matches");
      router.refresh();
      return;
    }
    const data = await res.json().catch(() => ({}));
    if (data.error === "wrongPin") setError(labels.wrongPin);
    else if (data.error === "regClosed") setError(labels.regClosed);
    else setError(data.error || labels.badPin);
  }

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-muted mb-1">{labels.enterName}</label>
        <input
          value={name}
          onChange={(e) => {
            setName(e.target.value);
            setError("");
          }}
          placeholder={labels.namePlaceholder}
          className="w-full rounded-xl border border-line bg-white px-4 py-3 text-lg outline-none focus:border-pitch"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-muted mb-1">{labels.enterPin}</label>
        <input
          value={pin}
          onChange={(e) => {
            setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
            setError("");
          }}
          inputMode="numeric"
          type="password"
          autoComplete="off"
          placeholder="••••"
          className="tnum w-full rounded-xl border border-line bg-white px-4 py-3 text-lg tracking-[0.5em] outline-none focus:border-pitch"
          onKeyDown={(e) => e.key === "Enter" && submit()}
        />
      </div>

      {error && <p className="text-sm text-red-600">{error}</p>}

      <button
        onClick={submit}
        disabled={busy}
        className="w-full rounded-xl bg-pitch py-3 text-lg font-semibold text-white shadow-card transition-opacity hover:opacity-95 disabled:opacity-60"
      >
        {labels.login}
      </button>

      <p className="text-center text-sm text-muted">{labels.loginHint}</p>
    </div>
  );
}
