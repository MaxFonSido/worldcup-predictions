import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  date: number;
  source: string;
  summary: string;
  image: string;
  buzz: boolean;
};

type Feed = { url: string; source: string };

// Straight news — BBC for English, Varzesh3 for Farsi.
const NEWS: Record<string, Feed[]> = {
  en: [{ url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" }],
  fa: [{ url: "https://www.varzesh3.com/rss/all", source: "ورزش سه" }]
};

// "Buzz" — English tabloid gossip, tagged and capped so it sprinkles rather than floods.
const BUZZ: Feed[] = [
  { url: "https://www.dailymail.co.uk/sport/football/index.rss", source: "Daily Mail" },
  { url: "https://www.mirror.co.uk/sport/football/?service=rss", source: "Mirror" }
];

const FALLBACK: Feed = { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" };

const BUZZ_CAP = 6; // most gossip items allowed into the blended feed

const WC_EN = /world cup/i;
const WC_FA = /جام جهانی/;

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

function attrUrl(node: unknown): string {
  if (!node) return "";
  const n = Array.isArray(node) ? node[0] : node;
  const url = (n as Record<string, unknown>)?.["@_url"];
  return typeof url === "string" ? url : "";
}

// BBC serves small thumbs (…/standard/240/…) — bump to a sharper width for a magazine look.
function upgrade(url: string): string {
  return url.replace("/standard/240/", "/standard/480/").replace("/standard/320/", "/standard/640/");
}

function pickImage(it: Record<string, unknown>): string {
  const thumb = attrUrl(it["media:thumbnail"]);
  if (thumb) return upgrade(thumb);
  const content = attrUrl(it["media:content"]);
  if (content) return upgrade(content);
  const enc = it["enclosure"];
  const encNode = Array.isArray(enc)
    ? enc.find((e) => String((e as Record<string, unknown>)?.["@_type"] ?? "").startsWith("image"))
    : enc;
  const encType = String((encNode as Record<string, unknown>)?.["@_type"] ?? "");
  if (encNode && (encType === "" || encType.startsWith("image"))) {
    const u = attrUrl(encNode);
    if (u) return u;
  }
  const html = String(it["content:encoded"] ?? it["description"] ?? "");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  return "";
}

async function fetchOne(feed: Feed, isBuzz: boolean): Promise<NewsItem[]> {
  try {
    const res = await fetch(feed.url, {
      next: { revalidate: 900 },
      headers: { "User-Agent": "Mozilla/5.0 (worldcup-predictions news reader)" }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const obj = parser.parse(xml);
    let items = obj?.rss?.channel?.item ?? [];
    if (!Array.isArray(items)) items = [items];
    return items
      .map((it: Record<string, unknown>): NewsItem => {
        const title = String(it?.title ?? "").trim();
        const link = String(it?.link ?? "").trim();
        const summary = String(it?.description ?? "").replace(/<[^>]*>/g, "").trim().slice(0, 160);
        const ts = it?.pubDate ? new Date(String(it.pubDate)).getTime() : 0;
        return {
          title,
          link,
          date: Number.isNaN(ts) ? 0 : ts,
          source: feed.source,
          summary,
          image: pickImage(it),
          buzz: isBuzz
        };
      })
      .filter((n: NewsItem) => n.title && n.link);
  } catch {
    return [];
  }
}

function isWorldCup(n: NewsItem, lang: string): boolean {
  const hay = `${n.title} ${n.summary}`;
  return lang === "fa" ? WC_FA.test(hay) : WC_EN.test(hay);
}

export async function fetchNews(lang: string): Promise<NewsItem[]> {
  const newsFeeds = NEWS[lang] ?? NEWS.en;

  let news = (await Promise.all(newsFeeds.map((f) => fetchOne(f, false)))).flat();
  news = news.filter((n) => isWorldCup(n, lang));

  // Gossip is English-only and World-Cup-filtered, then capped so it never dominates.
  let buzz: NewsItem[] = [];
  if (lang !== "fa") {
    buzz = (await Promise.all(BUZZ.map((f) => fetchOne(f, true)))).flat();
    buzz = buzz
      .filter((n) => WC_EN.test(`${n.title} ${n.summary}`))
      .sort((a, b) => b.date - a.date)
      .slice(0, BUZZ_CAP);
  }

  // Safety net: if the World Cup filter leaves no real news (e.g. a quiet day),
  // fall back to the unfiltered feed so the tab is never blank.
  if (news.length === 0) {
    news = await fetchOne(FALLBACK, false);
  }

  const items = [...news, ...buzz];
  items.sort((a, b) => b.date - a.date);
  return items.slice(0, 25);
}
