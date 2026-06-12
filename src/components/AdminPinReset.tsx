"use client";

import { useState } from "react";

type User = { id: string; name: string };
type Labels = { newPin: string; reset: string; done: string };

function Row({ user, labels }: { user: User; labels: Labels }) {
  const [pin, setPin] = useState("");
  const [busy, setBusy] = useState(false);
  const [done, setDone] = useState(false);

  const valid = /^\d{4}$/.test(pin);

  async function reset() {
    if (!valid || busy) return;
    setBusy(true);
    setDone(false);
    const res = await fetch("/api/admin/reset-pin", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId: user.id, newPin: pin })
    });
    setBusy(false);
    if (res.ok) {
      setDone(true);
      setPin("");
    }
  }

  return (
    <div className="flex items-center gap-2 rounded-xl bg-white p-3 shadow-card">
      <span className="flex-1 truncate font-medium">{user.name}</span>
      <input
        value={pin}
        onChange={(e) => {
          setPin(e.target.value.replace(/\D/g, "").slice(0, 4));
          setDone(false);
        }}
        inputMode="numeric"
        placeholder={labels.newPin}
        className="w-24 rounded-lg border border-line px-2 py-2 text-center outline-none focus:border-pitch"
      />
      <button
        onClick={reset}
        disabled={!valid || busy}
        className="rounded-lg bg-pitch px-3 py-2 text-sm font-semibold text-white disabled:opacity-50"
      >
        {done ? labels.done : labels.reset}
      </button>
    </div>
  );
}

export default function AdminPinReset({ users, labels }: { users: User[]; labels: Labels }) {
  return (
    <div className="space-y-2">
      {users.map((u) => (
        <Row key={u.id} user={u} labels={labels} />
      ))}
    </div>
  );
}
