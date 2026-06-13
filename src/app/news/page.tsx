import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { fetchNews } from "@/lib/news";
import { fetchHighlights } from "@/lib/highlights";
import Nav from "@/components/Nav";
import NewsTabs from "@/components/NewsTabs";

export const dynamic = "force-dynamic";

export default async function NewsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const [news, highlights] = await Promise.all([fetchNews(lang), fetchHighlights()]);

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="news" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.newsTitle}</h1>
        <NewsTabs
          news={news}
          highlights={highlights}
          lang={lang}
          labels={{
            news: tr.newsToggleNews,
            highlights: tr.newsToggleHighlights,
            newsEmpty: tr.newsEmpty,
            newsFrom: tr.newsFrom,
            highlightsEmpty: tr.highlightsEmpty,
            buzz: tr.newsBuzz
          }}
        />
      </main>
    </>
  );
}
