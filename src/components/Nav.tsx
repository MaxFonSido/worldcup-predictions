import Link from "next/link";
import { type Lang, t } from "@/lib/i18n";
import LangToggle from "@/components/LangToggle";

export default function Nav({
  lang,
  displayName,
  active
}: {
  lang: Lang;
  displayName: string;
  active: "matches" | "results" | "leaderboard" | "champion" | "chat";
}) {
  const tr = t(lang);
  const tab = (on: boolean) =>
    `px-3 py-2 rounded-full text-sm font-semibold transition-colors ${
      on ? "bg-white text-pitch-deep" : "text-white/85 hover:text-white"
    }`;

  return (
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
            <Link href="/leaderboard" className={tab(active === "leaderboard")}>
              {tr.leaderboard}
            </Link>
            <Link href="/champion" className={tab(active === "champion")}>
              {tr.championTab}
            </Link>
            <Link href="/chat" className={tab(active === "chat")}>
              {tr.chatTab}
            </Link>
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
  );
}
