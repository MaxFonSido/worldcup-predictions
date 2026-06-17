import { type Lang, t } from "@/lib/i18n";
import { db } from "@/lib/db";
import { unreadChatCount } from "@/lib/chat";
import { isAdmin } from "@/lib/admin";
import LangToggle from "@/components/LangToggle";
import AnnouncementStrip from "@/components/AnnouncementStrip";
import BottomNav from "@/components/BottomNav";

export default async function Nav({
  lang,
  displayName,
  userId,
  active
}: {
  lang: Lang;
  displayName: string;
  userId: string;
  active: "matches" | "results" | "leaderboard" | "champion" | "chat" | "pool" | "admin" | "standings";
}) {
  const tr = t(lang);

  const supabase = db();
  const [unread, admin] = await Promise.all([
    active === "chat" ? Promise.resolve(0) : unreadChatCount(supabase, userId),
    isAdmin(supabase, displayName)
  ]);

  const bottomLabels = {
    matches: tr.matches,
    results: tr.results,
    ranking: tr.rankingTab,
    standings: tr.standingsTab,
    champion: tr.championTab,
    chat: tr.chatTab,
    prize: tr.prizeTab,
    admin: tr.adminTab,
    more: tr.moreTab,
    logout: tr.logout,
    hi: tr.hi,
  };

  return (
    <>
      {/* Sticky top bar: header + announcements */}
      <div className="sticky top-0 z-30">
        <header className="pitch-stripes text-white">
          <div className="mx-auto flex max-w-2xl items-center justify-between px-5 py-3">
            <div className="flex items-center gap-2">
              <span className="text-xl">⚽️</span>
              <span className="font-bold">{tr.appName}</span>
            </div>
            <LangToggle current={lang} />
          </div>
        </header>

        {/* Announcement banners (champion pick, pool, etc.) */}
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
      </div>

      {/* Bottom tab bar + More sheet */}
      <BottomNav
        active={active}
        labels={bottomLabels}
        displayName={displayName}
        isAdmin={admin}
        initialUnread={unread}
      />
    </>
  );
}
