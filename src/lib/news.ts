import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  date: number;
  source: string;
  summary: string;
};

type Feed = { url: string; source: string };

// English: BBC Sport football (full of World Cup coverage during the tournament).
// Farsi: Varzesh3. If the Farsi feed ever fails, we fall back to BBC so the tab is never empty.
const FEEDS: Record<string, Feed[]> = {
  en: [{ url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" }],
  fa: [{ url: "https://www.varzesh3.com/rss/all", source: "ورزش سه" }]
};
const FALLBACK: Feed = { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" };

const parser = new XMLParser({ ignoreAttributes: true });

async function fetchOne(feed: Feed): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: 900 }, // cache for 15 min so we don't hammer the feed
      headers: { "User-Agent": "Mozilla/5.0 (worldcup-predictions news reader)" }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const obj = parser.parse(xml);
    let items = obj?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items];
    return items
      .map((it: Record<string, unknown>): NewsItem => {
        const title = (it?.title ?? "").toString().trim();
        const link = (it?.link ?? "").toString().trim();
        const summary = (it?.description ?? "").toString().replace(/<[^>]*>/g, "").trim().slice(0, 160);
        const ts = it?.pubDate ? new Date(it.pubDate as string).getTime() : 0;
        return { title, link, date: Number.isNaN(ts) ? 0 : ts, source: feed.source, summary };
      })
      .filter((n: NewsItem) => n.title && n.link);
  } catch {
    return [];
  }
}

export async function fetchNews(lang: string): Promise<NewsItem[]> {
  const feeds = FEEDS[lang] ?? FEEDS.en;
  let items = (await Promise.all(feeds.map(fetchOne))).flat();
  if (items.length === 0) items = await fetchOne(FALLBACK);
  items.sort((a, b) => b.date - a.date);
  return items.slice(0, 25);
}
