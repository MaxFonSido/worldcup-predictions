// "Ey Vay Prediction" — fetches match odds and converts to win probabilities.
// Primary: The Odds API (free tier, 500 req/month).
// Fallback: rough estimate from FIFA rankings.

export type MatchOdds = {
  homeWin: number; // percentage 0–100
  draw: number;
  awayWin: number;
};

const ODDS_API = "https://api.the-odds-api.com/v4/sports/soccer_fifa_world_cup/odds";

export async function fetchMatchOdds(
  homeTeam: string,
  awayTeam: string
): Promise<MatchOdds> {
  const apiKey = process.env.ODDS_API_KEY;
  if (apiKey) {
    try {
      const odds = await fetchFromOddsApi(apiKey, homeTeam, awayTeam);
      if (odds) return odds;
    } catch {
      /* fall through to fallback */
    }
  }
  return estimateFromNames(homeTeam, awayTeam);
}

// Batch fetch all odds at once (saves API calls)
let oddsCache: { data: Record<string, MatchOdds>; ts: number } | null = null;

async function fetchFromOddsApi(
  apiKey: string,
  homeTeam: string,
  awayTeam: string
): Promise<MatchOdds | null> {
  // Use cache if less than 2 hours old
  if (oddsCache && Date.now() - oddsCache.ts < 2 * 60 * 60 * 1000) {
    const key = matchKey(homeTeam, awayTeam);
    return oddsCache.data[key] ?? null;
  }

  const url = `${ODDS_API}?apiKey=${apiKey}&regions=us&markets=h2h&oddsFormat=decimal`;
  const res = await fetch(url, { cache: "no-store" });
  if (!res.ok) return null;
  const events = await res.json();
  if (!Array.isArray(events)) return null;

  const cache: Record<string, MatchOdds> = {};
  for (const event of events) {
    const home = event.home_team ?? "";
    const away = event.away_team ?? "";
    const bookmaker = event.bookmakers?.[0]; // use first available bookmaker
    if (!bookmaker) continue;
    const market = bookmaker.markets?.find(
      (m: Record<string, unknown>) => m.key === "h2h"
    );
    if (!market) continue;

    const outcomes = market.outcomes ?? [];
    const homeOdds = outcomes.find(
      (o: Record<string, unknown>) => o.name === home
    )?.price;
    const drawOdds = outcomes.find(
      (o: Record<string, unknown>) => o.name === "Draw"
    )?.price;
    const awayOdds = outcomes.find(
      (o: Record<string, unknown>) => o.name === away
    )?.price;

    if (homeOdds && drawOdds && awayOdds) {
      cache[matchKey(home, away)] = decimalToProb(homeOdds, drawOdds, awayOdds);
    }
  }

  oddsCache = { data: cache, ts: Date.now() };
  const key = matchKey(homeTeam, awayTeam);
  return cache[key] ?? null;
}

function matchKey(home: string, away: string): string {
  return `${home.toLowerCase().trim()}_${away.toLowerCase().trim()}`;
}

function decimalToProb(
  homeOdds: number,
  drawOdds: number,
  awayOdds: number
): MatchOdds {
  // Convert decimal odds to implied probabilities, then normalize
  const hProb = 1 / homeOdds;
  const dProb = 1 / drawOdds;
  const aProb = 1 / awayOdds;
  const total = hProb + dProb + aProb;
  return {
    homeWin: Math.round((hProb / total) * 100),
    draw: Math.round((dProb / total) * 100),
    awayWin: Math.round((aProb / total) * 100)
  };
}

// ─── Fallback: rough estimate from team strength ──────────────
// Simplified FIFA-ranking-style tiers. Not perfect, but better than nothing.
const TIER: Record<string, number> = {
  // Tier 1 — top favorites
  brazil: 95, france: 94, argentina: 93, england: 92, spain: 91, germany: 90,
  portugal: 89, netherlands: 88, belgium: 87, italy: 86,
  // Tier 2 — strong contenders
  croatia: 82, uruguay: 81, colombia: 80, mexico: 79, usa: 78,
  "united states": 78, denmark: 77, switzerland: 76, japan: 75,
  "korea republic": 74, "south korea": 74, senegal: 73, morocco: 73,
  // Tier 3 — solid teams
  iran: 70, australia: 69, canada: 68, ecuador: 68, sweden: 67,
  nigeria: 66, egypt: 65, cameroon: 65, ghana: 64, tunisia: 64,
  "ivory coast": 72, "côte d'ivoire": 72, "cote d'ivoire": 72,
  serbia: 66, poland: 67, ukraine: 66, peru: 65, chile: 65,
  // Tier 4 — underdogs
  "saudi arabia": 60, qatar: 58, "new zealand": 55, jordan: 55,
  uzbekistan: 57, iraq: 56, panama: 54, paraguay: 62,
  "south africa": 55, haiti: 48, jamaica: 50, "costa rica": 58,
  scotland: 63, wales: 62, norway: 65, austria: 66,
  algeria: 63, "bosnia and herzegovina": 60, bosnia: 60,
  // Tier 5 — debutants/minnows
  "cape verde": 45, "cape verde islands": 45, "cabo verde": 45,
  curacao: 38, "curaçao": 38,
};

function teamStrength(name: string): number {
  const lower = name.toLowerCase().trim();
  return TIER[lower] ?? 50;
}

function estimateFromNames(home: string, away: string): MatchOdds {
  const hStr = teamStrength(home);
  const aStr = teamStrength(away);
  const diff = hStr - aStr;

  // Logistic-ish conversion: bigger diff = more confident
  const hBase = 50 + diff * 0.8;
  const homeWin = Math.max(5, Math.min(95, Math.round(hBase)));
  const drawBase = Math.max(5, 28 - Math.abs(diff) * 0.5);
  const draw = Math.round(drawBase);
  const awayWin = Math.max(3, 100 - homeWin - draw);

  // Normalize to 100
  const total = homeWin + draw + awayWin;
  return {
    homeWin: Math.round((homeWin / total) * 100),
    draw: Math.round((draw / total) * 100),
    awayWin: Math.round((awayWin / total) * 100)
  };
}
