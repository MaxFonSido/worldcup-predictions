"use client";

import { useEffect, useState } from "react";

export default function ChatBadge({ initial }: { initial: boolean }) {
  const [unread, setUnread] = useState(initial);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/chat/unread", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive) setUnread(!!data.unread);
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

  if (!unread) return null;
  return (
    <span className="ms-1 inline-block h-2 w-2 rounded-full bg-red-500 align-middle" aria-label="unread" />
  );
}
