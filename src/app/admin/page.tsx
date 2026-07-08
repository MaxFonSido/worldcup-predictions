import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { isAdmin, isRegistrationOpen, isKhalBalaVisible, isChampionPickingEnabled, isFlagSeasonEnabled, isMascotEnabled, isRibbonEnabled, isCelebrationVideoEnabled, getCelebrationVideoId } from "@/lib/admin";
import AdminMascotToggle from "@/components/AdminMascotToggle";
import AdminRibbonToggle from "@/components/AdminRibbonToggle";
import AdminCelebrationToggle from "@/components/AdminCelebrationToggle";
import Nav from "@/components/Nav";
import AdminPinReset from "@/components/AdminPinReset";
import AdminRegistrationToggle from "@/components/AdminRegistrationToggle";
import AdminSendDigest from "@/components/AdminSendDigest";
import AdminKhalBalaToggle from "@/components/AdminKhalBalaToggle";
import AdminChampionToggle from "@/components/AdminChampionToggle";
import AdminFlagToggle from "@/components/AdminFlagToggle";
import AdminForceSync from "@/components/AdminForceSync";

export const dynamic = "force-dynamic";

export default async function AdminPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const supabase = db();
  if (!(await isAdmin(supabase, session.displayName))) redirect("/matches");

  const lang = getLang();
  const tr = t(lang);

  const regOpen = await isRegistrationOpen(supabase);
  const khalBalaVisible = await isKhalBalaVisible(supabase);
  const championOpen = await isChampionPickingEnabled(supabase);
  const flagOn = await isFlagSeasonEnabled(supabase);
  const mascotOn = await isMascotEnabled(supabase);
  const ribbonOn = await isRibbonEnabled(supabase);
  const celebrationOn = await isCelebrationVideoEnabled(supabase);
  const celebrationId = await getCelebrationVideoId(supabase);

  const { data: users } = await supabase
    .from("users")
    .select("id, display_name")
    .order("display_name");
  const list = (users ?? []).map((u) => ({ id: u.id as string, name: u.display_name as string }));

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="admin" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.adminTitle}</h1>

        <section className="mb-6">
          <AdminForceSync />
        </section>

        <section className="mb-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{tr.adminRegTitle}</h2>
          <p className="mb-3 mt-1 text-sm text-muted">{tr.adminRegSub}</p>
          <AdminRegistrationToggle
            open={regOpen}
            labels={{
              stateOpen: tr.adminRegStateOpen,
              stateClosed: tr.adminRegStateClosed,
              close: tr.adminRegClose,
              open: tr.adminRegOpen
            }}
          />
        </section>

        <section>
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">{tr.adminPinTitle}</h2>
          <p className="mb-3 mt-1 text-sm text-muted">{tr.adminPinSub}</p>
          <AdminPinReset
            users={list}
            labels={{ newPin: tr.adminNewPin, reset: tr.adminReset, done: tr.adminResetDone }}
          />
        </section>

        <section className="mt-6">
          <AdminSendDigest />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">July 4th Flag Background 🇺🇸</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Show or hide the flag background across the entire app</p>
          <AdminFlagToggle enabled={flagOn} />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Champion Picking 🏆</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Show or hide the champion-picking banner for everyone</p>
          <AdminChampionToggle enabled={championOpen} />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">CR7 Mascot ⚽</h2>
          <p className="mb-3 mt-1 text-sm text-muted">The Siuuu mascot peeks in once per session on the Matches page</p>
          <AdminMascotToggle enabled={mascotOn} />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Mourning Ribbon 🖤🇵🇹</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Black ribbon on the top-left corner, in memory of Portugal</p>
          <AdminRibbonToggle enabled={ribbonOn} />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Celebration Video 🦈 (Shark Wins)</h2>
          <p className="mb-3 mt-1 text-sm text-muted">
            &quot;The Prediction&quot; premiere — save the YouTube ID, preview it yourself, then show to all.
            Auto-opens once per person; the banner stays for rewatching.
          </p>
          <AdminCelebrationToggle enabled={celebrationOn} videoId={celebrationId} />
        </section>

        <section className="mt-6">
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Khal Bala خال بالا</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Show or hide the Khal Bala banner for everyone</p>
          <AdminKhalBalaToggle visible={khalBalaVisible} />
        </section>
      </main>
    </>
  );
}
