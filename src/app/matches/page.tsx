import { redirect } from "next/navigation";
import { unstable_noStore as noStore } from "next/cache";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db, TOTAL_MATCHES } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import { isAdmin, isKhalBalaVisible, isChampionPickingEnabled } from "@/lib/admin";
import Nav from "@/components/Nav";
import LiveScoreboard from "@/components/LiveScoreboard";
import DayAccordion from "@/components/DayAccordion";
import MatchCard, { type MatchView } from "@/components/MatchCard";
import KhalBalaBanner from "@/components/KhalBalaBanner";
import ChampionBanner from "@/components/ChampionBanner";

export const dynamic = "force-dynamic";

type Pick = "TEAM_A" | "TEAM_B" | "DRAW";

export default async function MatchesPage() {
  const session = await getSession();
  if (!session) redirect("/");

  noStore(); // force Next.js to never cache this page's data reads
  await syncIfStale();

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [{ data: matches }, { data: allPicks }, { data: users }, { data: me }, { data: myPicksRaw }] = await Promise.all([
    supabase.from("matches").select("*").order("kickoff_utc", { ascending: true }),
    supabase.from("predictions").select("match_id, user_id, pick").limit(2000),
    supabase.from("users").select("id, display_name").limit(500),
    supabase.from("users").select("avatar_emoji").eq("id", session.userId).maybeSingle(),
    supabase.from("predictions").select("match_id, pick").eq("user_id", session.userId)
  ]);

  const [admin, khalBalaVisible, championOpen] = await Promise.all([
    isAdmin(supabase, session.displayName),
    isKhalBalaVisible(supabase),
    isChampionPickingEnabled(supabase),
  ]);
  const showKhalBala = admin || khalBalaVisible;

  const myEmoji = me?.avatar_emoji ?? null;

  const nameById = new Map((users ?? []).map((u) => [u.id, u.display_name as string]));

  // My picks — sourced from the dedicated per-user query, never capped
  const myPickByMatch = new Map<string, Pick>();
  for (const p of myPicksRaw ?? []) {
    myPickByMatch.set(p.match_id, p.pick as Pick);
  }
  const myPickCount = myPicksRaw?.length ?? 0;

  // All picks — used for the voters display on each card
  const votersByMatch = new Map<string, { name: string; pick: Pick }[]>();
  for (const p of allPicks ?? []) {
    const list = votersByMatch.get(p.match_id) ?? [];
    list.push({ name: nameById.get(p.user_id) ?? `User-${p.user_id.slice(0, 4)}`, pick: p.pick as Pick });
    votersByMatch.set(p.match_id, list);
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

  // Group matches by day
  const DAY_MS = 24 * 60 * 60 * 1000;
  type DayGroup = { key: string; label: string; hasUnlocked: boolean; matches: typeof windowMatches };
  const dayGroups: DayGroup[] = [];
  const seenDays = new Set<string>();

  for (const m of windowMatches) {
    const dk = dayKey(m.kickoff_utc);
    if (!seenDays.has(dk)) {
      seenDays.add(dk);
      dayGroups.push({ key: dk, label: dayLabel(m.kickoff_utc), hasUnlocked: false, matches: [] });
    }
    const group = dayGroups[dayGroups.length - 1];
    group.matches.push(m);
    // A match is "unlocked" if within 24h of kickoff
    if (new Date(m.kickoff_utc).getTime() - now <= DAY_MS) {
      group.hasUnlocked = true;
    }
  }

  // Auto-open: first day with an unlocked match, or the first day if all are locked
  const autoOpenKey = dayGroups.find((g) => g.hasUnlocked)?.key ?? dayGroups[0]?.key ?? "";

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="matches" />
      <LiveScoreboard />

      <main className="mx-auto max-w-2xl px-5 py-6">
        {championOpen && <ChampionBanner text={tr.championBannerText} />}
        {showKhalBala && <KhalBalaBanner />}

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

        <div className="space-y-4">
          {dayGroups.map((group) => (
            <DayAccordion
              key={group.key}
              label={group.label}
              matchCount={group.matches.length}
              defaultOpen={group.key === autoOpenKey}
            >
              {group.matches.map((m) => {
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
                    showOtherPicks={false}
                    myName={session.displayName}
                    myEmoji={myEmoji}
                  />
                );
              })}
            </DayAccordion>
          ))}
        </div>
      </main>
    </>
  );
}
