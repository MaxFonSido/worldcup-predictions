import Link from "next/link";
import { type Lang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { unreadChatCount } from "@/lib/chat";
import { isAdmin } from "@/lib/admin";
import LangToggle from "@/components/LangToggle";
import ChatBadge from "@/components/ChatBadge";
import AnnouncementStrip from "@/components/AnnouncementStrip";

export default async function Nav({
  lang,
  displayName,
  userId,
  active
}: {
  lang: Lang;
  displayName: string;
  userId: string;
  active: "matches" | "results" | "leaderboard" | "champion" | "chat" | "pool" | "admin" | "news";
}) {
  const tr = t(lang);
  const tab = (on: boolean) =>
    `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
      on ? "bg-white text-pitch-deep" : "text-white/85 hover:text-white"
    }`;

  const supabase = db();
  const [unread, admin] = await Promise.all([
    active === "chat" ? Promise.resolve(0) : unreadChatCount(supabase, userId),
    isAdmin(supabase, displayName)
  ]);

  return (
    <>
      <header className="pitch-stripes text-white">
        <div className="mx-auto max-w-2xl px-5 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚽️</span>
              <span className="font-bold">{tr.appName}</span>
            </div>
            <LangToggle current={lang} />
          </div>

          <div className="mt-4 flex flex-wrap items-center justify-between gap-y-2">
            <nav className="flex flex-wrap gap-1 rounded-full bg-black/15 p-1">
              <Link href="/matches" className={tab(active === "matches")}>
                {tr.matches}
              </Link>
              <Link href="/results" className={tab(active === "results")}>
                {tr.results}
              </Link>
              <Link href="/news" className={tab(active === "news")}>
                {tr.newsTab}
              </Link>
              <Link href="/leaderboard" className={tab(active === "leaderboard")}>
                {tr.leaderboard}
              </Link>
              <Link href="/champion" className={tab(active === "champion")}>
                {tr.championTab}
              </Link>
              <Link href="/chat" className={tab(active === "chat")}>
                {tr.chatTab}
                {active !== "chat" && <ChatBadge initial={unread} />}
              </Link>
              <Link href="/pool" className={tab(active === "pool")}>
                {tr.poolTab}
              </Link>
              {admin && (
                <Link href="/admin" className={tab(active === "admin")}>
                  {tr.adminTab}
                </Link>
              )}
            </nav>

            <div className="flex items-center gap-3">
              <span className="hidden text-sm text-white/85 sm:inline">
                {tr.hi}, {displayName}
              </span>
              <form action="/api/logout" method="post">
                <button className="text-sm text-white/70 underline hover:text-white">
                  {tr.logout}
                </button>
              </form>
            </div>
          </div>
        </div>
      </header>

      <AnnouncementStrip
        page={active}
        labels={{
          poolOpen: tr.stripPoolOpen,
          poolCta: tr.poolJoinShort,
          championOpen: tr.stripChampionOpen,
          championCta: tr.stripChampionCta,
          closesIn: tr.poolClosesIn
        }}
      />
    </>
  );
}
