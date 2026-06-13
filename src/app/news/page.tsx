import { redirect } from "next/navigation";
import { getSession } from "@/lib/session";
import { getLang, t } from "@/lib/i18n";
import { fetchNews } from "@/lib/news";
import Nav from "@/components/Nav";

export const dynamic = "force-dynamic";

function fmt(date: number, lang: string) {
  if (!date) return "";
  const locale = lang === "fa" ? "fa-IR" : "en-US";
  try {
    return new Date(date).toLocaleString(locale, {
      month: "short",
      day: "numeric",
      hour: "numeric",
      minute: "2-digit"
    });
  } catch {
    return "";
  }
}

export default async function NewsPage() {
  const session = await getSession();
  if (!session) redirect("/");

  const lang = getLang();
  const tr = t(lang);
  const items = await fetchNews(lang);

  return (
    <>
      <Nav lang={lang} displayName={session.displayName} userId={session.userId} active="news" />
      <main className="mx-auto max-w-2xl px-5 py-6">
        <h1 className="mb-4 text-xl font-bold text-pitch-deep">{tr.newsTitle}</h1>

        {items.length === 0 ? (
          <p className="rounded-2xl bg-white p-6 text-center text-muted shadow-card">{tr.newsEmpty}</p>
        ) : (
          <div className="space-y-2">
            {items.map((n, i) => (
              <a
                key={`${n.link}-${i}`}
                href={n.link}
                target="_blank"
                rel="noopener noreferrer"
                className="block rounded-2xl bg-white p-4 shadow-card transition-colors hover:bg-pitch/5"
              >
                {n.buzz && <span className="buzz-tag mb-1">🍵 {tr.newsBuzz}</span>}
                <div className="font-semibold leading-snug text-ink">{n.title}</div>
                {n.summary && <div className="mt-1 text-sm text-muted">{n.summary}</div>}
                {n.image && (
                  <div className="mt-3 aspect-[16/9] w-full overflow-hidden rounded-xl bg-line">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={n.image}
                      alt=""
                      loading="lazy"
                      className="h-full w-full object-cover"
                    />
                  </div>
                )}
                <div className="mt-2 text-xs text-muted">
                  {n.source}
                  {n.date ? ` · ${fmt(n.date, lang)}` : ""} ↗
                </div>
              </a>
            ))}
          </div>
        )}

        <p className="mt-4 text-center text-xs text-muted">{tr.newsFrom}</p>
      </main>
    </>
  );
}
