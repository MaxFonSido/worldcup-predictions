import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import { getParticipants, titlesFor } from "@/lib/champion";
import Nav from "@/components/Nav";
import ChampionForm from "@/components/ChampionForm";

export const dynamic = "force-dynamic";

export default async function ChampionPage() {
  const session = await getSession();
  if (!session) redirect("/");

  await syncIfStale();

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const participants = await getParticipants(supabase);
  const options = participants.map((c) => ({ name: c, titles: titlesFor(c) }));

  const { data: me } = await supabase
    .from("users")
    .select("champion_pick")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} active="champion" />

      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-2 text-xl font-bold text-pitch-deep">{tr.championTitle}</h1>
        <p className="mb-5 text-sm text-muted">{tr.championSub}</p>

        <ChampionForm
          options={options}
          current={me?.champion_pick ?? null}
          labels={{
            choose: tr.championChoose,
            save: tr.championSave,
            saved: tr.championSaved,
            titlesWord: tr.championTitles
          }}
        />
      </main>
    </>
  );
}
