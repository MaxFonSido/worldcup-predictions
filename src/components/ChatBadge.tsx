"use client";

import { useEffect, useState } from "react";

export default function ChatBadge({ initial }: { initial: number }) {
  const [count, setCount] = useState(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setCount(Number(data.count) || 0);
      } catch {
        /* ignore transient errors */
      }
    };
    const id = setInterval(tick, 8000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  if (count <= 0) return null;

  return (
    <span className="relative ms-1 inline-flex h-[18px] w-[18px] items-center justify-center align-middle">
      <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-red-400 opacity-75" />
      <span className="relative inline-flex h-[18px] min-w-[18px] items-center justify-center rounded-full bg-red-500 px-1 text-[11px] font-bold leading-none text-white">
        {count > 9 ? "9+" : count}
      </span>
    </span>
  );
}
