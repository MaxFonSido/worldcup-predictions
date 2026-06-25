import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import Nav from "@/components/Nav";
import MatchCard, { type MatchView } from "@/components/MatchCard";

export const dynamic = "force-dynamic";

type Pick = "TEAM_A" | "TEAM_B" | "DRAW";

export default async function ResultsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  await syncIfStale();

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [{ data: matches }, { data: allPicks }, { data: users }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc", { ascending: false }),
    supabase.from("predictions").select("match_id, user_id, pick").limit(2000),
    supabase.from("users").select("id, display_name, avatar_emoji")
  ]);

  const nameById = new Map((users ?? []).map((u) => [u.id, u.display_name as string]));
  const emojiMap: Record<string, string> = {};
  for (const u of users ?? []) {
    if (u.avatar_emoji) emojiMap[u.display_name as string] = u.avatar_emoji;
  }

  const votersByMatch = new Map<string, { name: string; pick: Pick }[]>();
  const myPickByMatch = new Map<string, Pick>();

  for (const p of allPicks ?? []) {
    const list = votersByMatch.get(p.match_id) ?? [];
    list.push({ name: nameById.get(p.user_id) ?? "?", pick: p.pick as Pick });
    votersByMatch.set(p.match_id, list);
    if (p.user_id === session.userId) myPickByMatch.set(p.match_id, p.pick as Pick);
  }

  // Games that have started or finished (kickoff in the past), or were cancelled/voided.
  const now = Date.now();
  const past = (matches ?? []).filter(
    (m) =>
      new Date(m.kickoff_utc).getTime() <= now ||
      ["FINISHED", "IN_PLAY", "PAUSED", "CANCELLED", "SUSPENDED"].includes(m.status)
  );

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

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="results" />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.results}</h1>

        {past.length === 0 && (
          <p className="rounded-2xl bg-white p-8 text-center text-muted shadow-card">
            {tr.noResults}
          </p>
        )}

        <div className="space-y-3">
          {past.map((m) => {
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
              <MatchCard
                key={m.id}
                match={view}
                myPick={myPickByMatch.get(m.id) ?? null}
                picks={votersByMatch.get(m.id) ?? []}
                lang={lang}
                labels={labels}
                emojiMap={emojiMap}
              />
            );
          })}
        </div>
      </main>
    </>
  );
}
