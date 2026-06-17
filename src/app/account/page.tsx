import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import Nav from "@/components/Nav";
import AccountPanel from "@/components/AccountPanel";

export const dynamic = "force-dynamic";

export default async function AccountPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const supabase = db();

  const { data: user } = await supabase
    .from("users")
    .select("email, avatar_emoji")
    .eq("id", session.userId)
    .maybeSingle();

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="account" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-6 text-xl font-bold text-pitch-deep">{tr.accountTitle}</h1>
        <AccountPanel
          currentEmoji={user?.avatar_emoji ?? null}
          currentEmail={user?.email ?? null}
          displayName={session.displayName}
          labels={{
            emojiTitle: tr.accountEmoji,
            emojiSub: tr.accountEmojiSub,
            emojiSaved: tr.accountEmojiSaved,
            emailTitle: tr.accountEmail,
            emailSub: tr.accountEmailSub,
            subscribed: tr.accountSubscribed,
            notSubscribed: tr.accountNotSubscribed,
          }}
        />
      </main>
    </>
  );
}
