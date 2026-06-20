import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import { getParticipants, titlesFor } from "@/lib/champion";
import { isChampionPickingEnabled } from "@/lib/admin";
import Nav from "@/components/Nav";
import ChampionForm from "@/components/ChampionForm";
import { emojiFor } from "@/lib/avatar";

export const dynamic = "force-dynamic";

export default async function ChampionPage() {
  const session = await getSession();
  if (!session) redirect("/");

  await syncIfStale();

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const [participants, championOpen, { data: users }] = await Promise.all([
    getParticipants(supabase),
    isChampionPickingEnabled(supabase),
    supabase.from("users").select("id, display_name, champion_pick, avatar_emoji")
  ]);

  const options = participants.map((c) => ({ name: c, titles: titlesFor(c) }));

  const locked = !championOpen;

  const me = (users ?? []).find((u) => u.id === session.userId);
  const myPick = (me?.champion_pick as string | null) ?? null;

  // Everyone's picks — visible to all.
  const everyone = (users ?? [])
    .filter((u) => u.champion_pick)
    .map((u) => ({
      name: u.display_name as string,
      country: u.champion_pick as string,
      emoji: (u.avatar_emoji as string | null) ?? null
    }))
    .sort((a, b) => a.name.localeCompare(b.name));

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="champion" />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-2 text-xl font-bold text-pitch-deep">{tr.championTitle}</h1>
        <p className="mb-5 text-sm text-muted">{tr.championSub}</p>

        <ChampionForm
          options={options}
          current={myPick}
          locked={locked}
          labels={{
            choose: tr.championChoose,
            save: tr.championSave,
            saved: tr.championSaved,
            titlesWord: tr.championTitles,
            lockNote: tr.championLockNote,
            lockedMsg: tr.championLocked
          }}
        />

        <h2 className="mb-2 mt-8 text-sm font-bold uppercase tracking-wide text-muted">
          {tr.everyonesPicks}
        </h2>
        {everyone.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">
            {tr.championNone}
          </p>
        ) : (
          <div className="space-y-2">
            {everyone.map((e) => (
              <div
                key={e.name}
                className="flex items-center justify-between rounded-xl bg-white px-4 py-3 shadow-card"
              >
                <span className="font-medium">{emojiFor(e.name, e.emoji)} {e.name}</span>
                <span className="font-semibold text-pitch-deep">🏆 {e.country}</span>
              </div>
            ))}
          </div>
        )}
      </main>
    </>
  );
}
