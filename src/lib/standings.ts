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

export async function getStandings(supabase: SupabaseClient): Promise<Standings> {
  const { data } = await supabase
    .from("matches")
    .select(
      "stage, group_name, team_a, team_b, team_a_code, team_b_code, team_a_crest, team_b_crest, status, result, score_a, score_b, kickoff_utc"
    )
    .order("kickoff_utc", { ascending: true });

  const all = (data ?? []) as Row[];

  // ---- Group tables (computed live from finished matches) ----
  const groupMap = new Map<string, Map<string, TeamRow>>();
  for (const m of all) {
    if (m.stage !== "GROUP_STAGE" || !m.group_name) continue;
    if (!groupMap.has(m.group_name)) groupMap.set(m.group_name, new Map());
    const table = groupMap.get(m.group_name)!;

    const ensure = (name: string, crest: string | null, code: string | null): TeamRow => {
      if (!table.has(name)) {
        table.set(name, { name, crest, code, p: 0, w: 0, d: 0, l: 0, gf: 0, ga: 0, gd: 0, pts: 0 });
      }
      return table.get(name)!;
    };

    const a = ensure(m.team_a, m.team_a_crest, m.team_a_code);
    const b = ensure(m.team_b, m.team_b_crest, m.team_b_code);

    if (m.status === "FINISHED" && m.score_a != null && m.score_b != null) {
      a.p++;
      b.p++;
      a.gf += m.score_a;
      a.ga += m.score_b;
      b.gf += m.score_b;
      b.ga += m.score_a;
      if (m.score_a > m.score_b) {
        a.w++;
        b.l++;
        a.pts += 3;
      } else if (m.score_a < m.score_b) {
        b.w++;
        a.l++;
        b.pts += 3;
      } else {
        a.d++;
        b.d++;
        a.pts++;
        b.pts++;
      }
    }
  }

  const groups: Group[] = [...groupMap.entries()]
    .map(([key, table]) => {
      const rows = [...table.values()];
      rows.forEach((r) => (r.gd = r.gf - r.ga));
      // Tiebreak: points, goal difference, goals for, fewer losses, then name.
      rows.sort(
        (x, y) => y.pts - x.pts || y.gd - x.gd || y.gf - x.gf || x.l - y.l || x.name.localeCompare(y.name)
      );
      return { key, letter: letterOf(key), rows };
    })
    .sort((a, b) => a.letter.localeCompare(b.letter));

  // ---- Knockout bracket (read straight from synced fixtures) ----
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

  // ---- Which phase to show by default ----
  const knockoutStarted = all.some(
    (m) => KNOCKOUT.includes(m.stage) && LIVE_OR_DONE.includes(m.status)
  );

  return { groups, rounds, phase: knockoutStarted ? "bracket" : "groups" };
}
