import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db, TOTAL_MATCHES } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import Nav from "@/components/Nav";
import MatchCard, { type MatchView } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

type Pick = "TEAM_A" | "TEAM_B" | "DRAW";

export default async function MatchesPage() {
  const session = await getSession();
  if (!session) redirect("/");

  await syncIfStale();

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [{ data: matches }, { data: allPicks }, { data: users }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc", { ascending: true }),
    supabase.from("predictions").select("match_id, user_id, pick"),
    supabase.from("users").select("id, display_name")
  ]);

  const nameById = new Map((users ?? []).map((u) => [u.id, u.display_name as string]));

  const votersByMatch = new Map<string, { name: string; pick: Pick }[]>();
  const myPickByMatch = new Map<string, Pick>();
  let myPickCount = 0;

  for (const p of allPicks ?? []) {
    const list = votersByMatch.get(p.match_id) ?? [];
    list.push({ name: nameById.get(p.user_id) ?? "?", pick: p.pick as Pick });
    votersByMatch.set(p.match_id, list);
    if (p.user_id === session.userId) {
      myPickByMatch.set(p.match_id, p.pick as Pick);
      myPickCount++;
    }
  }

  const picksLeft = Math.max(0, TOTAL_MATCHES - myPickCount);

  // Show only the games on the next match day (the soonest upcoming calendar date).
  // Group by date in a North-American zone so evening games stay on the same "day"
  // as afternoon ones (the published schedule's dates).
  const now = Date.now();
  const MATCH_TZ = "America/New_York";
  const dayKey = (iso: string) => new Date(iso).toLocaleDateString("en-CA", { timeZone: MATCH_TZ });

  const upcoming = (matches ?? [])
    .filter(
      (m) => ["SCHEDULED", "TIMED"].includes(m.status) && new Date(m.kickoff_utc).getTime() > now
    )
    .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());

  let windowMatches = upcoming;
  if (upcoming.length > 0) {
    const firstDay = dayKey(upcoming[0].kickoff_utc);
    windowMatches = upcoming.filter((m) => dayKey(m.kickoff_utc) === firstDay);
  }

  const labels = {
    teamAWins: tr.teamAWins,
    draw: tr.draw,
    teamBWins: tr.teamBWins,
    locked: tr.locked,
    kicksOff: tr.kicksOff,
    knockoutNote: tr.knockoutNote,
    everyonesPicks: tr.everyonesPicks,
    noPicksYet: tr.noPicksYet,
    correct: tr.correct,
    missed: tr.missed,
    voided: tr.voided,
    result: tr.result,
    tapToPick: tr.tapToPick
  };

  let lastStage: string | null = null;

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} active="matches" />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <div className="mb-5 flex items-center justify-between rounded-2xl bg-pitch-deep px-5 py-4 text-white">
          <span className="text-sm opacity-90">{tr.picksLeft}</span>
          <span className="tnum text-2xl font-bold">
            {picksLeft} <span className="text-base font-normal opacity-70">/ {TOTAL_MATCHES}</span>
          </span>
        </div>

        {windowMatches.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">
            {tr.noUpcoming}
          </p>
        )}

        <div className="space-y-3">
          {windowMatches.map((m) => {
            const stageLabel = m.stage === "GROUP_STAGE" ? tr.groupStage : tr.knockout;
            const showDivider = m.stage !== lastStage;
            lastStage = m.stage;

            const view: MatchView = {
              id: m.id,
              team_a: m.team_a,
              team_b: m.team_b,
              team_a_crest: m.team_a_crest,
              team_b_crest: m.team_b_crest,
              kickoff_utc: m.kickoff_utc,
              venue: m.venue ?? null,
              allows_draw: m.allows_draw,
              status: m.status,
              result: m.result,
              score_a: m.score_a,
              score_b: m.score_b
            };

            return (
              <div key={m.id}>
                {showDivider && (
                  <div className="px-1 pb-1 pt-4 text-xs font-bold uppercase tracking-wide text-muted first:pt-0">
                    {stageLabel}
                  </div>
                )}
                <MatchCard
                  match={view}
                  myPick={myPickByMatch.get(m.id) ?? null}
                  picks={votersByMatch.get(m.id) ?? []}
                  lang={lang}
                  labels={labels}
                />
              </div>
            );
          })}
        </div>
      </main>
    </>
  );
}
