import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { syncIfStale } from "@/lib/football";
import { getStandings } from "@/lib/standings";
import { isFlagSeasonEnabled } from "@/lib/admin";
import Nav from "@/components/Nav";
import StandingsView, { type StandingsLabels } from "@/components/StandingsView";
import FlagWaveBackground from "@/components/FlagWaveBackground";

export const dynamic = "force-dynamic";

export default async function StandingsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  await syncIfStale();

  const lang = getLang();
  const tr = t(lang);
  const { groups, rounds, phase } = await getStandings(db());
  const flagOn = await isFlagSeasonEnabled(db());

  const labels: StandingsLabels = {
    groupsTab: tr.standingsGroups,
    bracketTab: tr.standingsBracket,
    groupWord: tr.standingsGroupWord,
    colP: tr.standingsColP,
    colW: tr.standingsColW,
    colD: tr.standingsColD,
    colL: tr.standingsColL,
    colGD: tr.standingsColGD,
    colPts: tr.standingsColPts,
    qualifyNote: tr.standingsQualify,
    bracketEmpty: tr.standingsBracketEmpty,
    tbd: tr.standingsTbd,
    rounds: {
      LAST_32: tr.roundLast32,
      LAST_16: tr.roundLast16,
      QUARTER_FINALS: tr.roundQuarter,
      SEMI_FINALS: tr.roundSemi,
      THIRD_PLACE: tr.roundThird,
      FINAL: tr.roundFinal
    }
  };

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="standings" />
      <main className={`mx-auto max-w-2xl px-5 py-6${flagOn ? " flag-wave-zone" : ""}`}>
        {flagOn && <FlagWaveBackground />}
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.standingsTitle}</h1>
        <StandingsView groups={groups} rounds={rounds} phase={phase} labels={labels} />
      </main>
    </>
  );
}
