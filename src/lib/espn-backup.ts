// ESPN backup: when football-data.org leaves a match stuck as IN_PLAY,
// we check ESPN's public API for the final result and auto-fix it.
// This runs as part of the regular sync cycle.

import { db } from "./db";

const ESPN_SCOREBOARD =
  "https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard";

type EspnEvent = {
  competitions: {
    competitors: {
      homeAway: string;
      team: { displayName: string };
      score: string;
      winner?: boolean;
    }[];
  }[];
  status: {
    type: {
      state: string; // "pre" | "in" | "post"
      completed: boolean;
    };
  };
};

// How long a match can be IN_PLAY before we check ESPN (2.5 hours covers
// 90 min + halftime + extra time + penalties + buffer).
const STUCK_THRESHOLD_MS = 2.5 * 60 * 60 * 1000;

export async function fixStuckMatches(): Promise<number> {
  const supabase = db();

  // Find matches stuck as IN_PLAY or PAUSED that started more than 2.5 hours ago
  const cutoff = new Date(Date.now() - STUCK_THRESHOLD_MS).toISOString();
  const { data: stuck } = await supabase
    .from("matches")
    .select("id, team_a, team_b, kickoff_utc, status")
    .in("status", ["IN_PLAY", "PAUSED"])
    .lt("kickoff_utc", cutoff);

  if (!stuck || stuck.length === 0) return 0;

  // Fetch ESPN scoreboard
  let espnEvents: EspnEvent[] = [];
  try {
    const res = await fetch(ESPN_SCOREBOARD, {
      cache: "no-store",
      headers: { "User-Agent": "Mozilla/5.0 (worldcup-predictions)" }
    });
    if (!res.ok) return 0;
    const data = await res.json();
    espnEvents = data?.events ?? [];
  } catch {
    return 0;
  }

  let fixed = 0;

  for (const match of stuck) {
    // Find the matching ESPN event by team names
    const espn = espnEvents.find((ev) => {
      const comp = ev.competitions?.[0];
      if (!comp) return false;
      const teams = comp.competitors.map((c) =>
        c.team.displayName.toLowerCase()
      );
      return (
        teams.some((t) => match.team_a.toLowerCase().includes(t) || t.includes(match.team_a.toLowerCase())) &&
        teams.some((t) => match.team_b.toLowerCase().includes(t) || t.includes(match.team_b.toLowerCase()))
      );
    });

    if (!espn) continue;

    // Only fix if ESPN says the match is finished
    if (espn.status?.type?.state !== "post" || !espn.status?.type?.completed) continue;

    const comp = espn.competitions[0];
    const home = comp.competitors.find((c) => c.homeAway === "home");
    const away = comp.competitors.find((c) => c.homeAway === "away");
    if (!home || !away) continue;

    const scoreA = parseInt(home.score, 10);
    const scoreB = parseInt(away.score, 10);
    if (isNaN(scoreA) || isNaN(scoreB)) continue;

    let result: string;
    if (home.winner) result = "TEAM_A";
    else if (away.winner) result = "TEAM_B";
    else if (scoreA === scoreB) result = "DRAW";
    else result = scoreA > scoreB ? "TEAM_A" : "TEAM_B";

    await supabase
      .from("matches")
      .update({
        status: "FINISHED",
        result,
        score_a: scoreA,
        score_b: scoreB,
        updated_at: new Date().toISOString()
      })
      .eq("id", match.id);

    console.log(`ESPN backup fixed: ${match.team_a} vs ${match.team_b} → ${scoreA}-${scoreB} (${result})`);
    fixed++;
  }

  return fixed;
}
