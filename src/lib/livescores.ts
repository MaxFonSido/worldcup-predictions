// Fetches live World Cup scores from ESPN's public API (no key needed).
// We only use this for the live scoreboard overlay — everything else
// (picks, results, standings) still runs off football-data.org.

export type LiveMatch = {
  id: string;
  homeTeam: string;
  awayTeam: string;
  homeCode: string;
  awayCode: string;
  homeLogo: string;
  awayLogo: string;
  homeScore: string;
  awayScore: string;
  clock: string;       // e.g. "67:23"
  period: number;       // 1 = first half, 2 = second half
  status: "pre" | "in" | "post";
  statusText: string;   // e.g. "1st Half", "Halftime", "2nd Half", "FT"
  venue: string;
  group: string;
};

const ESPN_URL =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

export async function fetchLiveScores(): Promise<LiveMatch[]> {
  try {
    const res = await fetch(ESPN_URL, {
      headers: { "User-Agent": "Mozilla/5.0 (worldcup-predictions)" },
      next: { revalidate: 10 } // cache 10 seconds for near-real-time
    });
    if (!res.ok) return [];
    const data = await res.json();

    const events = data?.events ?? [];
    const matches: LiveMatch[] = [];

    for (const event of events) {
      const comp = event?.competitions?.[0];
      if (!comp) continue;

      const state = event?.status?.type?.state ?? "pre";
      // Only include live and very recently finished matches (last ~30 min)
      if (state !== "in") continue;

      const home = comp.competitors?.find(
        (c: Record<string, unknown>) => c.homeAway === "home"
      );
      const away = comp.competitors?.find(
        (c: Record<string, unknown>) => c.homeAway === "away"
      );
      if (!home || !away) continue;

      const clock = event?.status?.displayClock ?? "";
      const period = event?.status?.period ?? 0;
      const statusDetail = event?.status?.type?.shortDetail ?? "";

      let statusText = statusDetail;
      if (!statusText) {
        if (period === 1) statusText = "1st Half";
        else if (period === 2) statusText = "2nd Half";
        else statusText = "Live";
      }

      // Extract minute from clock (e.g. "67:23" → "67'")
      const minute = clock.includes(":") ? clock.split(":")[0] + "'" : clock;

      matches.push({
        id: String(event.id ?? ""),
        homeTeam: home.team?.displayName ?? home.team?.name ?? "?",
        awayTeam: away.team?.displayName ?? away.team?.name ?? "?",
        homeCode: home.team?.abbreviation ?? "",
        awayCode: away.team?.abbreviation ?? "",
        homeLogo: home.team?.logo ?? "",
        awayLogo: away.team?.logo ?? "",
        homeScore: String(home.score ?? "0"),
        awayScore: String(away.score ?? "0"),
        clock: minute,
        period,
        status: state as "pre" | "in" | "post",
        statusText,
        venue: comp.venue?.fullName ?? "",
        group: comp.notes?.[0]?.headline ?? ""
      });
    }

    return matches;
  } catch (e) {
    console.error("ESPN fetch failed:", e);
    return [];
  }
}
