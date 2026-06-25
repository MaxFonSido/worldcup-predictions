"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { emojiFor } from "@/lib/avatar";

type Pick = "TEAM_A" | "TEAM_B" | "DRAW";

export type MatchView = {
  id: string;
  team_a: string;
  team_b: string;
  team_a_crest: string | null;
  team_b_crest: string | null;
  kickoff_utc: string;
  venue: string | null;
  allows_draw: boolean;
  status: string;
  result: string | null; // TEAM_A | TEAM_B | DRAW | VOID | null
  score_a: number | null;
  score_b: number | null;
};

type Labels = {
  teamAWins: string;
  draw: string;
  teamBWins: string;
  locked: string;
  kicksOff: string;
  knockoutNote: string;
  everyonesPicks: string;
  noPicksYet: string;
  correct: string;
  missed: string;
  voided: string;
  result: string;
  tapToPick: string;
  opensIn: string;
};

const MINUTE_MS = 60 * 1000;
const HOUR_MS = 60 * MINUTE_MS;
const DAY_MS = 24 * HOUR_MS;

function fmtCountdown(ms: number, lang: "en" | "fa"): string {
  if (ms < HOUR_MS) {
    const mins = Math.max(1, Math.ceil(ms / MINUTE_MS));
    return lang === "fa" ? `${mins} دقیقه` : `${mins}m`;
  }
  const hrs = Math.floor(ms / HOUR_MS);
  const days = Math.floor(hrs / 24);
  const remainHrs = hrs % 24;
  if (lang === "fa") {
    if (days > 0) return `${days} روز و ${remainHrs} ساعت`;
    return `${hrs} ساعت`;
  }
  if (days > 0) return `${days}d ${remainHrs}h`;
  return `${hrs}h`;
}

function fmtKickoff(iso: string, lang: "en" | "fa") {
  const locale = lang === "fa" ? "fa-IR-u-ca-persian" : "en-US";
  return new Date(iso).toLocaleString(locale, {
    weekday: "short",
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit"
  });
}

function Crest({ url, name }: { url: string | null; name: string }) {
  if (!url) return <span className="text-xl">🏳️</span>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={url} alt={name} className="h-6 w-6 object-contain" />;
}

export default function MatchCard({
  match,
  myPick,
  picks,
  lang,
  labels,
  showOtherPicks = true,
  myName,
  myEmoji,
  emojiMap
}: {
  match: MatchView;
  myPick: Pick | null;
  picks: { name: string; pick: Pick }[];
  lang: "en" | "fa";
  labels: Labels;
  showOtherPicks?: boolean;
  myName?: string;
  myEmoji?: string | null;
  emojiMap?: Record<string, string>;
}) {
  const router = useRouter();
  const [selected, setSelected] = useState<Pick | null>(myPick);
  const [busy, setBusy] = useState(false);
  const [showPicks, setShowPicks] = useState(false);

  const finished = match.status === "FINISHED" && match.result && match.result !== "VOID";
  const voided = match.result === "VOID" || match.status === "CANCELLED";

  const kickoffMs = new Date(match.kickoff_utc).getTime();
  const nowMs = Date.now();
  const msUntilKickoff = kickoffMs - nowMs;
  // "Not yet open" = more than 24 hours before kickoff
  const notYetOpen = msUntilKickoff > DAY_MS && ["SCHEDULED", "TIMED"].includes(match.status) && !finished && !voided;
  const locked =
    notYetOpen ||
    kickoffMs <= nowMs ||
    !["SCHEDULED", "TIMED"].includes(match.status) ||
    finished ||
    voided;

  async function choose(pick: Pick) {
    if (locked || busy) return;
    const prev = selected;
    setSelected(pick); // optimistic
    setBusy(true);
    const res = await fetch("/api/pick", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ matchId: match.id, pick })
    });
    setBusy(false);
    if (!res.ok) setSelected(prev);

  }

  const voters = (p: Pick) => picks.filter((x) => x.pick === p).map((x) => x.name);

  const option = (pick: Pick, title: string, sub?: string) => {
    const isMine = selected === pick;
    const isWinner = finished && match.result === pick;
    const names = voters(pick);
    const total = picks.length;
    const pct = total ? Math.round((names.length / total) * 100) : 0;

    let cls = "border-line bg-white";
    if (isWinner) cls = "border-gold bg-gold/10";
    else if (isMine && !finished) cls = "border-pitch bg-pitch/8 ring-2 ring-pitch/30";
    else if (isMine && finished) cls = match.result === pick ? "border-gold bg-gold/10" : "border-red-300 bg-red-50";

    return (
      <button
        onClick={() => choose(pick)}
        disabled={locked}
        className={`flex-1 rounded-xl border p-3 text-start transition-colors disabled:cursor-default ${cls} ${
          !locked ? "hover:border-pitch" : ""
        }`}
      >
        <div className="flex items-center justify-between gap-1">
          <span className="font-semibold leading-tight">{title}</span>
          <span className="flex shrink-0 items-center gap-1">
            {showOtherPicks && total > 0 && <span className="tnum text-xs text-muted">{pct}%</span>}
            {isWinner && <span className="text-gold">★</span>}
          </span>
        </div>
        {sub && <span className="text-xs text-muted">{sub}</span>}
        {showOtherPicks && (showPicks ? (
          <div className="mt-2 flex flex-wrap gap-1">
            {names.length === 0 ? (
              <span className="text-xs text-muted/70">—</span>
            ) : (
              names.map((n) => (
                <span
                  key={n}
                  className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/70"
                >
                  {emojiFor(n, emojiMap?.[n])} {n}
                </span>
              ))
            )}
          </div>
        ) : (
          <div className="mt-2 text-xs font-medium text-muted">
            {names.length > 0
              ? lang === "fa" ? `${names.length} نفر` : `${names.length} pick${names.length !== 1 ? "s" : ""}`
              : "—"}
          </div>
        ))}
        {!showOtherPicks && isMine && myName && (
          <div className="mt-2">
            <span className="rounded-full bg-ink/5 px-2 py-0.5 text-[11px] text-ink/70">
              {emojiFor(myName, myEmoji)} {myName}
            </span>
          </div>
        )}
      </button>
    );
  };

  return (
    <div className={`rounded-2xl bg-white p-4 shadow-card${notYetOpen ? " opacity-60" : ""}`}>
      {/* Top row: teams + status */}
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <Crest url={match.team_a_crest} name={match.team_a} />
            <span className="truncate font-semibold">{match.team_a}</span>
          </div>
          <div className="mt-1 flex items-center gap-2">
            <Crest url={match.team_b_crest} name={match.team_b} />
            <span className="truncate font-semibold">{match.team_b}</span>
          </div>
        </div>

        <div className="shrink-0 text-end">
          {finished ? (
            <div>
              <div className="text-xs text-muted">{labels.result}</div>
              <div className="tnum text-lg font-bold">
                {match.score_a}–{match.score_b}
              </div>
            </div>
          ) : voided ? (
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs text-muted">
              {labels.voided}
            </span>
          ) : notYetOpen ? (
            <div className="text-end">
              <div className="flex items-center justify-end gap-1 text-xs text-muted">
                <span>🔒</span>
                <span>{labels.opensIn} {fmtCountdown(msUntilKickoff - DAY_MS, lang)}</span>
              </div>
              <div className="tnum mt-0.5 text-xs text-muted/70">{fmtKickoff(match.kickoff_utc, lang)}</div>
            </div>
          ) : locked ? (
            <span className="rounded-full bg-ink/10 px-3 py-1 text-xs font-semibold text-muted">
              {labels.locked}
            </span>
          ) : (
            <div>
              <div className="text-xs text-muted">{labels.kicksOff}</div>
              <div className="tnum text-sm font-medium">{fmtKickoff(match.kickoff_utc, lang)}</div>
            </div>
          )}
        </div>
      </div>

      {match.venue && (
        <p className="mt-2 flex items-center gap-1 text-xs text-muted">
          <span aria-hidden>📍</span>
          <span>{match.venue}</span>
        </p>
      )}

      {/* Result badge for the player */}
      {finished && selected && (
        <div className="mt-3">
          {match.result === selected ? (
            <span className="rounded-full bg-gold/15 px-3 py-1 text-xs font-semibold text-gold">
              ★ {labels.correct}
            </span>
          ) : (
            <span className="rounded-full bg-red-50 px-3 py-1 text-xs font-semibold text-red-500">
              {labels.missed}
            </span>
          )}
        </div>
      )}

      {/* Options */}
      <div className="mt-3 flex gap-2">
        {option("TEAM_A", match.team_a, labels.teamAWins)}
        {match.allows_draw && option("DRAW", labels.draw)}
        {option("TEAM_B", match.team_b, labels.teamBWins)}
      </div>

      {!match.allows_draw && !finished && !voided && (
        <p className="mt-2 text-xs text-muted">{labels.knockoutNote}</p>
      )}

      {showOtherPicks && picks.length > 0 && (
        <button
          onClick={() => setShowPicks((v) => !v)}
          className="mt-2 flex w-full items-center justify-center gap-1 text-xs font-medium text-muted transition-colors hover:text-ink"
        >
          <span>{showPicks ? (lang === "fa" ? "بستن" : "Hide picks") : (lang === "fa" ? "نمایش پیش‌بینی‌ها" : "Show picks")}</span>
          <span className={`inline-block transition-transform ${showPicks ? "rotate-180" : ""}`}>▾</span>
        </button>
      )}
    </div>
  );
}
