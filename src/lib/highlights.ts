import { XMLParser } from "fast-xml-parser";

export type Highlight = { id: string; title: string; date: number; thumb: string };

// Official "Full Game Highlights — 2026 FIFA World Cup" playlist (owner: FOX Sports,
// the US rights-holder). YouTube exposes a free RSS feed for any playlist.
const PLAYLIST_FEED =
  "https://www.youtube.com/feeds/videos.xml?playlist_id=PLSoN6Th-EepMUaxmTobuR_SBwVkdkxdfO";

const parser = new XMLParser({ ignoreAttributes: false, attributeNamePrefix: "@_" });

export async function fetchHighlights(): Promise<Highlight[]> {
  try {
    const res = await fetch(PLAYLIST_FEED, {
      next: { revalidate: 1800 }, // refresh every 30 min
      headers: { "User-Agent": "Mozilla/5.0 (worldcup-predictions)" }
    });
    if (!res.ok) return [];
    const xml = await res.text();
    const obj = parser.parse(xml);
    let entries = obj?.feed?.entry ?? [];
    if (!Array.isArray(entries)) entries = [entries];
    return entries
      .map((e: Record<string, unknown>): Highlight => {
        const id = String(e?.["yt:videoId"] ?? "").trim();
        const title = String(e?.title ?? "").trim();
        const ts = e?.published ? new Date(String(e.published)).getTime() : 0;
        return {
          id,
          title,
          date: Number.isNaN(ts) ? 0 : ts,
          thumb: id ? `https://img.youtube.com/vi/${id}/hqdefault.jpg` : ""
        };
      })
      .filter((h: Highlight) => h.id && h.title)
      .sort((a: Highlight, b: Highlight) => b.date - a.date)
      .slice(0, 15);
  } catch {
    return [];
  }
}
