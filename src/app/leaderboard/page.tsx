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

  const { data } = await db()
    .from("leaderboard")
    .select("id, display_name, golden_tokens")
    .order("golden_tokens", { ascending: false })
    .order("display_name", { ascending: true });

  const rows = data ?? [];
  const someoneScored = rows.some((r) => (r.golden_tokens ?? 0) > 0);

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
                    <span className="font-semibold">
                      {r.display_name}
                      {isMe && <span className="ms-2 text-xs font-normal text-pitch">({tr.you})</span>}
                    </span>
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="tnum text-2xl font-bold text-gold">{r.golden_tokens}</span>
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
