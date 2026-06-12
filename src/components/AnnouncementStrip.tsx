"use client";

import { useEffect, useState, type ReactNode } from "react";
import Link from "next/link";

type Data = {
  poolOpen: boolean;
  poolJoined: boolean;
  poolClosesAt: string | null;
  championOpen: boolean;
  championClosesAt: string | null;
};

type Labels = {
  poolOpen: string;
  poolCta: string;
  championOpen: string;
  championCta: string;
  closesIn: string;
};

export default function AnnouncementStrip({ page, labels }: { page: string; labels: Labels }) {
  const [data, setData] = useState<Data | null>(null);
  const [now, setNow] = useState(Date.now());

  useEffect(() => {
    let alive = true;
    const load = () =>
      fetch("/api/announcements", { cache: "no-store" })
        .then((r) => (r.ok ? r.json() : null))
        .then((d) => {
          if (alive && d) setData(d);
        })
        .catch(() => {});
    load();
    const poll = setInterval(load, 60000);
    const tick = setInterval(() => setNow(Date.now()), 60000);
    return () => {
      alive = false;
      clearInterval(poll);
      clearInterval(tick);
    };
  }, []);

  if (!data) return null;

  const countdown = (iso: string | null) => {
    if (!iso) return "";
    const ms = new Date(iso).getTime() - now;
    if (ms <= 0) return "";
    const d = Math.floor(ms / 86400000);
    const h = Math.floor((ms % 86400000) / 3600000);
    return d > 0 ? `${d}d ${h}h` : `${h}h`;
  };

  const line = (
    key: string,
    emoji: string,
    text: string,
    closesAt: string | null,
    href: string,
    cta: string
  ): ReactNode => {
    const c = countdown(closesAt);
    return (
      <div key={key} className="flex items-center justify-between gap-3">
        <span className="font-semibold leading-tight">
          {emoji} {text}
          {c && (
            <span className="ms-2 font-normal opacity-80">
              · {labels.closesIn} {c}
            </span>
          )}
        </span>
        <Link
          href={href}
          className="shrink-0 rounded-full bg-amber-950 px-3 py-1 text-xs font-bold text-amber-50"
        >
          {cta}
        </Link>
      </div>
    );
  };

  const lines: ReactNode[] = [];

  if (data.championOpen && page !== "champion") {
    lines.push(
      line("champ", "🏆", labels.championOpen, data.championClosesAt, "/champion", labels.championCta)
    );
  }
  if (data.poolOpen && !data.poolJoined && page !== "pool") {
    lines.push(line("pool", "🎁", labels.poolOpen, data.poolClosesAt, "/pool", labels.poolCta));
  }

  if (lines.length === 0) return null;

  return (
    <div className="bg-amber-400 text-amber-950">
      <div className="mx-auto max-w-2xl space-y-1 px-5 py-2 text-sm">{lines}</div>
    </div>
  );
}
