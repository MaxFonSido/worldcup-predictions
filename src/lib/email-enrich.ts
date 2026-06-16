import type { SupabaseClient } from "@supabase/supabase-js";

// ─── Country code → flag emoji ───────────────────────────────
const FLAGS: Record<string, string> = {
  AFG:"🇦🇫",ALB:"🇦🇱",ALG:"🇩🇿",AND:"🇦🇩",ANG:"🇦🇴",ARG:"🇦🇷",ARM:"🇦🇲",AUS:"🇦🇺",
  AUT:"🇦🇹",AZE:"🇦🇿",BAN:"🇧🇩",BEL:"🇧🇪",BIH:"🇧🇦",BRA:"🇧🇷",CAN:"🇨🇦",CHI:"🇨🇱",
  CHN:"🇨🇳",CIV:"🇨🇮",CMR:"🇨🇲",COD:"🇨🇩",COL:"🇨🇴",CPV:"🇨🇻",CRC:"🇨🇷",CRO:"🇭🇷",
  CUR:"🇨🇼",CZE:"🇨🇿",DEN:"🇩🇰",ECU:"🇪🇨",EGY:"🇪🇬",ENG:"🏴󠁧󠁢󠁥󠁮󠁧󠁿",ESP:"🇪🇸",
  FIN:"🇫🇮",FRA:"🇫🇷",GER:"🇩🇪",GHA:"🇬🇭",GRE:"🇬🇷",HAI:"🇭🇹",HUN:"🇭🇺",
  IDN:"🇮🇩",IND:"🇮🇳",IRN:"🇮🇷",IRQ:"🇮🇶",ISL:"🇮🇸",ISR:"🇮🇱",ITA:"🇮🇹",JAM:"🇯🇲",
  JOR:"🇯🇴",JPN:"🇯🇵",KOR:"🇰🇷",KSA:"🇸🇦",MAR:"🇲🇦",MEX:"🇲🇽",NED:"🇳🇱",NGA:"🇳🇬",
  NOR:"🇳🇴",NZL:"🇳🇿",OMA:"🇴🇲",PAN:"🇵🇦",PAR:"🇵🇾",PER:"🇵🇪",POL:"🇵🇱",POR:"🇵🇹",
  QAT:"🇶🇦",ROU:"🇷🇴",RSA:"🇿🇦",RUS:"🇷🇺",SCO:"🏴󠁧󠁢󠁳󠁣󠁴󠁿",SEN:"🇸🇳",SRB:"🇷🇸",
  SUI:"🇨🇭",SVN:"🇸🇮",SWE:"🇸🇪",TUN:"🇹🇳",TUR:"🇹🇷",UAE:"🇦🇪",UKR:"🇺🇦",URU:"🇺🇾",
  USA:"🇺🇸",UZB:"🇺🇿",WAL:"🏴󠁧󠁢󠁷󠁬󠁳󠁿",
  // Full-name fallbacks (some feeds use names, not codes)
};

export function flagFor(codeOrName: string): string {
  const code = codeOrName.toUpperCase().trim();
  if (FLAGS[code]) return FLAGS[code];
  // Try matching by first 3 chars of team name
  const lower = codeOrName.toLowerCase();
  if (lower.includes("brazil")) return "🇧🇷";
  if (lower.includes("argentin")) return "🇦🇷";
  if (lower.includes("germany")) return "🇩🇪";
  if (lower.includes("france")) return "🇫🇷";
  if (lower.includes("spain")) return "🇪🇸";
  if (lower.includes("england")) return "🏴󠁧󠁢󠁥󠁮󠁧󠁿";
  if (lower.includes("portugal")) return "🇵🇹";
  if (lower.includes("netherlands") || lower.includes("holland")) return "🇳🇱";
  if (lower.includes("belgium")) return "🇧🇪";
  if (lower.includes("morocco")) return "🇲🇦";
  if (lower.includes("japan")) return "🇯🇵";
  if (lower.includes("iran")) return "🇮🇷";
  if (lower.includes("croatia")) return "🇭🇷";
  if (lower.includes("uruguay")) return "🇺🇾";
  if (lower.includes("ecuador")) return "🇪🇨";
  if (lower.includes("mexico")) return "🇲🇽";
  if (lower.includes("united states") || lower.includes("usa")) return "🇺🇸";
  if (lower.includes("canada")) return "🇨🇦";
  if (lower.includes("saudi")) return "🇸🇦";
  if (lower.includes("australia")) return "🇦🇺";
  if (lower.includes("egypt")) return "🇪🇬";
  if (lower.includes("senegal")) return "🇸🇳";
  if (lower.includes("ghana")) return "🇬🇭";
  if (lower.includes("tunisia")) return "🇹🇳";
  if (lower.includes("ivory") || lower.includes("cote") || lower.includes("côte")) return "🇨🇮";
  if (lower.includes("nigeria")) return "🇳🇬";
  if (lower.includes("colombia")) return "🇨🇴";
  if (lower.includes("sweden")) return "🇸🇪";
  if (lower.includes("norway")) return "🇳🇴";
  if (lower.includes("scotland")) return "🏴󠁧󠁢󠁳󠁣󠁴󠁿";
  if (lower.includes("haiti")) return "🇭🇹";
  if (lower.includes("cape verde") || lower.includes("cabo verde")) return "🇨🇻";
  if (lower.includes("new zealand")) return "🇳🇿";
  if (lower.includes("panama")) return "🇵🇦";
  if (lower.includes("paraguay")) return "🇵🇾";
  if (lower.includes("curacao") || lower.includes("curaçao")) return "🇨🇼";
  if (lower.includes("bosnia")) return "🇧🇦";
  if (lower.includes("qatar")) return "🇶🇦";
  if (lower.includes("swiss") || lower.includes("switzerland")) return "🇨🇭";
  if (lower.includes("austria")) return "🇦🇹";
  if (lower.includes("jordan")) return "🇯🇴";
  if (lower.includes("algeria")) return "🇩🇿";
  if (lower.includes("iraq")) return "🇮🇶";
  if (lower.includes("uzbekistan")) return "🇺🇿";
  if (lower.includes("congo")) return "🇨🇩";
  if (lower.includes("czech") || lower.includes("czechia")) return "🇨🇿";
  if (lower.includes("korea")) return "🇰🇷";
  if (lower.includes("south africa")) return "🇿🇦";
  if (lower.includes("turkey") || lower.includes("türkiye")) return "🇹🇷";
  return "🏳️";
}

// ─── Venue coordinates for weather lookup ─────────────────────
const VENUE_COORDS: Record<string, { lat: number; lng: number; city: string }> = {
  "MetLife Stadium": { lat: 40.813, lng: -74.074, city: "New Jersey" },
  "New York New Jersey Stadium": { lat: 40.813, lng: -74.074, city: "New Jersey" },
  "SoFi Stadium": { lat: 33.953, lng: -118.339, city: "Los Angeles" },
  "Los Angeles Stadium": { lat: 33.953, lng: -118.339, city: "Los Angeles" },
  "AT&T Stadium": { lat: 32.747, lng: -97.093, city: "Dallas" },
  "Dallas Stadium": { lat: 32.747, lng: -97.093, city: "Dallas" },
  "Hard Rock Stadium": { lat: 25.958, lng: -80.239, city: "Miami" },
  "Miami Stadium": { lat: 25.958, lng: -80.239, city: "Miami" },
  "NRG Stadium": { lat: 29.685, lng: -95.411, city: "Houston" },
  "Houston Stadium": { lat: 29.685, lng: -95.411, city: "Houston" },
  "Mercedes-Benz Stadium": { lat: 33.755, lng: -84.401, city: "Atlanta" },
  "Atlanta Stadium": { lat: 33.755, lng: -84.401, city: "Atlanta" },
  "Lumen Field": { lat: 47.595, lng: -122.332, city: "Seattle" },
  "Seattle Stadium": { lat: 47.595, lng: -122.332, city: "Seattle" },
  "Levi's Stadium": { lat: 37.403, lng: -121.970, city: "San Francisco" },
  "San Francisco Bay Area Stadium": { lat: 37.403, lng: -121.970, city: "San Francisco" },
  "Gillette Stadium": { lat: 42.091, lng: -71.264, city: "Boston" },
  "Boston Stadium": { lat: 42.091, lng: -71.264, city: "Boston" },
  "Lincoln Financial Field": { lat: 39.901, lng: -75.167, city: "Philadelphia" },
  "Philadelphia Stadium": { lat: 39.901, lng: -75.167, city: "Philadelphia" },
  "Rose Bowl": { lat: 34.161, lng: -118.168, city: "Pasadena" },
  "BMO Field": { lat: 43.633, lng: -79.419, city: "Toronto" },
  "Toronto Stadium": { lat: 43.633, lng: -79.419, city: "Toronto" },
  "BC Place": { lat: 49.277, lng: -123.110, city: "Vancouver" },
  "Arrowhead Stadium": { lat: 39.049, lng: -94.484, city: "Kansas City" },
  "Kansas City Stadium": { lat: 39.049, lng: -94.484, city: "Kansas City" },
  "Estadio Azteca": { lat: 19.303, lng: -99.150, city: "Mexico City" },
  "Mexico City Stadium": { lat: 19.303, lng: -99.150, city: "Mexico City" },
  "Estadio BBVA": { lat: 25.670, lng: -100.244, city: "Monterrey" },
  "Monterrey Stadium": { lat: 25.670, lng: -100.244, city: "Monterrey" },
  "Estadio Akron": { lat: 20.682, lng: -103.462, city: "Guadalajara" },
  "Guadalajara Stadium": { lat: 20.682, lng: -103.462, city: "Guadalajara" },
};

export type VenueWeather = { city: string; temp: number; icon: string };

export async function getVenueWeather(venue: string | null): Promise<VenueWeather | null> {
  if (!venue) return null;
  // Try exact match first, then partial
  let coords = VENUE_COORDS[venue];
  if (!coords) {
    const key = Object.keys(VENUE_COORDS).find(
      (k) => venue.toLowerCase().includes(k.toLowerCase()) || k.toLowerCase().includes(venue.toLowerCase())
    );
    if (key) coords = VENUE_COORDS[key];
  }
  if (!coords) return null;

  try {
    const url = `https://api.open-meteo.com/v1/forecast?latitude=${coords.lat}&longitude=${coords.lng}&daily=temperature_2m_max,weathercode&timezone=America/New_York&forecast_days=1`;
    const res = await fetch(url, { next: { revalidate: 3600 } });
    if (!res.ok) return null;
    const data = await res.json();
    const tempC = data?.daily?.temperature_2m_max?.[0] ?? null;
    const code = data?.daily?.weathercode?.[0] ?? 0;
    if (tempC === null) return null;
    const tempF = Math.round(tempC * 9 / 5 + 32);
    const icon = code <= 1 ? "☀️" : code <= 3 ? "🌤️" : code <= 48 ? "🌫️" : code <= 67 ? "🌧️" : code <= 77 ? "❄️" : "⛈️";
    return { city: coords.city, temp: tempF, icon };
  } catch {
    return null;
  }
}

// ─── Yesterday's results with goal info from ESPN ─────────────
export type YesterdayMatch = {
  homeTeam: string;
  awayTeam: string;
  homeFlag: string;
  awayFlag: string;
  homeScore: number;
  awayScore: number;
  isDraw: boolean;
  headline: string; // e.g. goal scorers or notable event
};

export async function getYesterdayResults(supabase: SupabaseClient): Promise<YesterdayMatch[]> {
  // Yesterday in ET
  const now = new Date();
  const etDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const startUTC = new Date(`${etDate}T04:00:00.000Z`);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  const { data: matches } = await supabase
    .from("matches")
    .select("team_a, team_b, team_a_code, team_b_code, score_a, score_b, status, result")
    .eq("status", "FINISHED")
    .gte("kickoff_utc", startUTC.toISOString())
    .lte("kickoff_utc", endUTC.toISOString())
    .order("kickoff_utc", { ascending: true });

  if (!matches || matches.length === 0) return [];

  // Try to get goal details from ESPN
  let espnGoals = new Map<string, string>();
  try {
    const res = await fetch(
      `https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${etDate.replace(/-/g, "")}`,
      { cache: "no-store", headers: { "User-Agent": "Mozilla/5.0 (worldcup-predictions)" } }
    );
    if (res.ok) {
      const data = await res.json();
      for (const event of data?.events ?? []) {
        const comp = event?.competitions?.[0];
        if (!comp) continue;
        const home = comp.competitors?.find((c: Record<string, unknown>) => c.homeAway === "home");
        const away = comp.competitors?.find((c: Record<string, unknown>) => c.homeAway === "away");
        if (!home || !away) continue;
        const key = `${(home.team?.displayName ?? "").toLowerCase()}_${(away.team?.displayName ?? "").toLowerCase()}`;

        // Extract goals from details
        const details = comp.details ?? [];
        const goals = details
          .filter((d: Record<string, unknown>) => {
            const typeText = ((d.type as Record<string, unknown>)?.text ?? "").toString().toLowerCase();
            return typeText.includes("goal") && !typeText.includes("missed");
          })
          .map((d: Record<string, unknown>) => {
            const name = ((d.athletesInvolved as Array<Record<string, unknown>>)?.[0]?.displayName ?? "").toString();
            const clock = ((d.clock as Record<string, unknown>)?.displayValue ?? "").toString();
            const shortName = name.split(" ").pop() ?? name;
            return `${shortName} ${clock}`;
          });

        if (goals.length > 0) espnGoals.set(key, `⚽ ${goals.join(", ")}`);
      }
    }
  } catch { /* ESPN detail fetch failed, continue without goals */ }

  return matches.map((m) => {
    const homeFlag = flagFor(m.team_a_code ?? m.team_a);
    const awayFlag = flagFor(m.team_b_code ?? m.team_b);
    const isDraw = m.score_a === m.score_b;

    // Try to find ESPN goal details
    const key = `${m.team_a.toLowerCase()}_${m.team_b.toLowerCase()}`;
    let headline = espnGoals.get(key) ?? "";
    if (!headline) {
      // Reverse key order
      const revKey = `${m.team_b.toLowerCase()}_${m.team_a.toLowerCase()}`;
      headline = espnGoals.get(revKey) ?? "";
    }

    return {
      homeTeam: m.team_a,
      awayTeam: m.team_b,
      homeFlag,
      awayFlag,
      homeScore: m.score_a ?? 0,
      awayScore: m.score_b ?? 0,
      isDraw,
      headline
    };
  });
}

// ─── Family highlights ────────────────────────────────────────
export type FamilyHighlights = {
  bestPredictor: { name: string; correct: number; total: number } | null;
  biggestUpset: { match: string; correctCount: number; totalPlayers: number } | null;
  hottestStreak: { name: string; streak: number } | null;
  topThree: { name: string; tokens: number }[];
};

export async function getFamilyHighlights(supabase: SupabaseClient): Promise<FamilyHighlights> {
  // Yesterday in ET
  const now = new Date();
  const etDate = new Date(now.getTime() - 24 * 60 * 60 * 1000)
    .toLocaleDateString("en-CA", { timeZone: "America/New_York" });
  const startUTC = new Date(`${etDate}T04:00:00.000Z`);
  const endUTC = new Date(startUTC.getTime() + 24 * 60 * 60 * 1000 - 1);

  // Yesterday's finished matches
  const { data: yMatches } = await supabase
    .from("matches")
    .select("id, team_a, team_b, result")
    .eq("status", "FINISHED")
    .gte("kickoff_utc", startUTC.toISOString())
    .lte("kickoff_utc", endUTC.toISOString());

  // All users
  const { data: users } = await supabase.from("users").select("id, display_name");
  const nameById = new Map((users ?? []).map((u) => [u.id as string, u.display_name as string]));

  // Predictions for yesterday's matches
  const matchIds = (yMatches ?? []).map((m) => m.id);
  const { data: preds } = matchIds.length > 0
    ? await supabase.from("predictions").select("user_id, match_id, pick").in("match_id", matchIds)
    : { data: [] };

  // ── Best predictor yesterday ──
  const userCorrect = new Map<string, { correct: number; total: number }>();
  for (const p of preds ?? []) {
    const match = (yMatches ?? []).find((m) => m.id === p.match_id);
    if (!match || !match.result) continue;
    const uid = p.user_id as string;
    if (!userCorrect.has(uid)) userCorrect.set(uid, { correct: 0, total: 0 });
    const uc = userCorrect.get(uid)!;
    uc.total++;
    if (p.pick === match.result) uc.correct++;
  }
  let bestPredictor: FamilyHighlights["bestPredictor"] = null;
  let bestScore = 0;
  for (const [uid, stats] of userCorrect) {
    if (stats.correct > bestScore) {
      bestScore = stats.correct;
      bestPredictor = { name: nameById.get(uid) ?? "?", correct: stats.correct, total: stats.total };
    }
  }

  // ── Biggest upset (match where fewest people predicted correctly) ──
  let biggestUpset: FamilyHighlights["biggestUpset"] = null;
  let minCorrect = Infinity;
  for (const match of yMatches ?? []) {
    if (!match.result) continue;
    const matchPreds = (preds ?? []).filter((p) => p.match_id === match.id);
    const correctCount = matchPreds.filter((p) => p.pick === match.result).length;
    if (matchPreds.length > 0 && correctCount < minCorrect) {
      minCorrect = correctCount;
      biggestUpset = {
        match: `${match.team_a} vs ${match.team_b}`,
        correctCount,
        totalPlayers: matchPreds.length
      };
    }
  }

  // ── Hottest streak (current) ──
  const { data: allFinished } = await supabase
    .from("matches")
    .select("id, result")
    .eq("status", "FINISHED")
    .not("result", "is", null)
    .order("kickoff_utc", { ascending: false });

  const { data: allPreds } = await supabase
    .from("predictions")
    .select("user_id, match_id, pick");

  const predByUserMatch = new Map<string, string>();
  for (const p of allPreds ?? []) {
    predByUserMatch.set(`${p.user_id}_${p.match_id}`, p.pick as string);
  }

  let hottestStreak: FamilyHighlights["hottestStreak"] = null;
  let maxStreak = 0;
  for (const [uid, name] of nameById) {
    let streak = 0;
    for (const m of allFinished ?? []) {
      const pick = predByUserMatch.get(`${uid}_${m.id}`);
      if (!pick) break; // no prediction = streak broken
      if (pick === m.result) streak++;
      else break;
    }
    if (streak > maxStreak) {
      maxStreak = streak;
      hottestStreak = { name, streak };
    }
  }

  // ── Leaderboard top 3 ──
  const tokenCount = new Map<string, number>();
  for (const m of allFinished ?? []) {
    if (!m.result) continue;
    for (const p of allPreds ?? []) {
      if (p.match_id === m.id && p.pick === m.result) {
        const uid = p.user_id as string;
        tokenCount.set(uid, (tokenCount.get(uid) ?? 0) + 1);
      }
    }
  }
  const topThree = [...tokenCount.entries()]
    .sort((a, b) => b[1] - a[1])
    .slice(0, 3)
    .map(([uid, tokens]) => ({ name: nameById.get(uid) ?? "?", tokens }));

  return { bestPredictor, biggestUpset, hottestStreak, topThree };
}
