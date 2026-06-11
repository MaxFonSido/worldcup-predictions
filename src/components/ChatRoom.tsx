"use client";

import { useEffect, useRef, useState } from "react";
import { emojiFor } from "@/lib/avatar";

type Msg = { id: string; user_id: string; name: string; body: string; created_at: string };

type Labels = { placeholder: string; send: string; empty: string };

function fmtTime(iso: string, lang: "en" | "fa") {
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  try {
    return new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

export default function ChatRoom({
  myUserId,
  lang,
  labels,
  initial
}: {
  myUserId: string;
  lang: "en" | "fa";
  labels: Labels;
  initial: Msg[];
}) {
  const [messages, setMessages] = useState<Msg[]>(initial);
  const [text, setText] = useState("");
  const [busy, setBusy] = useState(false);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Keep the view pinned to the newest message.
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  // Poll for new messages every few seconds — keeps it feeling live, stays free.
  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && Array.isArray(data.messages)) setMessages(data.messages);
      } catch {
        /* ignore transient errors */
      }
    };
    const id = setInterval(tick, 4000);
    return () => {
      alive = false;
      clearInterval(id);
    };
  }, []);

  async function send() {
    const body = text.trim();
    if (!body || busy) return;
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body })
      });
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data.messages)) setMessages(data.messages);
        setText("");
      }
    } finally {
      setBusy(false);
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-4">
        {messages.length === 0 ? (
          <p className="py-10 text-center text-muted">{labels.empty}</p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === myUserId;
            return (
              <div key={m.id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                <div className={`max-w-[78%] ${mine ? "items-end" : "items-start"}`}>
                  {!mine && (
                    <div className="mb-0.5 ms-1 text-xs font-semibold text-muted">
                      {emojiFor(m.name)} {m.name}
                    </div>
                  )}
                  <div
                    className={`rounded-2xl px-4 py-2 shadow-card ${
                      mine ? "bg-pitch text-white" : "bg-white text-ink"
                    }`}
                  >
                    <span className="whitespace-pre-wrap break-words">{m.body}</span>
                  </div>
                  <div className={`mt-0.5 text-[10px] text-muted ${mine ? "text-end me-1" : "ms-1"}`}>
                    {fmtTime(m.created_at, lang)}
                  </div>
                </div>
              </div>
            );
          })
        )}
        <div ref={bottomRef} />
      </div>

      <div className="mt-3 flex items-center gap-2">
        <input
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === "Enter" && !e.shiftKey) {
              e.preventDefault();
              send();
            }
          }}
          placeholder={labels.placeholder}
          maxLength={500}
          className="flex-1 rounded-full border border-line bg-white px-4 py-3 outline-none focus:border-pitch"
        />
        <button
          onClick={send}
          disabled={busy || !text.trim()}
          className="rounded-full bg-pitch px-5 py-3 font-semibold text-white shadow-card transition-opacity hover:opacity-95 disabled:opacity-60"
        >
          {labels.send}
        </button>
      </div>
    </div>
  );
}
