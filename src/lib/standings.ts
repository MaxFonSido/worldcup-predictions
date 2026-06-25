import type { SupabaseClient } from "@supabase/supabase-js";

export type TeamRow = {
  name: string;
  crest: string | null;
  code: string | null;
  p: number;
  w: number;
  d: number;
  l: number;
  gf: number;
  ga: number;
  gd: number;
  pts: number;
};

export type Group = { key: string; letter: string; rows: TeamRow[] };

export type BracketMatch = {
  teamA: string;
  teamB: string;
  crestA: string | null;
  crestB: string | null;
  scoreA: number | null;
  scoreB: number | null;
  winner: "A" | "B" | null;
  status: string;
  kickoff: string;
};

export type Round = { stage: string; matches: BracketMatch[] };

export type Standings = { groups: Group[]; rounds: Round[]; phase: "groups" | "bracket" };

const KNOCKOUT = ["LAST_32", "LAST_16", "QUARTER_FINALS", "SEMI_FINALS", "THIRD_PLACE", "FINAL"];
const LIVE_OR_DONE = ["FINISHED", "IN_PLAY", "PAUSED"];

const STANDINGS_API = "https://api.football-data.org/v4/competitions/WC/standings";

// ESPN stage slug → our internal stage key
const ESPN_STAGE_MAP: Record<string, string> = {
  "round-of-32": "LAST_32",
  "round-of-16": "LAST_16",
  "quarterfinals": "QUARTER_FINALS",
  "semifinals": "SEMI_FINALS",
  "3rd-place-playoff": "THIRD_PLACE",
  "final": "FINAL",
};

// Fetch knockout bracket from ESPN — much faster to update than football-data.org
async function fetchEspnBracket(): Promise<Round[]> {
  // Knockout dates: Round of 32 (Jun 28–Jul 3), R16 (Jul 4–7), QF (Jul 9–11),
  // SF (Jul 14–15), 3rd place (Jul 18), Final (Jul 19)
  const dates = [
    "20260628", "20260629", "20260630",
    "20260701", "20260702", "20260703",
    "20260704", "20260705", "20260706", "20260707",
    "20260709", "20260710", "20260711",
    "20260714", "20260715",
    "20260718", "20260719",
  ];

  try {
    const results = await Promise.all(
      dates.map((d) =>
        fetch(`https://site.api.espn.com/apis/site/v2/sports/soccer/fifa.world/scoreboard?dates=${d}`, {
          next: { revalidate: 300 },
        })
          .then((r) => r.json())
          .then((data) => data.events ?? [])
          .catch(() => [])
      )
    );

    const allEvents = results.flat() as Record<string, unknown>[];

    // Group events by stage
    const byStage = new Map<string, BracketMatch[]>();

    for (const event of allEvents) {
      const season = event.season as Record<string, unknown> | undefined;
      const slug = season?.slug as string | undefined;
      if (!slug) continue;

      const stage = ESPN_STAGE_MAP[slug];
      if (!stage) continue;

      const competitions = (event.competitions as Record<string, unknown>[]) ?? [];
      const comp = competitions[0];
      if (!comp) continue;

      const competitors = (comp.competitors as Record<string, unknown>[]) ?? [];
      const home = competitors.find((c) => (c as Record<string, unknown>).homeAway === "home") as Record<string, unknown> | undefined;
      const away = competitors.find((c) => (c as Record<string, unknown>).homeAway === "away") as Record<string, unknown> | undefined;

      const homeTeam = home?.team as Record<string, unknown> | undefined;
      const awayTeam = away?.team as Record<string, unknown> | undefined;

      const homeName = (homeTeam?.displayName as string) ?? "TBD";
      const awayName = (awayTeam?.displayName as string) ?? "TBD";
      const homeLogo = (homeTeam?.logo as string) ?? null;
      const awayLogo = (awayTeam?.logo as string) ?? null;

      // Scores
      const homeScore = home?.score != null ? Number(home.score) : null;
      const awayScore = away?.score != null ? Number(away.score) : null;

      // Winner
      const status = (comp.status as Record<string, unknown>) ?? {};
      const statusType = (status.type as Record<string, unknown>) ?? {};
      const isFinished = statusType.completed === true;
      let winner: "A" | "B" | null = null;
      if (isFinished && homeScore != null && awayScore != null) {
        if (homeScore > awayScore) winner = "A";
        else if (awayScore > homeScore) winner = "B";
      }

      const kickoff = (event.date as string) ?? "";

      const match: BracketMatch = {
        teamA: homeName,
        teamB: awayName,
        crestA: homeLogo,
        crestB: awayLogo,
        scoreA: isFinished ? homeScore : null,
        scoreB: isFinished ? awayScore : null,
        winner,
        status: isFinished ? "FINISHED" : "SCHEDULED",
        kickoff,
      };

      const list = byStage.get(stage) ?? [];
      list.push(match);
      byStage.set(stage, list);
    }

    // Sort each stage by kickoff and return in knockout order
    return KNOCKOUT
      .map((stage) => {
        const matches = (byStage.get(stage) ?? []).sort(
          (a, b) => new Date(a.kickoff).getTime() - new Date(b.kickoff).getTime()
        );
        return { stage, matches };
      })
      .filter((r) => r.matches.length > 0);
  } catch (e) {
    console.error("fetchEspnBracket failed:", e);
    return [];
  }
}

type Row = {
  stage: string;
  group_name: string | null;
  team_a: string;
  team_b: string;
  team_a_code: string | null;
  team_b_code: string | null;
  team_a_crest: string | null;
  team_b_crest: string | null;
  status: string;
  result: string | null;
  score_a: number | null;
  score_b: number | null;
  kickoff_utc: string;
};

function letterOf(group: string): string {
  return group.replace(/^group[_\s]*/i, "").trim().toUpperCase();
}

// Fetch official standings from football-data.org API (correct FIFA tiebreakers).
async function fetchApiStandings(): Promise<Group[]> {
  const token = process.env.FOOTBALL_DATA_TOKEN;
  if (!token) return [];

  try {
    const res = await fetch(STANDINGS_API, {
      headers: { "X-Auth-Token": token },
      next: { revalidate: 300 } // cache 5 min
    });
    if (!res.ok) return [];
    const data = await res.json();

    const standings = data?.standings ?? [];
    const groups: Group[] = [];

    for (const group of standings) {
      if (group.type !== "TOTAL") continue;
      const groupName = group.group ?? "";
      const letter = letterOf(groupName);

      const rows: TeamRow[] = (group.table ?? []).map((t: Record<string, unknown>) => ({
        name: (t.team as Record<string, unknown>)?.name as string ?? "?",
        crest: (t.team as Record<string, unknown>)?.crest as string ?? null,
        code: (t.team as Record<string, unknown>)?.tla as string ?? null,
        p: (t.playedGames as number) ?? 0,
        w: (t.won as number) ?? 0,
        d: (t.draw as number) ?? 0,
        l: (t.lost as number) ?? 0,
        gf: (t.goalsFor as number) ?? 0,
        ga: (t.goalsAgainst as number) ?? 0,
        gd: (t.goalDifference as number) ?? 0,
        pts: (t.points as number) ?? 0
      }));

      groups.push({ key: groupName, letter, rows });
    }

    groups.sort((a, b) => a.letter.localeCompare(b.letter));
    return groups;
  } catch (e) {
    console.error("Failed to fetch API standings:", e);
    return [];
  }
}

export async function getStandings(supabase: SupabaseClient): Promise<Standings> {
  // Fetch official standings from the API
  const groups = await fetchApiStandings();

  // Knockout bracket from our synced match data
  const { data } = await supabase
    .from("matches")
    .select(
      "stage, group_name, team_a, team_b, team_a_code, team_b_code, team_a_crest, team_b_crest, status, result, score_a, score_b, kickoff_utc"
    )
    .order("kickoff_utc", { ascending: true });

  const all = (data ?? []) as Row[];

  // Use ESPN for the knockout bracket — it updates team names much faster
  const rounds = await fetchEspnBracket();

  // Detect which phase to show by default (use DB matches for status check)
  const knockoutStarted = all.some(
    (m) => KNOCKOUT.includes(m.stage) && LIVE_OR_DONE.includes(m.status)
  );

  return { groups, rounds, phase: knockoutStarted ? "bracket" : "groups" };
}
