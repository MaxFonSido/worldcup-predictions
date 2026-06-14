"use client";

import { useEffect, useRef, useState } from "react";
import { emojiFor } from "@/lib/avatar";

type Reaction = { emoji: string; user_id: string; name: string };
type Msg = { id: string; user_id: string; name: string; body: string; created_at: string; reactions: Reaction[] };

type Labels = { placeholder: string; send: string; empty: string };

const EMOJIS = ["👍", "❤️", "😂", "🔥", "⚽", "🎉"];

function fmtTime(iso: string, lang: "en" | "fa") {
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  try {
    return new Date(iso).toLocaleTimeString(locale, { hour: "numeric", minute: "2-digit" });
  } catch {
    return "";
  }
}

// Group reactions by emoji: { "👍": ["Ali", "Sara"], "😂": ["Kiarash"] }
function groupReactions(reactions: Reaction[]) {
  const map = new Map<string, string[]>();
  for (const r of reactions) {
    if (!map.has(r.emoji)) map.set(r.emoji, []);
    map.get(r.emoji)!.push(r.name);
  }
  return map;
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
  const [pickerFor, setPickerFor] = useState<string | null>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages.length]);

  useEffect(() => {
    let alive = true;
    const tick = async () => {
      try {
        const res = await fetch("/api/chat", { cache: "no-store" });
        if (!res.ok) return;
        const data = await res.json();
        if (alive && Array.isArray(data.messages)) setMessages(data.messages);
      } catch {
        /* ignore */
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

  async function react(messageId: string, emoji: string) {
    setPickerFor(null);
    // Optimistic update
    setMessages((prev) =>
      prev.map((m) => {
        if (m.id !== messageId) return m;
        const existing = m.reactions.find((r) => r.user_id === myUserId);
        let newReactions: Reaction[];
        if (existing?.emoji === emoji) {
          // Toggle off
          newReactions = m.reactions.filter((r) => r.user_id !== myUserId);
        } else {
          // Replace or add
          newReactions = [
            ...m.reactions.filter((r) => r.user_id !== myUserId),
            { emoji, user_id: myUserId, name: "You" }
          ];
        }
        return { ...m, reactions: newReactions };
      })
    );
    try {
      await fetch("/api/chat/react", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messageId, emoji })
      });
    } catch {
      /* next poll corrects */
    }
  }

  return (
    <div className="flex h-[calc(100vh-13rem)] flex-col">
      <div className="flex-1 space-y-3 overflow-y-auto rounded-2xl bg-white/60 p-4" onClick={() => setPickerFor(null)}>
        {messages.length === 0 ? (
          <p className="py-10 text-center text-muted">{labels.empty}</p>
        ) : (
          messages.map((m) => {
            const mine = m.user_id === myUserId;
            const grouped = groupReactions(m.reactions);
            const myReaction = m.reactions.find((r) => r.user_id === myUserId)?.emoji;

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

                  {/* Reactions display */}
                  {grouped.size > 0 && (
                    <div className={`mt-1 flex flex-wrap gap-1 ${mine ? "justify-end me-1" : "ms-1"}`}>
                      {[...grouped.entries()].map(([emoji, names]) => (
                        <button
                          key={emoji}
                          onClick={(e) => { e.stopPropagation(); react(m.id, emoji); }}
                          className={`inline-flex items-center gap-0.5 rounded-full border px-1.5 py-0.5 text-[11px] transition-colors ${
                            myReaction === emoji
                              ? "border-pitch bg-pitch/10"
                              : "border-line bg-white"
                          }`}
                          title={names.join(", ")}
                        >
                          <span>{emoji}</span>
                          <span className="text-muted">{names.length}</span>
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Time + react button */}
                  <div className={`mt-0.5 flex items-center gap-2 ${mine ? "justify-end me-1" : "ms-1"}`}>
                    <span className="text-[10px] text-muted">{fmtTime(m.created_at, lang)}</span>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        setPickerFor(pickerFor === m.id ? null : m.id);
                      }}
                      className="text-[11px] text-muted/60 transition-colors hover:text-muted"
                      aria-label="React"
                    >
                      ☺
                    </button>
                  </div>

                  {/* Emoji picker */}
                  {pickerFor === m.id && (
                    <div
                      className={`mt-1 flex gap-1 rounded-full bg-white px-2 py-1 shadow-card ${mine ? "justify-end" : ""}`}
                      onClick={(e) => e.stopPropagation()}
                    >
                      {EMOJIS.map((e) => (
                        <button
                          key={e}
                          onClick={() => react(m.id, e)}
                          className={`rounded-full p-1 text-base transition-transform hover:scale-125 ${
                            myReaction === e ? "bg-pitch/10" : ""
                          }`}
                        >
                          {e}
                        </button>
                      ))}
                    </div>
                  )}
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
