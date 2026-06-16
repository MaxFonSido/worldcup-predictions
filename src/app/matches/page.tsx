import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db, TOTAL_MATCHES } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import Nav from "@/components/Nav";
import SubscribeBanner from "@/components/SubscribeBanner";
import LiveScoreboard from "@/components/LiveScoreboard";
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

  const [{ data: matches }, { data: allPicks }, { data: users }, { data: me }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc", { ascending: true }),
    supabase.from("predictions").select("match_id, user_id, pick"),
    supabase.from("users").select("id, display_name"),
    supabase.from("users").select("email").eq("id", session.userId).maybeSingle()
  ]);

  const isSubscribed = !!(me?.email);

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

  // Show ALL upcoming matches, ordered by kickoff time.
  // Each match card handles its own lock state (open within 24h, locked otherwise).
  const now = Date.now();
  const MATCH_TZ = "America/New_York";
  const dayKey = (iso: string) =>
    new Date(iso).toLocaleDateString("en-CA", { timeZone: MATCH_TZ });
  const dayLabel = (iso: string) =>
    new Date(iso).toLocaleDateString(lang === "fa" ? "fa-IR" : "en-US", {
      weekday: "long",
      month: "long",
      day: "numeric",
      timeZone: MATCH_TZ
    });

  const windowMatches = (matches ?? [])
    .filter(
      (m) => ["SCHEDULED", "TIMED"].includes(m.status) && new Date(m.kickoff_utc).getTime() > now
    )
    .sort((a, b) => new Date(a.kickoff_utc).getTime() - new Date(b.kickoff_utc).getTime());

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
    tapToPick: tr.tapToPick,
    opensIn: tr.opensIn
  };

  let lastDay: string | null = null;

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="matches" />
      <LiveScoreboard />
      <SubscribeBanner subscribed={isSubscribed} />

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
            const dk = dayKey(m.kickoff_utc);
            const showDateHeader = dk !== lastDay;
            lastDay = dk;

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
                {showDateHeader && (
                  <div className="px-1 pb-1 pt-5 text-sm font-bold text-pitch-deep first:pt-0">
                    {dayLabel(m.kickoff_utc)}
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
