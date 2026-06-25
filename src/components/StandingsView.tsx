"use client";

import { useState } from "react";
import type { Group, Round } from "@/lib/standings";

export type StandingsLabels = {
  groupsTab: string;
  bracketTab: string;
  groupWord: string;
  colP: string;
  colW: string;
  colD: string;
  colL: string;
  colGD: string;
  colPts: string;
  qualifyNote: string;
  bracketEmpty: string;
  tbd: string;
  rounds: Record<string, string>;
};

function Crest({ src }: { src: string | null }) {
  if (!src) return <span className="inline-block h-[18px] w-[18px] shrink-0 rounded-sm bg-line" />;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={src} alt="" className="h-[18px] w-[18px] shrink-0 object-contain" loading="lazy" />;
}

function GroupTable({ group, labels }: { group: Group; labels: StandingsLabels }) {
  return (
    <div className="overflow-hidden rounded-2xl bg-white shadow-card">
      <div className="border-b border-line px-4 py-2 text-sm font-bold text-pitch-deep">
        {labels.groupWord} {group.letter}
      </div>
      <table className="w-full tnum text-sm">
        <thead>
          <tr className="text-[11px] uppercase tracking-wide text-muted">
            <th className="w-6 py-1.5 text-center font-semibold">#</th>
            <th className="py-1.5 text-start font-semibold">—</th>
            <th className="w-6 py-1.5 text-center font-semibold">{labels.colP}</th>
            <th className="w-6 py-1.5 text-center font-semibold">{labels.colW}</th>
            <th className="w-6 py-1.5 text-center font-semibold">{labels.colD}</th>
            <th className="w-6 py-1.5 text-center font-semibold">{labels.colL}</th>
            <th className="w-8 py-1.5 text-center font-semibold">{labels.colGD}</th>
            <th className="w-8 py-1.5 text-center font-semibold">{labels.colPts}</th>
          </tr>
        </thead>
        <tbody>
          {group.rows.map((r, i) => {
            const qual = i < 2;
            return (
              <tr key={r.name} className={`border-t border-line ${qual ? "bg-pitch/5" : ""}`}>
                <td className="py-2 text-center">
                  <span
                    className={`inline-flex h-5 w-5 items-center justify-center rounded-full text-xs font-bold ${
                      qual ? "bg-pitch text-white" : "text-muted"
                    }`}
                  >
                    {i + 1}
                  </span>
                </td>
                <td className="py-2">
                  <div className="flex items-center gap-2">
                    <Crest src={r.crest} />
                    <span className="truncate font-medium text-ink">{r.name}</span>
                  </div>
                </td>
                <td className="py-2 text-center text-muted">{r.p}</td>
                <td className="py-2 text-center text-muted">{r.w}</td>
                <td className="py-2 text-center text-muted">{r.d}</td>
                <td className="py-2 text-center text-muted">{r.l}</td>
                <td className="py-2 text-center text-muted">{r.gd > 0 ? `+${r.gd}` : r.gd}</td>
                <td className="py-2 text-center font-bold text-ink">{r.pts}</td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="px-4 py-2 text-[11px] text-muted">{labels.qualifyNote}</div>
    </div>
  );
}

function BracketSide({
  name,
  crest,
  score,
  win,
  tbd
}: {
  name: string;
  crest: string | null;
  score: number | null;
  win: boolean;
  tbd: string;
}) {
  const isTbd = !name || name === "TBD";
  return (
    <div className={`flex items-center justify-between gap-2 ${win ? "" : "opacity-90"}`}>
      <div className="flex min-w-0 items-center gap-2">
        <Crest src={crest} />
        <span className={`truncate ${win ? "font-bold text-ink" : "text-ink"}`}>
          {isTbd ? tbd : name}
        </span>
      </div>
      {score != null && <span className={`tnum ${win ? "font-bold text-ink" : "text-muted"}`}>{score}</span>}
    </div>
  );
}

export default function StandingsView({
  groups,
  rounds,
  phase,
  labels
}: {
  groups: Group[];
  rounds: Round[];
  phase: "groups" | "bracket";
  labels: StandingsLabels;
}) {
  const [tab, setTab] = useState<"groups" | "bracket">(phase);
  const [sel, setSel] = useState(groups[0]?.letter ?? "");

  const current = groups.find((g) => g.letter === sel) ?? groups[0];

  const pill = (on: boolean) =>
    `flex-1 rounded-full px-3 py-1.5 text-sm font-semibold transition-colors ${
      on ? "bg-pitch text-white" : "text-muted"
    }`;

  return (
    <div>
      {/* Phase switch — defaults to the live stage */}
      <div className="mb-4 flex gap-1 rounded-full bg-white p-1 shadow-card">
        <button className={pill(tab === "groups")} onClick={() => setTab("groups")}>
          {labels.groupsTab}
        </button>
        <button className={pill(tab === "bracket")} onClick={() => setTab("bracket")}>
          {labels.bracketTab}
        </button>
      </div>

      {tab === "groups" ? (
        groups.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">—</p>
        ) : (
          <>
            <div className="mb-4 flex flex-wrap gap-1.5">
              {groups.map((g) => (
                <button
                  key={g.letter}
                  onClick={() => setSel(g.letter)}
                  className={`h-9 w-9 rounded-full text-sm font-bold transition-colors ${
                    g.letter === sel ? "bg-pitch text-white" : "bg-white text-muted shadow-card"
                  }`}
                >
                  {g.letter}
                </button>
              ))}
            </div>
            {current && <GroupTable group={current} labels={labels} />}
          </>
        )
      ) : rounds.length === 0 ? (
        <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">{labels.bracketEmpty}</p>
      ) : (
        <div className="space-y-6">
          {rounds.map((round) => (
            <div key={round.stage}>
              <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-pitch-deep">
                {labels.rounds[round.stage] ?? round.stage}
              </h2>
              <div className="space-y-2">
                {round.matches.map((m, i) => {
                  const kickoff = m.kickoff ? new Date(m.kickoff) : null;
                  const dateStr = kickoff
                    ? kickoff.toLocaleDateString("en-US", { weekday: "short", month: "short", day: "numeric" })
                    : null;
                  const timeStr = kickoff
                    ? kickoff.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit", timeZoneName: "short" })
                    : null;
                  return (
                    <div key={i} className="rounded-2xl bg-white p-3 shadow-card">
                      {(dateStr || m.venue) && (
                        <div className="mb-2 flex items-center justify-between text-[11px] text-muted">
                          {dateStr && <span>{dateStr} · {timeStr}</span>}
                          {m.venue && <span className="truncate ml-2 text-end">{m.venue}</span>}
                        </div>
                      )}
                      <div className="space-y-1.5">
                        <BracketSide
                          name={m.teamA}
                          crest={m.crestA}
                          score={m.scoreA}
                          win={m.winner === "A"}
                          tbd={labels.tbd}
                        />
                        <BracketSide
                          name={m.teamB}
                          crest={m.crestB}
                          score={m.scoreB}
                          win={m.winner === "B"}
                          tbd={labels.tbd}
                        />
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
