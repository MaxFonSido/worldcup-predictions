import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { emojiFor } from "@/lib/avatar";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [{ data: board }, { data: users }, { data: matches }, { data: myPreds }] =
    await Promise.all([
      supabase.from("leaderboard").select("id, display_name, golden_tokens"),
      supabase.from("users").select("id, champion_pick"),
      supabase.from("matches").select("id, stage, team_a, team_b, result, status, kickoff_utc"),
      supabase.from("predictions").select("match_id, pick").eq("user_id", session.userId)
    ]);

  const allMatches = matches ?? [];

  // The champion = winner of the finished final (null until it's played).
  let champion: string | null = null;
  const finalMatch = allMatches.find(
    (m) => m.stage === "FINAL" && m.status === "FINISHED" && (m.result === "TEAM_A" || m.result === "TEAM_B")
  );
  if (finalMatch) champion = finalMatch.result === "TEAM_A" ? finalMatch.team_a : finalMatch.team_b;
  const tournamentOver = champion !== null;

  const pickById = new Map((users ?? []).map((u) => [u.id, (u.champion_pick as string | null) ?? null]));

  const rows = (board ?? []).map((r) => {
    const champPick = pickById.get(r.id) ?? null;
    const diamond = champion !== null && champPick === champion;
    return {
      id: r.id as string,
      name: r.display_name as string,
      golden: (r.golden_tokens as number) ?? 0,
      champPick,
      diamond
    };
  });

  rows.sort(
    (a, b) => b.golden - a.golden || Number(b.diamond) - Number(a.diamond) || a.name.localeCompare(b.name)
  );

  // ---- Personal stats for the logged-in user ----
  const resultById = new Map(
    allMatches.map((m) => [m.id as string, { status: m.status, result: m.result, kickoff: m.kickoff_utc }])
  );
  const resolved = (myPreds ?? [])
    .map((p) => {
      const m = resultById.get(p.match_id as string);
      if (!m || m.status !== "FINISHED" || !m.result || m.result === "VOID") return null;
      return { correct: p.pick === m.result, kickoff: new Date(m.kickoff as string).getTime() };
    })
    .filter((x): x is { correct: boolean; kickoff: number } => x !== null)
    .sort((a, b) => a.kickoff - b.kickoff);

  const myGolden = resolved.filter((r) => r.correct).length;
  const myTotal = resolved.length;
  const winRate = myTotal ? Math.round((myGolden / myTotal) * 100) : 0;
  let streak = 0;
  for (let i = resolved.length - 1; i >= 0; i--) {
    if (resolved[i].correct) streak++;
    else break;
  }

  const someoneScored = rows.some((r) => r.golden > 0 || r.diamond);
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);
  const diamondHolders = rows.filter((r) => r.diamond).map((r) => r.name);

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="leaderboard" />

      <main className="mx-auto max-w-2xl px-5 py-6">
        {/* Finale banner — only when the tournament is decided */}
        {tournamentOver && rows.length > 0 && (
          <div className="mb-6 rounded-2xl bg-gradient-to-br from-gold to-amber-500 p-6 text-center text-white shadow-card">
            <p className="text-lg font-bold">{tr.finaleTitle}</p>
            <div className="mt-3 text-sm">
              <p className="opacity-90">{tr.finaleBracketWinner}</p>
              <p className="text-2xl font-extrabold">👑 {rows[0].name}</p>
            </div>
            <div className="mt-3 text-sm">
              <p className="opacity-90">{tr.finaleWorldCup}</p>
              <p className="text-xl font-bold">🏆 {champion}</p>
            </div>
            {diamondHolders.length > 0 && (
              <div className="mt-3 text-sm">
                <p className="opacity-90">{tr.finaleDiamonds}</p>
                <p className="font-semibold">💎 {diamondHolders.join("، ")}</p>
              </div>
            )}
          </div>
        )}

        {/* Personal stats */}
        <h2 className="mb-2 text-sm font-bold uppercase tracking-wide text-muted">{tr.yourStats}</h2>
        <div className="mb-6 grid grid-cols-3 gap-2">
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="tnum text-2xl font-bold text-gold">{myGolden}</div>
            <div className="text-xs text-muted">{tr.statGolden} 🪙</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="tnum text-2xl font-bold text-pitch-deep">{winRate}%</div>
            <div className="text-xs text-muted">{tr.statWinRate}</div>
          </div>
          <div className="rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="tnum text-2xl font-bold text-pitch-deep">{streak} 🔥</div>
            <div className="text-xs text-muted">{tr.statStreak}</div>
          </div>
        </div>

        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.leaderboard}</h1>

        {!someoneScored && (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">{tr.emptyBoard}</p>
        )}

        {someoneScored && (
          <ol className="space-y-2">
            {rows.map((r, i) => {
              const isMe = r.id === session.userId;
              return (
                <li
                  key={r.id}
                  className={`flex items-center justify-between rounded-2xl px-5 py-4 shadow-card ${
                    isMe ? "bg-pitch/8 ring-2 ring-pitch/30" : "bg-white"
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <span className="tnum w-8 text-center text-lg font-bold text-muted">
                      {medal(i) ?? i + 1}
                    </span>
                    <div>
                      <span className="font-semibold">
                        {emojiFor(r.name)} {r.name}
                        {isMe && <span className="ms-2 text-xs font-normal text-pitch">({tr.you})</span>}
                      </span>
                      {r.champPick && <div className="text-xs text-muted">🏆 {r.champPick}</div>}
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    {r.diamond && (
                      <span title={tr.diamondWord} className="text-lg">
                        💎
                      </span>
                    )}
                    <span className="tnum text-2xl font-bold text-gold">{r.golden}</span>
                    <span className="text-lg">🪙</span>
                  </div>
                </li>
              );
            })}
          </ol>
        )}
      </main>
    </>
  );
}
