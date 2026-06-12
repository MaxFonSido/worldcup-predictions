import { XMLParser } from "fast-xml-parser";

export type NewsItem = {
  title: string;
  link: string;
  date: number;
  source: string;
  summary: string;
  image: string;
};

type Feed = { url: string; source: string };

// English: BBC Sport football (full of World Cup coverage during the tournament).
// Farsi: Varzesh3. If the Farsi feed ever fails, we fall back to BBC so the tab is never empty.
const FEEDS: Record<string, Feed[]> = {
  en: [{ url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" }],
  fa: [{ url: "https://www.varzesh3.com/rss/all", source: "ورزش سه" }]
};
const FALLBACK: Feed = { url: "https://feeds.bbci.co.uk/sport/football/rss.xml", source: "BBC Sport" };

// ignoreAttributes:false so we can read image URLs (media:thumbnail url="...", etc.)
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
  // 1) Media RSS thumbnail (BBC)
  const thumb = attrUrl(it["media:thumbnail"]);
  if (thumb) return upgrade(thumb);
  // 2) Media RSS content
  const content = attrUrl(it["media:content"]);
  if (content) return upgrade(content);
  // 3) Enclosure (only if it's an image)
  const enc = it["enclosure"];
  const encNode = Array.isArray(enc) ? enc.find((e) => String((e as Record<string, unknown>)?.["@_type"] ?? "").startsWith("image")) : enc;
  const encType = String((encNode as Record<string, unknown>)?.["@_type"] ?? "");
  if (encNode && (encType === "" || encType.startsWith("image"))) {
    const u = attrUrl(encNode);
    if (u) return u;
  }
  // 4) First <img> inside the description/encoded content
  const html = String(it["content:encoded"] ?? it["description"] ?? "");
  const m = html.match(/<img[^>]+src=["']([^"']+)["']/i);
  if (m) return m[1];
  return "";
}

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
          image: pickImage(it)
        };
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
