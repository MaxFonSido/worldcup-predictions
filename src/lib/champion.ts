import { SupabaseClient } from "@supabase/supabase-js";

// All-time World Cup titles — used ONLY to sort the dropdown (most successful first).
// Countries not listed here count as 0 and fall to the bottom (alphabetically).
const TITLES: Record<string, number> = {
  Brazil: 5,
  Germany: 4,
  Italy: 4,
  Argentina: 3,
  France: 2,
  Uruguay: 2,
  England: 1,
  Spain: 1
};

export function titlesFor(country: string): number {
  return TITLES[country] ?? 0;
}

// The participating countries = every team that appears in a group-stage fixture.
// Deriving it from the synced fixtures means the list is always exactly the real
// 2026 participants — no hand-maintained country list to get wrong.
export async function getParticipants(db: SupabaseClient): Promise<string[]> {
  const { data } = await db.from("matches").select("team_a, team_b").eq("stage", "GROUP_STAGE");

  const set = new Set<string>();
  for (const m of data ?? []) {
    if (m.team_a && m.team_a !== "TBD") set.add(m.team_a);
    if (m.team_b && m.team_b !== "TBD") set.add(m.team_b);
  }

  return Array.from(set).sort((a, b) => {
    const byTitles = titlesFor(b) - titlesFor(a); // titles descending
    return byTitles !== 0 ? byTitles : a.localeCompare(b); // then A→Z
  });
}
