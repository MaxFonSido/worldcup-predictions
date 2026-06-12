import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { isAdmin } from "@/lib/admin";
import { getPoolStatus, POOL_FEE } from "@/lib/pool";
import { emojiFor } from "@/lib/avatar";
import Nav from "@/components/Nav";
import PoolJoinForm from "@/components/PoolJoinForm";
import PoolPaidToggle from "@/components/PoolPaidToggle";

export const dynamic = "force-dynamic";

export default async function PoolPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [status, admin, { data: entries }, { data: board }, { data: users }, { data: finals }] =
    await Promise.all([
      getPoolStatus(supabase, session.userId),
      isAdmin(supabase, session.displayName),
      supabase.from("pool_entries").select("user_id, real_name, paid"),
      supabase.from("leaderboard").select("id, display_name, golden_tokens"),
      supabase.from("users").select("id, champion_pick"),
      supabase.from("matches").select("team_a, team_b, result, status").eq("stage", "FINAL")
    ]);

  // Champion (for the diamond tiebreak), known once the final is played.
  let champion: string | null = null;
  const finalMatch = (finals ?? []).find(
    (m) => m.status === "FINISHED" && (m.result === "TEAM_A" || m.result === "TEAM_B")
  );
  if (finalMatch) champion = finalMatch.result === "TEAM_A" ? finalMatch.team_a : finalMatch.team_b;

  const goldenById = new Map((board ?? []).map((r) => [r.id, (r.golden_tokens as number) ?? 0]));
  const nameById = new Map((board ?? []).map((r) => [r.id, r.display_name as string]));
  const champById = new Map((users ?? []).map((u) => [u.id, (u.champion_pick as string | null) ?? null]));

  const participants = (entries ?? []).map((e) => {
    const id = e.user_id as string;
    const diamond = champion !== null && champById.get(id) === champion;
    return {
      id,
      name: nameById.get(id) ?? "?",
      golden: goldenById.get(id) ?? 0,
      paid: !!e.paid,
      diamond
    };
  });
  participants.sort(
    (a, b) => b.golden - a.golden || Number(b.diamond) - Number(a.diamond) || a.name.localeCompare(b.name)
  );

  const paidCount = participants.filter((p) => p.paid).length;
  const pot = paidCount * POOL_FEE;
  const tournamentOver = champion !== null;
  const winner = tournamentOver ? participants.filter((p) => p.paid)[0] ?? null : null;

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="pool" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-1 text-xl font-bold text-pitch-deep">{tr.poolTitle}</h1>
        <p className="mb-4 text-sm text-muted">{tr.poolSub}</p>

        <div className="mb-4 rounded-2xl bg-gradient-to-br from-gold to-amber-500 p-5 text-center text-white shadow-card">
          <div className="text-sm opacity-90">{tr.poolPot}</div>
          <div className="text-3xl font-extrabold">${pot}</div>
          <div className="text-xs opacity-90">
            {paidCount} {tr.poolPlayers}
          </div>
        </div>

        {winner && (
          <div className="mb-4 rounded-2xl bg-pitch p-5 text-center text-white shadow-card">
            <div className="text-sm opacity-90">{tr.poolWinner}</div>
            <div className="text-2xl font-extrabold">👑 {winner.name}</div>
          </div>
        )}

        {!status.joined && status.open && (
          <PoolJoinForm labels={{ join: tr.poolJoin, yourName: tr.poolYourName, payNote: tr.poolPayNote }} />
        )}
        {status.joined && (
          <div className="mb-4 rounded-2xl bg-white p-4 text-center shadow-card">
            <div className="font-semibold text-pitch-deep">{tr.poolJoined}</div>
            <div className="mt-1 text-xs text-muted">{tr.poolPayNote}</div>
          </div>
        )}
        {!status.joined && !status.open && (
          <p className="mb-4 rounded-2xl bg-white p-4 text-center text-muted shadow-card">{tr.poolClosed}</p>
        )}

        <h2 className="mb-2 mt-6 text-sm font-bold uppercase tracking-wide text-muted">{tr.poolStandings}</h2>
        {participants.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">{tr.poolNobody}</p>
        ) : (
          <ol className="space-y-2">
            {participants.map((p, i) => (
              <li
                key={p.id}
                className="flex items-center justify-between rounded-2xl bg-white px-4 py-3 shadow-card"
              >
                <div className="flex items-center gap-3">
                  <span className="tnum w-6 text-center font-bold text-muted">{i + 1}</span>
                  <div>
                    <span className="font-semibold">
                      {emojiFor(p.name)} {p.name}
                    </span>
                    <div className="text-xs">
                      {p.paid ? (
                        <span className="text-pitch">✓ {tr.poolPaid}</span>
                      ) : (
                        <span className="text-amber-600">• {tr.poolPending}</span>
                      )}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {p.diamond && <span>💎</span>}
                  <span className="tnum text-xl font-bold text-gold">{p.golden}</span>
                  <span>🪙</span>
                  {admin && (
                    <PoolPaidToggle
                      userId={p.id}
                      paid={p.paid}
                      labels={{ markPaid: tr.poolMarkPaid, markUnpaid: tr.poolMarkUnpaid }}
                    />
                  )}
                </div>
              </li>
            ))}
          </ol>
        )}
      </main>
    </>
  );
}
