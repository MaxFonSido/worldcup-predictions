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

  const rounds: Round[] = KNOCKOUT.map((stage) => {
    const matches: BracketMatch[] = all
      .filter((m) => m.stage === stage)
      .map((m) => ({
        teamA: m.team_a,
        teamB: m.team_b,
        crestA: m.team_a_crest,
        crestB: m.team_b_crest,
        scoreA: m.score_a,
        scoreB: m.score_b,
        winner: m.result === "TEAM_A" ? "A" : m.result === "TEAM_B" ? "B" : null,
        status: m.status,
        kickoff: m.kickoff_utc
      }));
    return { stage, matches };
  }).filter((r) => r.matches.length > 0);

  // Detect which phase to show by default
  const knockoutStarted = all.some(
    (m) => KNOCKOUT.includes(m.stage) && LIVE_OR_DONE.includes(m.status)
  );

  return { groups, rounds, phase: knockoutStarted ? "bracket" : "groups" };
}
