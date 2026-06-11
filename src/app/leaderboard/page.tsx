import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

export default async function LeaderboardPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [{ data: board }, { data: users }, { data: finals }] = await Promise.all([
    supabase.from("leaderboard").select("id, display_name, golden_tokens"),
    supabase.from("users").select("id, champion_pick"),
    supabase.from("matches").select("team_a, team_b, result, status").eq("stage", "FINAL")
  ]);

  // The champion = winner of the finished final (null until it's played).
  let champion: string | null = null;
  const finalMatch = (finals ?? []).find(
    (m) => m.status === "FINISHED" && (m.result === "TEAM_A" || m.result === "TEAM_B")
  );
  if (finalMatch) champion = finalMatch.result === "TEAM_A" ? finalMatch.team_a : finalMatch.team_b;

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

  // Rank by Golden Tokens, then the Diamond Token as the tiebreaker.
  rows.sort(
    (a, b) => b.golden - a.golden || Number(b.diamond) - Number(a.diamond) || a.name.localeCompare(b.name)
  );

  const someoneScored = rows.some((r) => r.golden > 0 || r.diamond);
  const medal = (i: number) => (i === 0 ? "🥇" : i === 1 ? "🥈" : i === 2 ? "🥉" : null);

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} active="leaderboard" />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.leaderboard}</h1>

        {!someoneScored && (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">
            {tr.emptyBoard}
          </p>
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
                        {r.name}
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
