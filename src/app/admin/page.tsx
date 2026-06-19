import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { isAdmin, isRegistrationOpen, isKhalBalaVisible } from "@/lib/admin";
import Nav from "@/components/Nav";
import AdminPinReset from "@/components/AdminPinReset";
import AdminRegistrationToggle from "@/components/AdminRegistrationToggle";
import AdminSendDigest from "@/components/AdminSendDigest";
import AdminKhalBalaToggle from "@/components/AdminKhalBalaToggle";

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
          <h2 className="text-sm font-bold uppercase tracking-wide text-muted">Khal Bala خال بالا</h2>
          <p className="mb-3 mt-1 text-sm text-muted">Show or hide the Khal Bala banner for everyone</p>
          <AdminKhalBalaToggle visible={khalBalaVisible} />
        </section>
      </main>
    </>
  );
}
