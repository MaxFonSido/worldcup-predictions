"use client";

import { useState } from "react";
import type { NewsItem } from "@/lib/news";
import type { Highlight } from "@/lib/highlights";

type Labels = {
  news: string;
  highlights: string;
  newsEmpty: string;
  newsFrom: string;
  highlightsEmpty: string;
  buzz: string;
};

function fmt(date: number, lang: string) {
  if (!date) return "";
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  try {
    return new Date(date).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

export default function NewsTabs({
  news,
  highlights,
  lang,
  labels
}: {
  news: NewsItem[];
  highlights: Highlight[];
  lang: string;
  labels: Labels;
}) {
  const [tab, setTab] = useState<"news" | "highlights">("news");
  const [playing, setPlaying] = useState<string | null>(null);

  const pill = (on: boolean) =>
    `flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
      on ? "bg-pitch text-white" : "text-muted"
    }`;

  return (
    <div>
      <div className="mb-4 flex gap-1 rounded-full bg-white p-1 shadow-card">
        <button className={pill(tab === "news")} onClick={() => setTab("news")}>
          {labels.news}
        </button>
        <button className={pill(tab === "highlights")} onClick={() => setTab("highlights")}>
          {labels.highlights}
        </button>
      </div>

      {tab === "news" ? (
        news.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">{labels.newsEmpty}</p>
        ) : (
          <>
            <div className="space-y-2">
              {news.map((n, i) => (
                <a
                  key={`${n.link}-${i}`}
                  href={n.link}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block rounded-2xl bg-white p-4 shadow-card transition-colors hover:bg-pitch/5"
                >
                  {n.buzz && <span className="buzz-tag mb-1">🍵 {labels.buzz}</span>}
                  <div className="font-semibold leading-snug text-ink">{n.title}</div>
                  {n.summary && <div className="mt-1 text-sm text-muted">{n.summary}</div>}
                  {n.image && (
                    <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-line">
                      {/* eslint-disable-next-line @next/next/no-img-element */}
                      <img src={n.image} alt="" loading="lazy" className="h-full w-full object-cover" />
                    </div>
                  )}
                  <div className="mt-2 text-xs text-muted">
                    {n.source}
                    {n.date ? ` · ${fmt(n.date, lang)}` : ""} ↗
                  </div>
                </a>
              ))}
            </div>
            <p className="mt-4 text-center text-xs text-muted">{labels.newsFrom}</p>
          </>
        )
      ) : highlights.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">{labels.highlightsEmpty}</p>
      ) : (
        <div className="space-y-3">
          {highlights.map((h) => (
            <div key={h.id} className="overflow-hidden rounded-2xl bg-white shadow-card">
              <div className="aspect-[16/9] w-full bg-line">
                {playing === h.id ? (
                  <iframe
                    className="h-full w-full"
                    src={`https://www.youtube.com/embed/${h.id}?autoplay=1&rel=0`}
                    title={h.title}
                    allow="autoplay; encrypted-media; picture-in-picture; fullscreen"
                    allowFullScreen
                  />
                ) : (
                  <button
                    type="button"
                    onClick={() => setPlaying(h.id)}
                    className="relative block h-full w-full"
                    aria-label={h.title}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img src={h.thumb} alt="" loading="lazy" className="h-full w-full object-cover" />
                    <span className="absolute inset-0 flex items-center justify-center">
                      <span className="flex h-14 w-14 items-center justify-center rounded-full bg-black/55">
                        <span className="ms-1 inline-block border-y-[10px] border-l-[16px] border-y-transparent border-l-white" />
                      </span>
                    </span>
                  </button>
                )}
              </div>
              <div className="px-4 py-3 text-sm font-semibold leading-snug text-ink">{h.title}</div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
