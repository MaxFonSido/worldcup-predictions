"use client";

import { useEffect, useState } from "react";
import Link from "next/link";

type Labels = { join: string; joined: string; closesIn: string; cta: string };

export default function PoolBanner({ hide, labels }: { hide: boolean; labels: Labels }) {
  const [state, setState] = useState<{ open: boolean; joined: boolean; closesAt: string | null } | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    fetch("/api/pool/status", { cache: "no-store" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => {
        if (alive && d) setState(d);
      })
      .catch(() => {});
    const id = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (hide || !state || !state.open) return null;

  let countdown = "";
  if (state.closesAt) {
    const ms = new Date(state.closesAt).getTime() - now;
    if (ms > 0) {
      const d = Math.floor(ms / 86400000);
      const h = Math.floor((ms % 86400000) / 3600000);
      countdown = d > 0 ? `${d}d ${h}h` : `${h}h`;
    }
  }

  return (
    <div className="bg-amber-400 text-amber-950">
      <div className="mx-auto flex max-w-2xl items-center justify-between gap-3 px-5 py-2 text-sm">
        <span className="font-semibold leading-tight">
          {state.joined ? labels.joined : labels.join}
          {!state.joined && countdown && (
            <span className="ms-2 font-normal opacity-80">· {labels.closesIn} {countdown}</span>
          )}
        </span>
        {!state.joined && (
          <Link
            href="/pool"
            className="shrink-0 rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-50"
          >
            {labels.cta}
          </Link>
        )}
      </div>
    </div>
  );
}
